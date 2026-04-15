import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

let cachedAdmin: any = null;

export const getSupabaseAdmin = () => {
  if (cachedAdmin) return cachedAdmin;

  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY)?.trim();


  if (!url || !key) {
    throw new Error("Supabase credentials missing in environment variables.");
  }

  cachedAdmin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cachedAdmin;
};
