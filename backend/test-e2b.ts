import { validateE2BR3 } from './src/modules/e2b/validator.js';
import { generateE2BR3 } from './src/modules/e2b/generator.js';
import fs from 'fs';

const mockReport = {
  id: 'test-report-id',
  referenceId: 'REP-TEST123',
  createdAt: new Date(),
  senderTimezoneOffset: -330, // IST
  countryCode: 'IN',
  safetyReportId: 'IN-TEST-REP-TEST123',
  reportVersion: 1,
  products: [
    {
      productName: 'Test Product',
      conditions: [{ name: 'Headache' }],
      batches: [{ batchNumber: 'B123', expiryDate: '2025-01-01', startDate: '2024-01-01', endDate: '2024-01-02', dosage: '10mg' }]
    }
  ],
  symptoms: [
    {
      name: 'Nausea',
      eventStartDate: '2024-01-01',
      eventEndDate: '2024-01-02',
      seriousness: 'hospitalization',
      outcome: 'recovered'
    }
  ],
  patientDetails: { initials: 'JD', gender: 'male', dob: '1990-01-01' }
};

async function test() {
  const xml = generateE2BR3(mockReport as any, { 
    senderId: 'TESTSENDER', 
    receiverId: 'TESTRECEIVER',
    reportType: 'Patient'
  });
  
  console.log('--- Generated XML Header ---');
  console.log(xml.substring(0, 500));
  fs.writeFileSync('test-xml-output.xml', xml);
  
  console.log('\n--- Validating ---');
  const result = await validateE2BR3(xml);
  fs.writeFileSync('validator-debug.json', JSON.stringify(result, null, 2));
  console.log('Results written to validator-debug.json');
}

test().catch(console.error);
