import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)?.trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY)?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "CRITICAL: Supabase configuration missing in environment.",
    {
      VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      VITE_SUPABASE_SERVICE_ROLE_KEY: !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    }
  );
} else {
  // Check if the URL project ref matches the key's project ref (if possible)
  // Keys are JWTs, their payload contains the "ref"
  try {
    const payloadBase64 = serviceRoleKey.split('.')[1];
    if (payloadBase64) {
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
      const keyRef = payload.ref;
      const keyRole = payload.role;
      const urlRef = supabaseUrl.split('//')[1]?.split('.')[0];
      
      console.log("Supabase JWT Diagnostics:", {
        roleInKey: keyRole,
        projectRefFromKey: keyRef,
        projectRefFromUrl: urlRef,
        isRoleCorrect: keyRole === 'service_role'
      });
      
      if (keyRef && urlRef && keyRef !== urlRef) {
        console.error("🚨 PROJECT MISMATCH DETECTED: The service role key belongs to project '" + keyRef + "' but the URL is for project '" + urlRef + "'. Signature verification will FAIL!");
      }

      if (keyRole !== 'service_role') {
        console.error("🚨 WRONG KEY ROLE: You are using an '" + keyRole + "' key, but the backend requires a 'service_role' key for Storage access.");
      }
    }
  } catch (e) {
    console.warn("Could not verify key/URL details:", e);
  }

  console.log("Supabase Admin initialized.", {
    url: supabaseUrl,
    keyPrefix: serviceRoleKey.substring(0, 10) + "...",
    keyLength: serviceRoleKey.length,
  });
}

export const supabaseAdmin = createClient(
  supabaseUrl || "",
  serviceRoleKey || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
