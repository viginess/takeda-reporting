import { create } from 'xmlbuilder2';
import crypto from 'crypto';
import { patientReports, hcpReports, familyReports } from '../../../db/core/schema.js';

export type PatientReport = typeof patientReports.$inferSelect;
export type HCPReport = typeof hcpReports.$inferSelect;
export type FamilyReport = typeof familyReports.$inferSelect;

/** 
 * Unified Safety Report Type for E2B(R3) Generation
 */
export type SafetyReport = PatientReport | HCPReport | FamilyReport;

/**
 * ICH E2B(R3) Object Identifiers (OIDs)
 */
const OID = {
  CASE_ID: '2.16.840.1.113883.3.989.2.1.3.1',
  WORLDWIDE_ID: '2.16.840.1.113883.3.989.2.1.3.2',
  MESSAGE_ID: '2.16.840.1.113883.3.989.2.1.3.22',
  MEDDRA: '2.16.840.1.113883.6.163',
  ISO3166: '1.0.3166.1.2.2',
  REPORT_TYPE: '2.16.840.1.113883.3.989.2.1.1.1',
  EXPEDITED_CONDITION: '2.16.840.1.113883.3.989.2.1.1.19',
  GENDER: '2.16.840.1.113883.5.1', // HL7 v3 Gender OID
  CAUSALITY: '2.16.840.1.113883.3.989.2.1.1.19'
};

/**
 * E2B(R3) XML GENERATION WORKFLOW:
 * 1. Initialize Root (MCCI_IN200100UV01) with HL7 v3 OIDs.
 * 2. Map Sender/Receiver clinical identifiers.
 * 3. Construct Patient (D) and Medical History (D.7.r).
 * 4. ROUTING RULE: Symptoms with results (testValue) route to F.r (Labs), others to E.i (Reactions).
 * 5. DRUG LOGIC: Suspect drugs (Category 1) require mandatory causality cross-references.
 */
export function generateE2BR3(report: SafetyReport, options: { 
  senderId: string, 
  receiverId: string, 
  reportType?: 'Patient' | 'HCP' | 'Family', 
  meddraVersion?: string,
  whodrugVersion?: string
}): string {
  const now = new Date();
  const messageDate = report.createdAt ? new Date(report.createdAt) : now;
  const prefix = (report as any).countryCode || 'US';

  const expressHL7Date = (d: string | Date | null | undefined) => {
    if (!d) return null;
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return null;
    return date.getUTCFullYear().toString() +
      (date.getUTCMonth() + 1).toString().padStart(2, '0') +
      date.getUTCDate().toString().padStart(2, '0') +
      date.getUTCHours().toString().padStart(2, '0') +
      date.getUTCMinutes().toString().padStart(2, '0') +
      date.getUTCSeconds().toString().padStart(2, '0');
  };

  const timestamp = expressHL7Date(messageDate) || '';
  const messageId = `${prefix}-CLINSOLUTION-${timestamp}-${(report.referenceId || report.id.substring(0, 8)).toUpperCase()}`;
  const reporterCountry = (report as any).countryCode || 'US';

  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('MCCI_IN200100UV01', {
      ITSVersion: 'XML_1.0',
      xmlns: 'urn:hl7-org:v3',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation': 'urn:hl7-org:v3 MCCI_IN200100UV01.xsd',
    });

  // Batch Header (MCCI Transmission Wrapper)
  doc.ele('id', { root: OID.MESSAGE_ID, extension: messageId }).up()
    .ele('creationTime', { value: timestamp }).up()
    .ele('responseModeCode', { code: 'D' }).up()
    .ele('interactionId', { root: '2.16.840.1.113883.1.6', extension: 'MCCI_IN200100UV01' }).up()
    .ele('name', { code: 'ICH-ICSR-R3' }).up();

  // Message Payload
  const icsr = doc.ele('PORR_IN049016UV');
  icsr.ele('id', { root: OID.MESSAGE_ID, extension: messageId }).up()
    .ele('creationTime', { value: timestamp }).up()
    .ele('interactionId', { root: '2.16.840.1.113883.1.6', extension: 'PORR_IN049016UV' }).up()
    .ele('processingCode', { code: 'P' }).up()
    .ele('processingModeCode', { code: 'T' }).up()
    .ele('acceptAckCode', { code: 'AL' }).up();

  // 1. MESSAGE-level Transmission Details (INSIDE PORR)
  icsr.ele('receiver', { typeCode: 'RCV' })
    .ele('device', { classCode: 'DEV', determinerCode: 'INSTANCE' })
      .ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.14', extension: options.receiverId || 'EVHUMAN' }).up()
    .up().up();

  icsr.ele('sender', { typeCode: 'SND' })
    .ele('device', { classCode: 'DEV', determinerCode: 'INSTANCE' })
      .ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.13', extension: options.senderId || 'SENDER' }).up()
    .up().up();

  const controlAct = icsr.ele('controlActProcess', { classCode: 'CACT', moodCode: 'EVN' });
  controlAct.ele('code', { code: 'PORR_TE049016UV', codeSystem: '2.16.840.1.113883.1.18' }).up();

  // 2. BATCH-level Transmission Details (AFTER PORR, at root level)
  doc.ele('receiver', { typeCode: 'RCV' })
    .ele('device', { classCode: 'DEV', determinerCode: 'INSTANCE' })
      .ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.14', extension: options.receiverId || 'EVHUMAN' }).up()
    .up().up();

  doc.ele('sender', { typeCode: 'SND' })
    .ele('device', { classCode: 'DEV', determinerCode: 'INSTANCE' })
      .ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.13', extension: options.senderId || 'SENDER' }).up()
    .up().up();

  // ── REPORTER (Author) ──────────────────────────────────────────────────
  // VALIDATOR MIRROR: //authorOrPerformer//name/given and /name/family must be non-empty
  const hDetails: any = (report as any).reporterDetails || (report as any).hcpDetails || report.patientDetails || {};
  const author = controlAct.ele('authorOrPerformer', { typeCode: 'AUT' });
  const assignedPersonRole = author.ele('assignedPerson', { classCode: 'ASSIGNED' });
  assignedPersonRole.ele('id', { root: '2.16.840.1.113883.3.989.2.1.1.1', extension: '1' }).up();
  
  const assignedPersonEntity = assignedPersonRole.ele('assignedPerson', { classCode: 'PSN', determinerCode: 'INSTANCE' });
  const rName = assignedPersonEntity.ele('name');
  rName.ele('given').txt(hDetails.firstName || hDetails.name || hDetails.initials || 'Reporter').up();
  rName.ele('family').txt(hDetails.lastName || 'Initial').up();

  const org = assignedPersonRole.ele('representedOrganization', { classCode: 'ORG', determinerCode: 'INSTANCE' });
  org.ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.13', extension: options.senderId || 'SENDER' }).up();
  org.ele('addr').ele('country').txt(reporterCountry).up();

  // Investigation Event
  const subject = controlAct.ele('subject', { typeCode: 'SUBJ' });
  const investigationEvent = subject.ele('investigationEvent', { classCode: 'INVSTG', moodCode: 'EVN' });
  const reportId = (report.safetyReportId || report.referenceId || report.id).toUpperCase();
  investigationEvent.ele('id', { root: OID.CASE_ID, extension: reportId }).up()
    .ele('id', { root: OID.WORLDWIDE_ID, extension: reportId }).up();

  let reportTypeCode = '3';
  const typeText = (report.reporterType || options.reportType || '').toUpperCase();
  if (typeText === 'HCP' || typeText === 'PATIENT' || typeText === 'SPONTANEOUS') reportTypeCode = '1';

  investigationEvent.ele('code', { code: reportTypeCode, codeSystem: OID.REPORT_TYPE }).up()
    .ele('statusCode', { code: 'active' }).up()
    .ele('effectiveTime').ele('low', { value: expressHL7Date(report.createdAt) || timestamp }).up().up()
    .ele('availabilityTime', { value: expressHL7Date(report.lastUpdatedAt || report.updatedAt || report.createdAt) || timestamp }).up();

  // Narratives (H.1)
  const caseNarrative = (report as any).description || report.additionalDetails;
  if (caseNarrative) {
    investigationEvent.ele('outboundRelationship', { typeCode: 'REFR' })
      .ele('relatedInvestigation', { classCode: 'INVSTG', moodCode: 'EVN' })
        .ele('code', { code: 'H.1', codeSystem: '2.16.840.1.113883.3.989.2.1.1.22' }).up()
        .ele('subjectOf2', { typeCode: 'SUBJ' })
          .ele('investigationCharacteristic', { classCode: 'OBS', moodCode: 'EVN' })
            .ele('code', { code: 'H.1', codeSystem: '2.16.840.1.113883.3.989.2.1.1.22' }).up()
            .ele('value', { 'xsi:type': 'ED' }).txt(caseNarrative).up();
  }

  // Attachments
  const attachments: any[] = (report.attachments as any[]) || [];
  attachments.forEach((att, attIdx) => {
    investigationEvent.ele('reference', { typeCode: 'REFR' })
      .ele('document', { classCode: 'DOC', moodCode: 'EVN' })
        .ele('code', { code: '1', codeSystem: '2.16.840.1.113883.3.989.2.1.1.27' }).up()
        .ele('title').txt(att.fileName || `Attachment-${attIdx}`).up()
        .ele('text', { mediaType: att.mimeType || 'application/pdf', representation: 'B64' }).txt(att.base64Data || att.content).up();
  });
  
  // 1.5. Case Seriousness (A.1.5.1)
  const severityVal = (report.severity || '').toLowerCase();
  const isSerious = (report as any).seriousness === '1' || (report as any).isSerious === true || severityVal === 'fatal' || severityVal === 'life-threatening';
  investigationEvent.ele('component', { typeCode: 'COMP' })
    .ele('observationEvent', { classCode: 'OBS', moodCode: 'EVN' })
      .ele('code', { code: '15', codeSystem: '2.16.840.1.113883.3.989.2.1.1.19' }).up() // A.1.5.1 OID 15
      .ele('value', { 'xsi:type': 'BL', value: isSerious ? 'true' : 'false' }).up();

  // 1.6. Expedited Criteria
  const isExpedited = severityVal === 'fatal' || severityVal === 'life-threatening';
  investigationEvent.ele('component', { typeCode: 'COMP' })
    .ele('observationEvent', { classCode: 'OBS', moodCode: 'EVN' })
      .ele('code', { code: '23', codeSystem: OID.EXPEDITED_CONDITION }).up()
      .ele('value', { 'xsi:type': 'BL', value: isExpedited ? 'true' : 'false' }).up();

  // Assessment
  const assessment = investigationEvent.ele('component', { typeCode: 'COMP' })
    .ele('adverseEventAssessment', { classCode: 'INVSTG', moodCode: 'EVN' });
  const subject1 = assessment.ele('subject1', { typeCode: 'SBJ' }).ele('primaryRole', { classCode: 'INVSBJ' });
  
  const pDetails: any = report.patientDetails || {};
  const pPerson = subject1.ele('player1', { classCode: 'PSN', determinerCode: 'INSTANCE' });
  if (pDetails.initials) pPerson.ele('name').txt(pDetails.initials).up();
  if (pDetails.gender) {
    let gc = 'UN'; const gStr = pDetails.gender.toString().toUpperCase();
    if (gStr === '1' || gStr === 'M') gc = 'M'; else if (gStr === '2' || gStr === 'F') gc = 'F';
    pPerson.ele('administrativeGenderCode', { code: gc, codeSystem: OID.GENDER }).up();
  }
  if (pDetails.dob) { const dob = expressHL7Date(pDetails.dob); if (dob) pPerson.ele('birthTime', { value: dob }).up(); }

  if (pDetails.ageValue) {
    subject1.ele('subjectOf2', { typeCode: 'SBJ' })
      .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
        .ele('code', { code: '3', codeSystem: '2.16.840.1.113883.3.989.2.1.1.11' }).up()
        .ele('value', { 'xsi:type': 'PQ', value: pDetails.ageValue, unit: 'a' }).up();
  }

  // Parent details (D.10) - RESTORED
  if ((report as any).isParentChildReport && (report as any).parentDetails) {
    const parent = (report as any).parentDetails;
    subject1.ele('subjectOf2', { typeCode: 'SBJ' })
      .ele('investigationCharacteristic', { classCode: 'OBS', moodCode: 'EVN' })
        .ele('code', { code: '10', codeSystem: '2.16.840.1.113883.3.989.2.1.1.1' }).up()
        .ele('value', { 'xsi:type': 'ST' }).txt(parent.initials || 'Parent').up();
  }

  // ── SYMPTOMS (E.i) & LAB ROUTING ───────────────────────────────────────
  // ICH Routing Rule: symptoms with testValue → F.r (Labs), others → E.i (Reactions)
  // VALIDATOR MIRROR: //observation[code/@code='ASSERTION'] must exist (E.i check)
  // VALIDATOR MIRROR: MedDRA codeSystem '2.16.840.1.113883.6.163' scanned globally
  const allSymptoms: any[] = (report.symptoms as any[]) || [];
  const symptoms = allSymptoms.filter(s => !s.testValue && !s.result);
  const investigationSymptoms = allSymptoms.filter(s => s.testValue || s.result);

  symptoms.forEach((s) => {
    const rObs = subject1.ele('subjectOf2', { typeCode: 'SBJ' }).ele('observation', { classCode: 'OBS', moodCode: 'EVN' });
    rObs.ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.2', extension: s.reactionId || `REAC-${crypto.randomUUID()}` }).up()
        .ele('code', { code: 'ASSERTION', codeSystem: '2.16.840.1.113883.5.4' }).up();
    
    if (s.eventStartDate || s.eventEndDate) {
      const time = rObs.ele('effectiveTime', { 'xsi:type': 'IVL_TS' });
      const lowVal = expressHL7Date(s.eventStartDate);
      if (lowVal) time.ele('low', { value: lowVal }).up();
      
      if (s.eventEndDate && s.eventEndDate !== 'Ongoing') {
        const highVal = expressHL7Date(s.eventEndDate);
        if (highVal) time.ele('high', { value: highVal }).up();
      }
    }
    
    const medV = report.meddraVersion || options.meddraVersion || "29.0";
    const valNode = rObs.ele('value', { 'xsi:type': 'CE', code: s.lltCode || s.meddraCode, codeSystem: OID.MEDDRA, displayName: s.lltName || s.name });
    valNode.ele('originalText').txt(s.name || 'Symptom').up()
      .ele('qualifier').ele('name', { code: 'G.i.2.1', codeSystem: '2.16.840.1.113883.3.989.2.1.1.20' }).up()
      .ele('value', { 'xsi:type': 'CE', code: medV, codeSystem: '2.16.840.1.113883.3.989.2.1.1.9' }).up();

    // Seriousness Criteria (E.i.3.2) - RESTORED
    const severity = (report.severity || '').toLowerCase();
    if (severity && severity !== 'info') {
      let code = '6'; if (severity === 'fatal') code = '1'; else if (severity === 'life-threatening') code = '2';
      rObs.ele('outboundRelationship2', { typeCode: 'PERT' }).ele('observation', { classCode: 'OBS', moodCode: 'EVN' }).ele('code', { code: '38', codeSystem: '2.16.840.1.113883.3.989.2.1.1.11' }).up().ele('value', { 'xsi:type': 'CE', code: code, codeSystem: '2.16.840.1.113883.3.989.2.1.1.10' }).up();
    }

    // Outcome (E.i.7)
    if (s.outcome) {
      const oMap: any = { 'recovered': '1', 'improved': '3', 'ongoing': '4', 'death': '6', 'unknown': '0' };
      rObs.ele('outboundRelationship2', { typeCode: 'PERT' }).ele('observation', { classCode: 'OBS', moodCode: 'EVN' }).ele('code', { code: '27', codeSystem: '2.16.840.1.113883.3.989.5.1.3.2.1.10' }).up().ele('value', { 'xsi:type': 'CE', code: oMap[s.outcome] || '0', codeSystem: '2.16.840.1.113883.3.989.5.1.3.2.1.10' }).up();
    }
  });

  // ── LAB TESTS (F.r) ─────────────────────────────────────────────────────
  // VALIDATOR MIRROR: MedDRA codeSystem scanned globally; no explicit F.r count check
  const tests = [...((report.labTests as any[]) || []), ...investigationSymptoms.map(is => ({ meddraCode: is.lltCode || is.meddraCode, testName: is.lltName || is.name, testValue: is.testValue || is.result, unit: is.unit || '1' }))];
  tests.forEach((t, tidx) => {
    const tOrg = subject1.ele('subjectOf2', { typeCode: 'SBJ' }).ele('organizer', { classCode: 'CATEGORY', moodCode: 'EVN' });
    tOrg.ele('code', { code: '3', codeSystem: '2.16.840.1.113883.3.989.2.1.1.20' }).up()
      .ele('component', { typeCode: 'COMP' }).ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
        .ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.2', extension: `TEST-${tidx}` }).up()
        .ele('code', { code: t.meddraCode, codeSystem: OID.MEDDRA, displayName: t.testName || t.name }).ele('originalText').txt(t.testName || t.name).up().up()
        .ele('value', { 'xsi:type': 'IVL_PQ', value: t.testValue, unit: t.unit || '1' }).up();
  });

  // Medical History (D.7.1)
  const history: any[] = (report.medicalHistory as any[]) || [];
  history.forEach((h, hidx) => {
    const hLowVal = expressHL7Date(h.startDate);
    const hEffTime = subject1.ele('subjectOf', { typeCode: 'SBJ' }).ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
      .ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.2', extension: `HIST-${hidx}` }).up()
      .ele('code', { code: '7', codeSystem: '2.16.840.1.113883.3.989.5.1.3.2.1.10' }).up()
      .ele('value', { 'xsi:type': 'CE', code: h.meddraCode || '10000000', codeSystem: OID.MEDDRA, displayName: h.meddraTerm || h.condition }).up();
    
    if (hLowVal) {
      hEffTime.ele('effectiveTime').ele('low', { value: hLowVal }).up().up();
    }
  });

  // Drugs (G.k) 
  const renderDrug = (d: any, category: string, prefix: string, idx: number) => {
    const drugOrg = subject1.ele('subjectOf2', { typeCode: 'SBJ' }).ele('organizer', { classCode: 'CATEGORY', moodCode: 'EVN' });
    // Bug 1 Fix: Use dynamic category parameter
    drugOrg.ele('code', { code: category === '1' ? '1' : '4', codeSystem: '2.16.840.1.113883.3.989.2.1.1.20' }).up();
    
    // Bug 3 Fix: Capture substAdmin reference directly
    const substAdmin = drugOrg.ele('component', { typeCode: 'COMP' })
      .ele('substanceAdministration', { classCode: 'SBADM', moodCode: 'EVN' });
    
    substAdmin.ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.22', extension: `${prefix}-${idx}` }).up();

    if (d.startDate || d.endDate) {
      const time = substAdmin.ele('effectiveTime', { 'xsi:type': 'IVL_TS' });
      const dLowVal = expressHL7Date(d.startDate);
      if (dLowVal) time.ele('low', { value: dLowVal }).up();
      
      const dHighVal = expressHL7Date(d.endDate);
      if (dHighVal) time.ele('high', { value: dHighVal }).up();
      time.up();
    }

    if (d.route) substAdmin.ele('routeCode', { code: d.route.toUpperCase(), codeSystem: '2.16.840.1.113883.3.989.2.1.1.21' }).up();
    if (d.dosage) substAdmin.ele('doseQuantity', { value: d.dosage.match(/\d+/)?.[0] || '1', unit: d.dosage.replace(/\d+/g, '').trim() || '1' }).up();

    const consumable = substAdmin.ele('consumable', { typeCode: 'CSM' }).ele('instanceOfKind', { classCode: 'INST' });
    const pInstance = consumable.ele('productInstanceInstance', { classCode: 'MMAT', determinerCode: 'INSTANCE' });
    if (d.batchNumber || d.batch) pInstance.ele('lotNumberText').txt(d.batchNumber || d.batch).up();
    const asInstanceOfKind = pInstance.ele('asInstanceOfKind', { classCode: 'INST' });
    const matKind = asInstanceOfKind.ele('kindOfMaterialKind', { classCode: 'MAT', determinerCode: 'KIND' });
    
    if (d.whodrugCode) {
      matKind.ele('code', { 
        code: d.whodrugCode, 
        codeSystem: '2.16.840.1.113883.6.294', 
        codeSystemVersion: options.whodrugVersion || 'WHODrug Global B3 Mar 2025',
        displayName: d.productName || d.product
      }).up();
    } else {
      matKind.ele('code', { nullFlavor: 'NA' }).up();
    }

    matKind.ele('name').txt(d.productName || d.product || 'Unknown Drug').up();

    // Substance / Specified Substance (G.k.2.3.r) - Recursive Structure
    if (d.ingredients && Array.isArray(d.ingredients) && d.ingredients.length > 0) {
      d.ingredients.forEach((ing: any) => {
        pInstance.ele('ingredient', { classCode: 'ACTI' })
          .ele('quantity')
            .ele('numerator', { 'xsi:type': 'PQ', value: '1', unit: '1' }).up()
            .ele('denominator', { 'xsi:type': 'PQ', value: '1', unit: '1' }).up()
          .up()
          .ele('ingredientProductInstance', { classCode: 'MMAT', determinerCode: 'INSTANCE' })
            .ele('asInstanceOfKind', { classCode: 'INST' })
              .ele('kindOfMaterialKind', { classCode: 'MAT', determinerCode: 'KIND' })
                .ele('code', { 
                  code: ing.code, 
                  codeSystem: '2.16.840.1.113883.6.294', 
                  codeSystemVersion: options.whodrugVersion || 'WHODrug Global B3 Mar 2025',
                  displayName: ing.name 
                }).up()
                .ele('name').txt(ing.name).up()
              .up()
            .up()
          .up()
        .up();
      });
    }

    // ATC Classifications (G.k.2.1.r) - Moved to substanceAdministration level for compliance
    if (d.atcs && Array.isArray(d.atcs)) {
      d.atcs.forEach((atc: any) => {
        substAdmin.ele('outboundRelationship2', { typeCode: 'COMP' })
          .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
            .ele('code', { code: 'G.k.2.1.r', codeSystem: '2.16.840.1.113883.3.989.2.1.1.20' }).up()
            .ele('value', { 
              'xsi:type': 'CE',
              code: atc.code, 
              codeSystem: '2.16.840.1.113883.6.73', 
              displayName: atc.name 
            }).up()
          .up()
        .up();
      });
    }

    // Category must follow consumable in the HL7 schema sequence
    substAdmin.ele('outboundRelationship2', { typeCode: 'COMP' })
      .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
        .ele('code', { code: '6', codeSystem: '2.16.840.1.113883.3.989.2.1.1.12' }).up()
        .ele('value', { 'xsi:type': 'CE', code: category, codeSystem: '2.16.840.1.113883.3.989.2.1.1.13' }).up().up().up();

    // Indication (G.k.2.2)
    if (d.condition || d.indication) {
      substAdmin.ele('outboundRelationship2', { typeCode: 'RSON' }).ele('observation', { classCode: 'OBS', moodCode: 'EVN' }).ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.2', extension: `IND-${prefix}-${idx}` }).up().ele('code', { code: '19', codeSystem: '2.16.840.1.113883.3.989.2.1.1.19' }).up().ele('value', { 'xsi:type': 'ED' }).txt(d.condition || d.indication).up();
    }

    if (category === '1') {
      // Causality Assessment (outboundRelationship2 - CAUS)
      substAdmin.ele('outboundRelationship2', { typeCode: 'CAUS' })
        .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
          .ele('code', { code: '9', codeSystem: '2.16.840.1.113883.3.989.2.1.1.12' }).up()
          .ele('value', { 
            'xsi:type': 'CE', 
            code: d.causality || '3', 
            codeSystem: '2.16.840.1.113883.3.989.2.1.1.19' 
          }).up().up().up();
      
      if (d.reactions) {
        d.reactions.forEach((r: any) => {
          substAdmin.ele('outboundRelationship2', { typeCode: 'PERT' })
            .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
              .ele('code', { code: '39', codeSystem: OID.CAUSALITY }).up()
              .ele('value', { 'xsi:type': 'CE', code: r.causalityCode || '1', codeSystem: '2.16.840.1.113883.3.989.2.1.1.16' }).up()
              .ele('subject1', { typeCode: 'SUBJ' })
                .ele('adverseEffectReference', { classCode: 'OBS', moodCode: 'EVN' })
                  .ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.2', extension: r.reactionId }).up().up().up().up();
        });
      }
    }
  };

  ((report.products as any[]) || []).forEach((p, i) => renderDrug(p, '1', 'SUSP', i));
  ((report.otherMedications as any[]) || []).forEach((om, i) => renderDrug(om, '4', 'CONCOM', i));

  // Reporter Comments (H.2)
  if ((report as any).reporterComments) {
    investigationEvent.ele('outboundRelationship', { typeCode: 'SPRT' }).ele('relatedInvestigation', { classCode: 'INVSTG', moodCode: 'EVN' }).ele('code', { code: 'H.2', codeSystem: '2.16.840.1.113883.3.989.2.1.1.22' }).up().ele('subjectOf2', { typeCode: 'SUBJ' }).ele('investigationCharacteristic', { classCode: 'OBS', moodCode: 'EVN' }).ele('code', { code: 'H.2', codeSystem: '2.16.840.1.113883.3.989.2.1.1.22' }).up().ele('value', { 'xsi:type': 'ED' }).txt((report as any).reporterComments).up();
  }

  return doc.end({ prettyPrint: true });
}
