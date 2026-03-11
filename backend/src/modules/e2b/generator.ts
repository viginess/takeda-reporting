import { create } from 'xmlbuilder2';
import { patientReports } from '../../db/schema.js';

type PatientReport = typeof patientReports.$inferSelect;

/**
 * Generates an E2B R3 (HL7 v3) XML from a Patient Report.
 * Mapping rules based on REQ_159-A12 spec.
 */
export function generateE2BR3(report: PatientReport, options: { senderId: string, receiverId: string }): string {
  const now = new Date();

  // N.2.r.1: Message Identifier (country + MMM + reference)
  const messageId = `US-MMM-${report.referenceId || report.id}`;

  const formatDate = (d: string | Date | null | undefined) => {
    if (!d) return null;
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return null;
    return date.toISOString().replace(/[-:T]/g, '').split('.')[0];
  };

  const timestamp = formatDate(now) + '+00';

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
      .ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.13', extension: options.senderId || 'CLINSOLUTION-DEFAULT' }).up()
    .up()
  .up();

  // ── Step 1: Control Act Process ────────────────────────────
  const controlAct = doc.ele('controlActProcess', { classCode: 'CACT', moodCode: 'EVN' });
  
  // Investigation Event
  const investigationEvent = controlAct.ele('subject', { typeCode: 'SUBJ' })
    .ele('investigationEvent', { classCode: 'INVSTG', moodCode: 'EVN' });
  
  investigationEvent.ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.1', extension: report.referenceId || report.id }).up()
    .ele('code', { code: 'PAT_REPORT', codeSystem: '2.16.840.1.113883.3.989.2.1.1.1' }).up()
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
    // ICH standard: 1=male, 2=female, 9=not specified, 0=unknown
    let genderCode = '9';
    const g = pDetails.gender.toString().toLowerCase();
    if (g === 'male' || g === '1') genderCode = '1';
    else if (g === 'female' || g === '2') genderCode = '2';
    else if (g === 'unknown' || g === '0') genderCode = '0';
    
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

      // E.i.2.1b: Reaction Code
      const valueAttrs: any = { 'xsi:type': 'CE' };
      if (s.meddraCode) {
        valueAttrs.code = s.meddraCode;
        valueAttrs.codeSystem = '2.16.840.1.113883.6.163';
      } else {
        valueAttrs.nullFlavor = 'UNK';
      }

      reactionObs.ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.2', extension: `REACT-${idx}` }).up()
        .ele('code', { code: '29', codeSystem: '2.16.840.1.113883.3.989.2.1.1.19' }).up() // Reaction code
        .ele('value', valueAttrs)
          .ele('originalText').txt(s.meddraTerm || s.term || s.name || 'Unknown Symptom').up()
        .up();

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

    // E.i.7: Outcome
    if (s.outcome) {
      const outcomeMap: Record<string, string> = {
        'recovered': '1',
        'recovered-lasting': '2',
        'improved': '3',
        'ongoing': '4',
        'death': '6',
        'unknown': '0'
      };
      reactionObs.ele('value', { 
        'xsi:type': 'CE', 
        code: outcomeMap[s.outcome] || '0', 
        codeSystem: '2.16.840.1.113883.3.989.2.1.1.11' 
      }).up();
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

    substAdmin.up().up().up().up().up();
  });

  // ── Step 4: Reporter Details (C.2.r) ────────────────────────
  // Robust mapping: Check reporterDetails (HCP reports) or hcpDetails (Patient reports)
  const hDetails: any = (report as any).reporterDetails || (report as any).hcpDetails || {};
  const author = controlAct.ele('authorOrPerformer', { typeCode: 'AUT' })
    .ele('assignedEntity', { classCode: 'ASSIGNED' });

  if (hDetails.email) {
    author.ele('telecom', { value: `mailto:${hDetails.email}` }).up();
  } else if (hDetails.phone) {
    author.ele('telecom', { value: `tel:${hDetails.phone}` }).up();
  }

  const assignedPerson = author.ele('assignedPerson', { classCode: 'PSN', determinerCode: 'INSTANCE' });
  const rFirstName = hDetails.firstName || hDetails.name;
  const rLastName = hDetails.lastName;

  if (rFirstName || rLastName) {
    const name = assignedPerson.ele('name');
    if (rFirstName) name.ele('given').txt(rFirstName).up();
    if (rLastName) name.ele('family').txt(rLastName).up();
  } else {
    // E2B R3 requires a name, if missing we use MS (Masked) or Unknown
    assignedPerson.ele('name').ele('given', { nullFlavor: 'MS' }).up().up();
  }

  // Return formatted XML
  return doc.end({ prettyPrint: true });
}
