/**
 * Rate Limit Test Script (Dependency-free version)
 * This uses native fetch to hit the backend multiple times.
 */

async function runTest() {
  const url = 'http://localhost:3000/patient.create'; // We hit the raw endpoint
  const clientId = 'test-client-' + Math.random().toString(36).slice(2, 7);
  
  console.log(`🚀 Starting Rate Limit Test...`);
  console.log(`📡 Targeting: ${url}`);
  console.log(`🆔 Client ID: ${clientId}`);
  console.log("-----------------------------------------");

  for (let i = 1; i <= 55; i++) {
    try {
      // tRPC expect a POST with a specific JSON structure
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
        },
        body: JSON.stringify({
          // Mock data for patient.create
          products: [],
          symptoms: [],
          agreedToTerms: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Request ${i}: [${response.status}] Success`);
      } else {
        if (response.status === 429) {
          console.log(`❌ Request ${i}: [${response.status}] BLOCKED (Rate limit working!)`);
          console.log(`   Server Message: ${data.error?.message || 'Limit reached'}`);
          break;
        } else {
          console.log(`⚠️ Request ${i}: [${response.status}] Error: ${data.error?.message || 'Unknown error'}`);
        }
      }
    } catch (err: any) {
      console.error(`🚨 Network Error on Request ${i}:`, err.message);
      break;
    }
  }
  
  console.log("-----------------------------------------");
  console.log("Test finished.");
}

runTest();
