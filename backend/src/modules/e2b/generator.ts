import { create } from 'xmlbuilder2';
import { patientReports } from '../../db/schema.js';

type PatientReport = typeof patientReports.$inferSelect;

/**
 * Generates an E2B R3 (HL7 v3) XML from a Patient Report.
 * Mapping rules based on REQ_159-A12 spec.
 */
export function generateE2BR3(report: PatientReport, options: { senderId: string, receiverId: string }): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T]/g, '').split('.')[0] + '+00'; // CCYYMMDDhhmmss

  // N.2.r.1: Message Identifier (country + MMM + reference)
  // Defaulting to US for now if not specified
  const messageId = `US-MMM-${report.referenceId || report.id}`;

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
    subject1.ele('subjectOf2', { typeCode: 'SBJ' })
      .ele('observation', { classCode: 'OBS', moodCode: 'EVN' })
        .ele('id', { root: '2.16.840.1.113883.3.989.2.1.3.2', extension: `REACT-${idx}` }).up()
        .ele('code', { code: '29', codeSystem: '2.16.840.1.113883.3.989.2.1.1.19' }).up() // Reaction code
        .ele('value', { 
          'xsi:type': 'CE', 
          code: s.meddraCode || '10000000', 
          codeSystem: '2.16.840.1.113883.6.163' 
        })
          .ele('originalText').txt(s.term || s.name || 'Unknown Symptom').up()
        .up()
      .up()
    .up();
  });

  // Products mapping to G.k.2.2
  const products: any[] = (report.products as any[]) || [];
  products.forEach((p) => {
    // Note: HL7v3 structure for products is very nested. 
    // This is a high-level placeholder for G.k.2.2.
    subject1.ele('subjectOf2', { typeCode: 'SBJ' })
      .ele('organizer', { classCode: 'CATEGORY', moodCode: 'EVN' })
        .ele('code', { code: '4', codeSystem: '2.16.840.1.113883.3.989.2.1.1.20' }).up()
        .ele('component', { typeCode: 'COMP' })
          .ele('substanceAdministration', { classCode: 'SBADM', moodCode: 'EVN' })
            .ele('consumable', { typeCode: 'CSM' })
              .ele('instanceOfKind', { classCode: 'INST' })
                .ele('kindOfProduct', { classCode: 'MMAT', determinerCode: 'KIND' })
                  .ele('name').txt(p.name || 'Unknown Product').up()
                .up()
              .up()
            .up()
          .up()
        .up()
      .up()
    .up();
  });

  // ── Step 4: Reporter Details (C.2.r) ────────────────────────
  const hDetails: any = report.hcpDetails || {};
  const author = controlAct.ele('authorOrPerformer', { typeCode: 'AUT' })
    .ele('assignedEntity', { classCode: 'ASSIGNED' });

  if (hDetails.email) {
    author.ele('telecom', { value: `mailto:${hDetails.email}` }).up();
  }

  const assignedPerson = author.ele('assignedPerson', { classCode: 'PSN', determinerCode: 'INSTANCE' });
  if (hDetails.firstName || hDetails.lastName) {
    const name = assignedPerson.ele('name');
    if (hDetails.firstName) name.ele('given').txt(hDetails.firstName).up();
    if (hDetails.lastName) name.ele('family').txt(hDetails.lastName).up();
  }

  // Return formatted XML
  return doc.end({ prettyPrint: true });
}
