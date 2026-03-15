import { create } from 'xmlbuilder2';
import { patientReports } from '../../db/schema.js';

export type PatientReport = typeof patientReports.$inferSelect;

/**
 * Generates an E2B R3 (HL7 v3) XML from a Patient Report.
 * Mapping rules based on REQ_159-A12 spec.
 */
export function generateE2BR3(report: PatientReport, options: { senderId: string, receiverId: string, reportType?: 'Patient' | 'HCP' | 'Family' }): string {
  const now = new Date();

  // N.2.r.1: Message Identifier ({COUNTRY}-CLINSOLUTION-YYYYMMDDHHmmss-ID)
  const prefix = (report as any).countryCode || 'US';
  const messageDate = report.createdAt ? new Date(report.createdAt) : now;
  const timestampTS = messageDate.toISOString().replace(/[-:T]/g, '').split('.')[0];
  const messageId = `${prefix}-CLINSOLUTION-${timestampTS}-${(report.referenceId || report.id.substring(0, 8)).toUpperCase()}`;

  const formatDate = (d: string | Date | null | undefined) => {
    if (!d) return null;
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return null;
    return date.toISOString().replace(/[-:T]/g, '').split('.')[0] + 'Z';
  };

  const timestamp = timestampTS + 'Z';

  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('MCCI_IN200100UV01', {
      ITSVersion: 'XML_1.0',
      xmlns: 'urn:hl7-org:v3',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation': 'urn:hl7-org:v3 MCCI_IN200100UV01.xsd',
    });

  // Header Section
  doc.ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.22', extension: messageId }).up()
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
  
  // C.1.3: Type of report (1=Spontaneous, 2=Other/Consumer)
  const reportTypeCode = options.reportType === 'HCP' ? '1' : '2';
  investigationEvent.ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.1', extension: report.safetyReportId || report.referenceId || report.id }).up()
    .ele('code', { code: reportTypeCode, codeSystem: '2.16.840.1.113883.3.989.2.1.1.1' }).up()
    .ele('text').txt(report.additionalDetails || 'No additional details provided.').up()
    .ele('statusCode', { code: 'active' }).up()
    .ele('effectiveTime')
      .ele('low', { value: report.createdAt?.toISOString().replace(/[-:T]/g, '').split('.')[0] || timestamp }).up()
    .up();

  // ── Step 2: Patient Details (D.1, D.2, etc.) ────────────────
  const pDetails: any = report.patientDetails || {};
  const patientRole = investigationEvent.ele('subject', { typeCode: 'SUBJ' })
    .ele('patient', { classCode: 'PAT' });
  
  const patientPerson = patientRole.ele('patientPerson', { classCode: 'PSN', determinerCode: 'INSTANCE' });

  if (pDetails.initials) {
    patientPerson.ele('name').txt(pDetails.initials).up();
  }

  if (pDetails.gender) {
    // ICH standard: 1=male, 2=female, 3=other, 0=unknown, 9=not specified
    let genderCode = '9';
    const g = pDetails.gender.toString().toUpperCase();
    if (g === 'M' || g === 'MALE' || g === '1') genderCode = '1';
    else if (g === 'F' || g === 'FEMALE' || g === '2') genderCode = '2';
    else if (g === 'O' || g === 'OTHER' || g === '3') genderCode = '3';
    else if (g === 'UNKNOWN' || g === '0') genderCode = '0';
    
    patientPerson.ele('administrativeGenderCode', { code: genderCode, codeSystem: '1.0.5218' }).up();
  }

  if (pDetails.dob) {
    const dob = new Date(pDetails.dob).toISOString().replace(/[-:T]/g, '').split('.')[0];
    patientPerson.ele('birthTime', { value: dob }).up();
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

      const valueNode = reactionObs.ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.2', extension: s.reactionId || `REAC-${Date.now()}-${idx}` }).up()
        .ele('code', { code: 'ASSERTION', codeSystem: '2.16.840.1.113883.5.4' }).up()
        .ele('value', { 
          'xsi:type': 'CE', 
          code: lltCode || ptCode, 
          codeSystem: '2.16.840.1.113883.6.163',
          displayName: s.lltName || s.name || s.meddraTerm 
        });
      
      valueNode.ele('originalText').txt(s.name || 'Unknown Symptom').up();
      
      // Nest PT as a translation of LLT - Standard for E2B R3 (HL7 v3)
      if (ptCode && ptCode !== lltCode) {
        valueNode.ele('translation', {
          code: ptCode,
          codeSystem: '2.16.840.1.113883.6.163',
          displayName: s.ptName
        }).up();
      }
      
      valueNode.up();

    // E.i.4: Terminal Dates/Duration
    if (s.eventStartDate || s.eventEndDate) {
      const time = reactionObs.ele('effectiveTime');
      if (s.eventStartDate) {
        const start = formatDate(s.eventStartDate);
        if (start) time.ele('low', { value: start }).up();
      }
      if (s.eventEndDate && s.eventEndDate !== 'Ongoing') {
        const end = formatDate(s.eventEndDate);
        if (end) time.ele('high', { value: end }).up();
      }
      time.up();
    }

    // E.i.7: Outcome (Mapped as an outboundRelationship2 PERT code 27)
    if (s.outcome) {
      const outcomeMap: Record<string, string> = {
        'recovered': '1',
        'recovered-lasting': '2',
        'improved': '3',
        'ongoing': '4',
        'death': '6',
        'unknown': '0'
      };
      
      reactionObs.ele('outboundRelationship2', { typeCode: 'PERT' })
        .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
          .ele('code', { code: '27', codeSystem: '2.16.840.1.113883.3.989.2.1.1.11' }).up()
          .ele('value', { 'xsi:type': 'CE', code: outcomeMap[s.outcome] || '0', codeSystem: '2.16.840.1.113883.3.989.5.1.3.2.1.10' }).up()
        .up().up();
    }

    reactionObs.up().up();
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

    // G.k.4.r.1a: Dosage
    if (p.dosage) {
      substAdmin.ele('doseQuantity', { value: p.dosage.match(/\d+/)?.[0] || '1', unit: p.dosage.replace(/\d+/g, '').trim() || '1' }).up();
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

    substAdmin.up().up().up().up().up();
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

  // C.2.r.3: Country
  author.ele('representedOrganization', { classCode: 'ORG', determinerCode: 'INSTANCE' })
    .ele('addr')
      .ele('country', { code: reporterCountry, codeSystem: '1.0.3166.1' }).up()
    .up()
  .up();

  // Return formatted XML
  return doc.end({ prettyPrint: true });
}
