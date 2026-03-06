import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY)?.trim();

console.log("-----------------------------------------");
console.log("DEBUG: Supabase Client Initializing...");
console.log("URL Source:", process.env.SUPABASE_URL ? "SUPABASE_URL" : "VITE_SUPABASE_URL");
console.log("Key Source:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : "VITE_SUPABASE_SERVICE_ROLE_KEY");

if (!url || !key) {
  console.error("❌ ERROR: Supabase Credentials Missing!");
} else {
  try {
    const parts = key.split('.');
    console.log("JWT Structure:", parts.length, "parts (expect 3)");
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const keyRef = payload.ref;
    const urlRef = url.split('//')[1]?.split('.')[0];
    
    console.log("🔍 PROJECT REF CHECK:");
    console.log("   - URL Ref:", urlRef);
    console.log("   - Key Ref:", keyRef);
    console.log("   - Role:", payload.role);
    
    if (keyRef !== urlRef) {
      console.error("🚨 CRITICAL: PROJECT MISMATCH! Key and URL are from different projects.");
    }
  } catch (e) {
    console.log("Could not parse JWT payload for debug logs.");
  }
}
console.log("-----------------------------------------");

export const supabaseAdmin = createClient(url || "", key || "", {
  auth: { autoRefreshToken: false, persistSession: false },
});
