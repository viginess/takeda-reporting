import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "CRITICAL: Supabase configuration missing in environment.",
    {
      urlPresent: !!supabaseUrl,
      serviceRoleKeyPresent: !!serviceRoleKey,
    }
  );
} else {
  // Debug log to verify key format (without leaking the secret)
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
