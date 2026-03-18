import { create } from 'xmlbuilder2';
import { patientReports, hcpReports, familyReports } from '../../db/schema.js';

export type PatientReport = typeof patientReports.$inferSelect;
export type HCPReport = typeof hcpReports.$inferSelect;
export type FamilyReport = typeof familyReports.$inferSelect;

/** 
 * Unified Safety Report Type for E2B(R3) Generation
 * Supports Patient, HCP, and Family report tables.
 */
export type SafetyReport = PatientReport | HCPReport | FamilyReport;

/**
 * ICH E2B(R3) Object Identifiers (OIDs) per July 2025 Spec.
 */
const OID = {
  CASE_ID: '2.16.840.1.113883.3.989.2.1.3.1',
  WORLDWIDE_ID: '2.16.840.1.113883.3.989.2.1.3.2',
  MESSAGE_ID: '2.16.840.1.113883.3.989.2.1.3.22', // N.2.r.1
  MEDDRA: '2.16.840.1.113883.6.163',
  ISO3166: '1.0.3166.1.2.2',
  REPORT_TYPE: '2.16.840.1.113883.3.989.2.1.1.1',
  EXPEDITED_CONDITION: '2.16.840.1.113883.3.989.2.1.1.19',
  QUALIFICATION: '2.16.840.1.113883.3.989.2.1.1.6',
  GENDER: '1.0.5218',
  SENDER_TYPE: '2.16.840.1.113883.3.989.2.1.1.7',
  AMENDMENT_FLAG: '2.16.840.1.113883.3.989.2.1.1.5',
  TEST_NAME: '2.16.840.1.113883.6.163',
  UNIT_UCUM: '2.16.840.1.113883.6.8',
  CAUSALITY: '2.16.840.1.113883.3.989.2.1.1.19'
};

/**
 * Generates an E2B R3 (HL7 v3) XML from a Safety Report.
 * Mapping rules based on July 2025 ICSR Implementation Guide.
 */
export function generateE2BR3(report: SafetyReport, options: { senderId: string, receiverId: string, reportType?: 'Patient' | 'HCP' | 'Family' }): string {
  const now = new Date();

  // N.2.r.1: Message Identifier ({COUNTRY}-CLINSOLUTION-YYYYMMDDHHmmss-ID)
  const prefix = (report as any).countryCode || 'US';
  const messageDate = report.createdAt ? new Date(report.createdAt) : now;
  const timestampTS = messageDate.toISOString().replace(/[-:T]/g, '').split('.')[0];
  const messageId = `${prefix}-CLINSOLUTION-${timestampTS}-${(report.referenceId || report.id.substring(0, 8)).toUpperCase()}`;

  const timestamp = messageDate.toISOString().replace(/[-:T]/g, '').split('.')[0] + '+0000';

  /**
   * Expresses a date in HL7 v3 format with precision.
   * R3 requires specific CCYYMMDDHHMMSS format with optional offset.
   */
  const expressHL7Date = (d: string | Date | null | undefined, precision: 'second' | 'day' | 'year' = 'second') => {
    if (!d) return null;
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return null;
    const iso = date.toISOString().replace(/[-:T]/g, '').split('.')[0];
    let value = iso;
    if (precision === 'year') value = iso.substring(0, 4);
    else if (precision === 'day') value = iso.substring(0, 8);
    
    // R3 Standard often requires the timezone offset (+0000 for UTC)
    return value + '+0000';
  };

  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('MCCI_IN200100UV01', {
      ITSVersion: 'XML_1.0',
      xmlns: 'urn:hl7-org:v3',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation': 'urn:hl7-org:v3 MCCI_IN200100UV01.xsd',
    });

  // Header Section (N.2.r)
  doc.ele('id', { root: OID.MESSAGE_ID, extension: messageId }).up()
    .ele('creationTime', { value: timestamp }).up()
    .ele('interactionId', { root: '2.16.840.1.113883.1.6', extension: 'MCCI_IN200100UV01' }).up()
    .ele('processingCode', { code: 'P' }).up()
    .ele('processingModeCode', { code: 'T' }).up()
    .ele('acceptAckCode', { code: 'AL' }).up();

  // Receiver
  doc.ele('receiver', { typeCode: 'RCV' })
    .ele('device', { classCode: 'DEV', determinerCode: 'INSTANCE' })
      .ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.14', extension: options.receiverId || 'EVHUMAN' }).up()
    .up()
  .up();

  // Sender
  doc.ele('sender', { typeCode: 'SND' })
    .ele('device', { classCode: 'DEV', determinerCode: 'INSTANCE' })
      .ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.13', extension: options.senderId || 'CLINSOLUTION' }).up()
    .up()
  .up();


  // ── Step 1: Control Act Process ────────────────────────────
  const controlAct = doc.ele('controlActProcess', { classCode: 'CACT', moodCode: 'EVN' });
  
  // Investigation Event
  const investigationEvent = controlAct.ele('subject', { typeCode: 'SUBJ' })
    .ele('investigationEvent', { classCode: 'INVSTG', moodCode: 'EVN' });
  
  // ── Section C.1.6: Clinical Attachments (Embedded B64) ──────
  // The DB stores attachments as a JSONB array. 
  const attachments: any[] = (report.attachments as any[]) || [];
  attachments.forEach((att, attIdx) => {
    investigationEvent.ele('reference', { typeCode: 'REFR' })
      .ele('document', { classCode: 'DOC', moodCode: 'EVN' })
        .ele('code', { code: '1', codeSystem: '2.16.840.1.113883.3.989.2.1.1.27', displayName: 'clinicalDocument' }).up()
        .ele('title').txt(att.fileName || att.title || `Attachment-${attIdx}`).up()
        .ele('text', { mediaType: att.mimeType || 'application/pdf', representation: 'B64' }).txt(att.base64Data || att.content).up()
      .up()
    .up();
  });
  
  // C.1.3: Type of report (1=Spontaneous, 2=Report from study, 3=Other)
  let reportTypeCode = '3'; 
  const type = (report.reporterType || options.reportType || '').toUpperCase();
  if (type === 'HCP' || type === 'PATIENT' || type === 'SPONTANEOUS') reportTypeCode = '1';
  
  // C.1.1 & C.1.8.1: Safety Report Identifiers
  const reportIdSuffix = (report.safetyReportId || report.referenceId || report.id).toUpperCase();
  investigationEvent.ele('id', { root: OID.CASE_ID, extension: reportIdSuffix }).up()
    .ele('id', { root: OID.WORLDWIDE_ID, extension: reportIdSuffix }).up();

  investigationEvent.ele('code', { code: reportTypeCode, codeSystem: OID.REPORT_TYPE }).up()
    .ele('text').txt(report.additionalDetails || 'No additional details provided.').up()
    .ele('statusCode', { code: 'active' }).up()
    .ele('effectiveTime')
      .ele('low', { value: expressHL7Date(report.createdAt, 'second') || timestamp }).up()
    .up()
    // C.1.5: Date of Most Recent Information
    .ele('availabilityTime', { value: expressHL7Date(report.lastUpdatedAt || report.updatedAt || report.createdAt, 'day') || timestamp.substring(0, 8) }).up();

  // C.1.7: Expedited Report Criteria
  const isExpedited = report.severity === 'Fatal' || report.severity === 'Life-Threatening';
  investigationEvent.ele('component', { typeCode: 'COMP' })
    .ele('observationEvent', { classCode: 'OBS', moodCode: 'EVN' })
      .ele('code', { code: '23', codeSystem: OID.EXPEDITED_CONDITION }).up()
      .ele('value', { 'xsi:type': 'BL', value: isExpedited ? 'true' : 'false' }).up()
    .up().up();

  // C.1.11.1: Nullification / Amendment
  const reportStatus = (report as any).status || 'Initial';
  let amendmentCode = null;
  if (reportStatus === 'Nullification') amendmentCode = '1';
  else if (reportStatus === 'Amendment') amendmentCode = '2';

  if (amendmentCode) {
    investigationEvent.ele('subjectOf2', { typeCode: 'SUBJ' })
      .ele('investigationCharacteristic', { classCode: 'OBS', moodCode: 'EVN' })
        .ele('code', { code: '3', codeSystem: OID.AMENDMENT_FLAG }).up()
        .ele('value', { 'xsi:type': 'CE', code: amendmentCode, codeSystem: OID.AMENDMENT_FLAG }).up()
      .up().up();
  }

  // ── Step 2: Patient Details (D.1, D.2, etc.) ────────────────
  const pDetails: any = report.patientDetails || {};
  const patientRole = investigationEvent.ele('subject', { typeCode: 'SUBJ' })
    .ele('patient', { classCode: 'PAT' });
  
  const patientPerson = patientRole.ele('patientPerson', { classCode: 'PSN', determinerCode: 'INSTANCE' });

  if (pDetails.initials) {
    patientPerson.ele('name').txt(pDetails.initials).up();
  }

  // D.1.1.1 - D.1.1.4: Patient Medical Record Numbers
  if (pDetails.medicalRecordNumber) {
    patientPerson.ele('asIdentifiedEntity', { classCode: 'IDENT' })
      .ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.7', extension: pDetails.medicalRecordNumber }).up()
      .ele('code', { code: '1', codeSystem: '2.16.840.1.113883.3.989.2.1.1.4' }).up()
    .up();
  }

  if (pDetails.gender) {
    // ICH standard: 1=male, 2=female, 3=other, 0=unknown, 9=not specified
    let genderCode = '9';
    const g = pDetails.gender.toString().toUpperCase();
    if (g === 'M' || g === 'MALE' || g === '1') genderCode = '1';
    else if (g === 'F' || g === 'FEMALE' || g === '2') genderCode = '2';
    else if (g === 'O' || g === 'OTHER' || g === '3') genderCode = '3';
    else if (g === 'UNKNOWN' || g === '0') genderCode = '0';
    
    patientPerson.ele('administrativeGenderCode', { code: genderCode, codeSystem: OID.GENDER }).up();
  }

  if (pDetails.dob) {
    const dob = expressHL7Date(pDetails.dob, 'day');
    if (dob) patientPerson.ele('birthTime', { value: dob }).up();
  }

  // D.2.2a: Age at time of onset
  if (pDetails.ageValue) {
    patientRole.ele('subjectOf', { typeCode: 'SBJ' })
      .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
        .ele('code', { code: '3', codeSystem: '2.16.840.1.113883.3.989.2.1.1.11' }).up()
        .ele('value', { 'xsi:type': 'PQ', value: pDetails.ageValue, unit: 'a' }).up()
      .up();
  }

  // ── Step 2.1: Parent/Foetus Information (D.10) ────────────────
  if ((report as any).isParentChildReport && (report as any).parentDetails) {
    const parentDetails = (report as any).parentDetails;
    patientRole.ele('subjectOf', { typeCode: 'SBJ' })
      .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
        .ele('code', { code: '10', codeSystem: OID.REPORT_TYPE }).up() // Placeholder for D.10 root
        .ele('value', { 'xsi:type': 'ST' }).txt(parentDetails.initials || 'Masked').up()
      .up();
  }

  // ── Step 3: Product & Reaction (The core assessment) ────────
  // This is a simplified mapping for the demo. In a full system, 
  // we would loop through report.products and report.symptoms.
  const component = investigationEvent.ele('component', { typeCode: 'COMP' })
    .ele('adverseEventAssessment', { classCode: 'INVSTG', moodCode: 'EVN' });

  const subject1 = component.ele('subject1', { typeCode: 'SBJ' })
    .ele('primaryRole', { classCode: 'INVSBJ' });

  // Symptoms (Reactions) mapping to E.i.2.1b
  const symptoms: any[] = (report.symptoms as any[]) || [];
  symptoms.forEach((s, idx) => {
    const reactionObs = subject1.ele('subjectOf2', { typeCode: 'SBJ' })
      .ele('observation', { classCode: 'OBS', moodCode: 'EVN' });

      // E.i.2.1b: Reaction Code (MedDRA PT and LLT)
      const lltCode = s.lltCode || s.meddraCode;
      const ptCode = s.ptCode || lltCode; 

      reactionObs.ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.2', extension: s.reactionId || `REAC-${Date.now()}-${idx}` }).up()
        .ele('code', { code: 'ASSERTION', codeSystem: '2.16.840.1.113883.5.4' }).up();

      const valueNode = reactionObs.ele('value', { 
          'xsi:type': 'CE', 
          code: lltCode || ptCode, 
          codeSystem: OID.MEDDRA,
          displayName: s.lltName || s.name || s.meddraTerm 
        });
      
      valueNode.ele('originalText').txt(s.name || 'Unknown Symptom').up();
      
      if (ptCode && ptCode !== lltCode) {
        valueNode.ele('translation', {
          code: ptCode,
          codeSystem: OID.MEDDRA,
          displayName: s.ptName
        }).up();
      }
      valueNode.up();

    // E.i.4: Terminal Dates/Duration
    if (s.eventStartDate || s.eventEndDate) {
      const time = reactionObs.ele('effectiveTime');
      if (s.eventStartDate) {
        const start = expressHL7Date(s.eventStartDate);
        if (start) time.ele('low', { value: start }).up();
      }
      if (s.eventEndDate && s.eventEndDate !== 'Ongoing') {
        const end = expressHL7Date(s.eventEndDate);
        if (end) time.ele('high', { value: end }).up();
      }
      time.up();
    }

    // E.i.7: Outcome (Mapped as an outboundRelationship2 PERT code 27)
    if (s.outcome) {
      const outcomeMap: Record<string, string> = {
        'recovered': '1', 'recovered-lasting': '2', 'improved': '3',
        'ongoing': '4', 'death': '6', 'unknown': '0'
      };
      
      reactionObs.ele('outboundRelationship2', { typeCode: 'PERT' })
        .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
          .ele('code', { code: '27', codeSystem: '2.16.840.1.113883.3.989.2.1.1.11' }).up()
          .ele('value', { 'xsi:type': 'CE', code: outcomeMap[s.outcome] || '0', codeSystem: '2.16.840.1.113883.3.989.5.1.3.2.1.10' }).up()
        .up().up();
    }

    // E.i.3.2: Seriousness Criteria (Map severity to criteria - at event level)
    const severity = (report.severity || '').toLowerCase();
    const isSerious = severity !== '' && severity !== 'info' && severity !== 'low';
    if (isSerious) {
        let criteriaCode = '6'; 
        if (severity === 'fatal' || severity === 'death') criteriaCode = '1';
        else if (severity === 'life-threatening') criteriaCode = '2';
        else if (severity === 'hospitalization') criteriaCode = '3';
        else if (severity === 'disabling') criteriaCode = '4';
        
        reactionObs.ele('outboundRelationship2', { typeCode: 'PERT' })
          .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
            .ele('code', { code: '38', codeSystem: '2.16.840.1.113883.3.989.2.1.1.11' }).up()
            .ele('value', { 'xsi:type': 'CE', code: criteriaCode, codeSystem: '2.16.840.1.113883.3.989.2.1.1.10' }).up()
          .up().up();
    }

    // Treatment for this symptom
    if (s.treatment || s.symptomTreated === 'yes') {
       reactionObs.ele('outboundRelationship2', { typeCode: 'PERT' })
         .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
           .ele('code', { code: '11', codeSystem: '2.16.840.1.113883.3.989.2.1.1.11', displayName: 'treatmentComments' }).up()
           .ele('value', { 'xsi:type': 'ED' }).txt(s.treatment || 'Symptom was treated').up()
         .up().up();
    }

    // E.i.9: Country where reaction occurred
    const reactionCountry = s.countryCode || report.countryCode || 'US';
    reactionObs.ele('location', { typeCode: 'LOC' })
      .ele('locatedEntity', { classCode: 'LOCE' })
        .ele('locatedPlace', { classCode: 'COUNTRY', determinerCode: 'INSTANCE' })
          .ele('code', { code: reactionCountry, codeSystem: OID.ISO3166 }).up()
        .up().up().up();

    reactionObs.up().up();
  });

  // ── Section F.r: Results of Tests and Procedures ────────────────
  // Map labTests from DB (jsonb) to repeatable F.r blocks.
  const tests: any[] = (report.labTests as any[]) || [];
  tests.forEach((t, idx) => {
    const testOrganizer = subject1.ele('subjectOf2', { typeCode: 'SBJ' })
      .ele('organizer', { classCode: 'CATEGORY', moodCode: 'EVN' })
        .ele('code', { code: '3', codeSystem: '2.16.840.1.113883.3.989.2.1.1.20' }).up()
        .ele('component', { typeCode: 'COMP' })
          .ele('observation', { classCode: 'OBS', moodCode: 'EVN' });

    testOrganizer.ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.2', extension: `TEST-${idx}` }).up();

    // F.r.2.2b: Test Name (MedDRA)
    testOrganizer.ele('code', { 
      code: t.meddraCode || '10000000', 
      codeSystem: OID.MEDDRA, 
      displayName: t.testName || t.name 
    }).ele('originalText').txt(t.testName || t.name).up().up();

    // F.r.3.2: Test Result Value
    const val = t.testValue || t.result || t.resultValue;
    if (val) {
      testOrganizer.ele('value', { 
        'xsi:type': 'IVL_PQ', 
        value: val, 
        unit: t.unit || t.resultUnit || '1' 
      }).up();
    }

    if (t.testComments || t.testQualifier) {
        testOrganizer.ele('outboundRelationship2', { typeCode: 'PERT' })
            .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
                .ele('code', { code: '11', codeSystem: '2.16.840.1.113883.3.989.2.1.1.11' }).up()
                .ele('value', { 'xsi:type': 'ED' }).txt([t.testQualifier, t.testComments].filter(Boolean).join(': ')).up()
            .up().up();
    }

    testOrganizer.up().up().up();
  });

  // ── Step 3.5: Medical History (D.7.1) ──────────────────────
  const medHistory: any[] = Array.isArray(report.medicalHistory) ? report.medicalHistory : [];
  medHistory.forEach((mh, idx) => {
      const historyObs = patientRole.ele('subjectOf', { typeCode: 'SBJ' })
        .ele('observation', { classCode: 'OBS', moodCode: 'EVN' });
        
      historyObs.ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.2', extension: `HIST-${idx}` }).up()
        .ele('code', { code: '7', codeSystem: '2.16.840.1.113883.3.989.5.1.3.2.1.10', displayName: 'medicalHistory' }).up()
        .ele('value', { 
            'xsi:type': 'CE', 
            code: mh.meddraCode || '10000000', 
            codeSystem: OID.MEDDRA, 
            displayName: mh.meddraTerm || mh.condition 
        }).up();
      
      if (mh.startDate) {
          historyObs.ele('effectiveTime').ele('low', { value: expressHL7Date(mh.startDate, 'day') }).up().up();
      }
      
      historyObs.up().up();
  });

  // Products mapping to G.k.2.1
  const products: any[] = (report.products as any[]) || [];
  products.forEach((p, pIdx) => {
    const substAdmin = subject1.ele('subjectOf2', { typeCode: 'SBJ' })
      .ele('organizer', { classCode: 'CATEGORY', moodCode: 'EVN' })
        .ele('code', { code: '4', codeSystem: '2.16.840.1.113883.3.989.2.1.1.20' }).up()
        .ele('component', { typeCode: 'COMP' })
          .ele('substanceAdministration', { classCode: 'SBADM', moodCode: 'EVN' });

    substAdmin.ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.22', extension: `PROD-${pIdx}` }).up();

    // G.k.2.1.1/2: ISO IDMP Identifiers (MPID/PhPID)
    if (p.mpid) {
       substAdmin.ele('code', { code: p.mpid, codeSystem: '2.16.840.1.113883.3.989.2.1.1.24', displayName: 'MPID' }).up();
    } else if (p.phpid) {
       substAdmin.ele('code', { code: p.phpid, codeSystem: '2.16.840.1.113883.3.989.2.1.1.25', displayName: 'PhPID' }).up();
    }

    // G.k.4.r.1a: Dosage
    if (p.idmpDosageForm) {
       substAdmin.ele('formCode', { code: p.idmpDosageForm, codeSystem: '2.16.840.1.113883.3.989.2.1.1.14' }).up();
    }

    if (p.dosage) {
      substAdmin.ele('doseQuantity', { value: p.dosage.match(/\d+/)?.[0] || '1', unit: p.dosage.replace(/\d+/g, '').trim() || '1' }).up();
    }

    // G.k.5a/b: Cumulative Dose to First Reaction
    if (p.cumulativeDose) {
      substAdmin.ele('outboundRelationship2', { typeCode: 'PERT' })
        .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
          .ele('code', { code: '5', codeSystem: OID.REPORT_TYPE }).up()
          .ele('value', { 'xsi:type': 'PQ', value: p.cumulativeDose, unit: p.cumulativeDoseUnit || 'mg' }).up()
        .up().up();
    }

    // G.k.4.r.10: Route
    if (p.route) {
       substAdmin.ele('routeCode', { code: p.route.toUpperCase(), codeSystem: '2.16.840.1.113883.3.989.2.1.1.21' }).up();
    }

    const consumable = substAdmin.ele('consumable', { typeCode: 'CSM' })
      .ele('instanceOfKind', { classCode: 'INST' })
        .ele('kindOfProduct', { classCode: 'MMAT', determinerCode: 'KIND' });

    consumable.ele('name').txt(p.productName || p.name || 'Unknown Product').up();

    // G.k.2.3.r.1: Batch Number
    const batch = p.batches?.[0]?.batchNumber || p.batch;
    if (batch) {
      consumable.ele('lotNumberName').txt(batch).up();
    }

    // G.k.9.i: Drug-reaction Causality Matrix
    const reactions = (p.reactions as any[]) || [];
    reactions.forEach((r) => {
      substAdmin.ele('outboundRelationship2', { typeCode: 'PERT' })
        .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
          .ele('code', { code: '39', codeSystem: OID.CAUSALITY }).up()
          .ele('value', { 'xsi:type': 'CE', code: r.causalityCode || '1', codeSystem: OID.MEDDRA }).up()
          // Reference to Section E instance ID
          .ele('subject1', { typeCode: 'SUBJ' })
            .ele('adverseEffectReference', { classCode: 'OBS', moodCode: 'EVN' })
              .ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.2', extension: r.reactionId }).up()
            .up()
          .up()
        .up()
      .up();
    });

    // G.k.2.2: Indication (Reason for use)
    const indicationText = p.conditions?.[0]?.name || p.condition;
    if (indicationText) {
      substAdmin.ele('outboundRelationship2', { typeCode: 'RSON' })
        .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
          .ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.2', extension: `IND-${pIdx}` }).up()
          .ele('code', { code: '19', codeSystem: '2.16.840.1.113883.3.989.2.1.1.19' }).up()
          .ele('value', { 'xsi:type': 'CE' })
            .ele('originalText').txt(indicationText).up()
          .up()
        .up()
      .up();
    }

    // G.k.8: Action taken with drug
    if (p.actionTaken) {
      const actionMap: Record<string, string> = {
        'drug withdrawn': '1', 'dose reduced': '2', 'dose increased': '3', 
        'dose not changed': '4', 'unknown': '5', 'not applicable': '6'
      };
      const actionCode = actionMap[p.actionTaken.toLowerCase()] || '5';
      substAdmin.ele('outboundRelationship2', { typeCode: 'PERT' })
        .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
          .ele('code', { code: '28', codeSystem: '2.16.840.1.113883.3.989.2.1.1.11' }).up()
          .ele('value', { 'xsi:type': 'CE', code: actionCode, codeSystem: '2.16.840.1.113883.3.989.2.1.1.8', displayName: p.actionTaken }).up()
        .up().up();
    }

    substAdmin.up().up().up().up().up();
  });

  // ── Section G.k (Concomitant): Other Medications ──────────────
  const otherMeds: any[] = (report.otherMedications as any[]) || [];
  otherMeds.forEach((om, omIdx) => {
    const substAdmin = subject1.ele('subjectOf2', { typeCode: 'SBJ' })
      .ele('organizer', { classCode: 'CATEGORY', moodCode: 'EVN' })
        .ele('code', { code: '4', codeSystem: '2.16.840.1.113883.3.989.2.1.1.20' }).up()
        .ele('component', { typeCode: 'COMP' })
          .ele('substanceAdministration', { classCode: 'SBADM', moodCode: 'EVN' });

    substAdmin.ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.22', extension: `CONCOM-${omIdx}` }).up();
    
    // G.k.1 Characterization of drug role (2 = Concomitant)
    substAdmin.ele('outboundRelationship2', { typeCode: 'COMP' })
        .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
            .ele('code', { code: '6', codeSystem: OID.REPORT_TYPE }).up()
            .ele('value', { 'xsi:type': 'CE', code: '2', codeSystem: '2.16.840.1.113883.3.989.2.1.1.13' }).up()
        .up().up();

    if (om.startDate || om.endDate) {
        const time = substAdmin.ele('effectiveTime', { 'xsi:type': 'IVL_TS' });
        if (om.startDate) time.ele('low', { value: expressHL7Date(om.startDate, 'day') || '' }).up();
        if (om.endDate) time.ele('high', { value: expressHL7Date(om.endDate, 'day') || '' }).up();
        time.up();
    }

    const consumable = substAdmin.ele('consumable', { typeCode: 'CSM' })
      .ele('instanceOfKind', { classCode: 'INST' })
        .ele('kindOfProduct', { classCode: 'MMAT', determinerCode: 'KIND' });

    consumable.ele('name').txt(om.product || om.productName || 'Unknown Concomitant Drug').up().up().up();

    const indText = om.condition || om.reason;
    if (indText) {
      substAdmin.ele('outboundRelationship2', { typeCode: 'RSON' })
        .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
          .ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.2', extension: `CONCOM-IND-${omIdx}` }).up()
          .ele('code', { code: '19', codeSystem: '2.16.840.1.113883.3.989.2.1.1.19' }).up()
          .ele('value', { 'xsi:type': 'CE' }).ele('originalText').txt(indText).up().up()
        .up().up();
    }
    substAdmin.up().up().up().up();
  });

  // ── Step 4: Reporter Details (C.2.r) ────────────────────────
  // Robust mapping: Check reporterDetails (HCP reports) or hcpDetails (Patient reports)
  let hDetails: any = (report as any).reporterDetails || (report as any).hcpDetails || {};
  
  // If hcpDetails/reporterDetails is empty (no name/email/phone), fallback to patientDetails
  const isDetailsEmpty = !hDetails.firstName && !hDetails.lastName && !hDetails.name && !hDetails.email && !hDetails.phone;
  if (isDetailsEmpty && report.patientDetails) {
    hDetails = report.patientDetails;
  }
  
  const author = controlAct.ele('authorOrPerformer', { typeCode: 'AUT' })
    .ele('assignedEntity', { classCode: 'ASSIGNED' });
    
  // Use countryCode as fallback for reporter country if not in hDetails
  const reporterCountry = hDetails.country || (report as any).countryCode || 'US';

  if (hDetails.email) {
    author.ele('telecom', { value: `mailto:${hDetails.email}` }).up();
  } else if (hDetails.phone) {
    author.ele('telecom', { value: `tel:${hDetails.phone}` }).up();
  }

  const assignedPerson = author.ele('assignedPerson', { classCode: 'PSN', determinerCode: 'INSTANCE' });
  const rFirstName = hDetails.firstName || hDetails.name || hDetails.initials;
  const rLastName = hDetails.lastName;

  if (rFirstName || rLastName) {
    const name = assignedPerson.ele('name');
    if (rFirstName) name.ele('given').txt(rFirstName).up();
    if (rLastName) name.ele('family').txt(rLastName).up();
  } else {
    // E2B R3 requires a name, if missing we use MS (Masked) or Unknown
    assignedPerson.ele('name').ele('given', { nullFlavor: 'MS' }).up().up();
  }

  // C.2.r.3: Country & C.3.1: Sender Type
  author.ele('representedOrganization', { classCode: 'ORG', determinerCode: 'INSTANCE' })
    .ele('code', { code: '1', codeSystem: '2.16.840.1.113883.3.989.2.1.1.7' }).up()
    .ele('addr')
      .ele('country', { code: reporterCountry, codeSystem: '1.0.3166.1' }).up()
    .up()
  .up();

  // ── Step 5: Narrative (Section H) ─────────────────────────
  // H.1: Case Narrative
  investigationEvent.ele('outboundRelationship2', { typeCode: 'PERT' })
    .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
      .ele('code', { code: '11', codeSystem: '2.16.840.1.113883.3.989.2.1.1.11' }).up()
      .ele('value', { 'xsi:type': 'ED' }).txt(report.additionalDetails || 'No narrative provided.').up()
    .up().up();

  // H.2: Reporter's Comments
  if ((report as any).reporterComments) {
    investigationEvent.ele('outboundRelationship2', { typeCode: 'PERT' })
      .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
        .ele('code', { code: '10', codeSystem: '2.16.840.1.113883.3.989.2.1.1.11' }).up()
        .ele('value', { 'xsi:type': 'ED' }).txt((report as any).reporterComments).up()
      .up().up();
  }

  // H.3: Sender's Diagnosis (Structured)
  if ((report as any).senderDiagnosisCode) {
    investigationEvent.ele('outboundRelationship2', { typeCode: 'PERT' })
      .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
        .ele('code', { code: '15', codeSystem: '2.16.840.1.113883.3.989.2.1.1.11' }).up()
        .ele('value', { 'xsi:type': 'CE', code: (report as any).senderDiagnosisCode, codeSystem: OID.MEDDRA }).up()
      .up().up();
  }

  // H.5.r: Native Language Narratives
  const nativeNarratives: any[] = (report as any).nativeNarratives || [];
  
  // Condense skipped fields into the Narrative text
  let finalNarrative = report.additionalDetails || '';
  if (hDetails.relationship) {
      finalNarrative = `Reporter's Relationship to Patient: ${hDetails.relationship}\n\n` + finalNarrative;
  }
  
  // If the report was submitted in a non-English language, add it as a native narrative
  const subLang = (report as any).submissionLanguage || 'en';
  if (subLang !== 'en' && finalNarrative.trim() !== '') {
    nativeNarratives.push({
      languageCode: subLang.toUpperCase(),
      narrative: finalNarrative
    });
  }

  nativeNarratives.forEach(nn => {
    investigationEvent.ele('outboundRelationship2', { typeCode: 'PERT' })
      .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
        .ele('code', { code: '11', codeSystem: '2.16.840.1.113883.3.989.2.1.1.11' }).up()
        .ele('value', { 'xsi:type': 'ED', language: nn.languageCode || 'JA' }).txt(nn.narrative).up()
      .up().up();
  });

  // Return formatted XML
  return doc.end({ prettyPrint: true });
}
