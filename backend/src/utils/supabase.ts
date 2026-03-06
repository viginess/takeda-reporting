import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

let cachedAdmin: any = null;

export const getSupabaseAdmin = () => {
  if (cachedAdmin) return cachedAdmin;

  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY)?.trim();

  console.error("--- SUPABASE AUTH DIAGNOSTICS ---");
  console.error("URL Found:", !!url ? "YES" : "NO");
  console.error("KEY Found:", !!key ? "YES" : "NO");

  if (!url || !key) {
    throw new Error("Supabase credentials missing in environment variables.");
  }

  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString());
    console.error("Key Metadata:", { role: payload.role, ref: payload.ref });
    const urlRef = url.split('//')[1]?.split('.')[0];
    if (payload.ref !== urlRef) {
      console.error("🚨 WARNING: URL project '" + urlRef + "' does not match Key project '" + payload.ref + "'");
    }
  } catch (e) {
    console.error("Could not parse key payload.");
  }
  console.error("---------------------------------");

  cachedAdmin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cachedAdmin;
};
