
import { generateE2BR3, PatientReport } from './generator.js';

const mockReport: any = {
  id: 'report-123',
  referenceId: 'REF-001',
  safetyReportId: 'US-CLINSOLUTION-REF001',
  reportVersion: 1,
  patientName: 'John Doe',
  patientAge: 45,
  symptoms: [
    {
      name: 'Headache',
      lltCode: '10019211',
      lltName: 'Headache',
      ptCode: '10019211',
      ptName: 'Headache',
      reactionId: 'R-001',
      outcome: 'recovered'
    },
    {
      name: 'Nausea',
      lltCode: '10028813',
      lltName: 'Nausea',
      ptCode: '10028813',
      ptName: 'Nausea',
      reactionId: 'R-002',
      outcome: 'ongoing'
    }
  ]
};

const options = {
  senderId: 'CLINSOLUTION',
  receiverId: 'EVHUMAN'
};

async function verify() {
  console.log('--- Verifying E2B Refinements ---');
  
  const xml = generateE2BR3(mockReport as any, options);
  
  // 1. Check Namespace
  if (xml.includes('xmlns="urn:hl7-org:v3"') && xml.includes('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"')) {
    console.log('✅ HL7 Namespace present');
  } else {
    console.error('❌ HL7 Namespace missing');
  }

  // 2. Check Timestamp (Z format)
  // Look for something like 20260312143022Z
  const timestampRegex = /value="\d{14}Z"/;
  if (timestampRegex.test(xml)) {
    console.log('✅ UTC Z-Timestamp format correct');
  } else {
    console.error('❌ UTC Z-Timestamp format missing or incorrect');
  }

  // 3. Check Safety Report ID
  if (xml.includes('extension="US-CLINSOLUTION-REF001"')) {
    console.log('✅ Safety Report ID correctly mapped');
  } else {
    console.error('❌ Safety Report ID missing or incorrect mapping');
  }

  // 4. Check MedDRA OID
  if (xml.includes('codeSystem="2.16.840.1.113883.6.163"')) {
    console.log('✅ MedDRA OID present');
  } else {
    console.error('❌ MedDRA OID missing');
  }

  // 5. Check Multiple Reactions
  const observationCount = (xml.match(/<observation/g) || []).length;
  if (observationCount >= 2) {
    console.log(`✅ Multiple reactions detected (Observations: ${observationCount})`);
  } else {
    console.error(`❌ Expected multiple reactions, found ${observationCount}`);
  }

  // 6. Check ASSERTION code
  if (xml.includes('code="ASSERTION"')) {
    console.log('✅ HL7 ASSERTION code present');
  } else {
    console.error('❌ HL7 ASSERTION code missing');
  }

  console.log('\n--- XML Preview (Clipped) ---');
  console.log(xml.substring(0, 500) + '...');
}

verify().catch(console.error);
