/// <reference types="node" />
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/patient/patient.schema.ts",
  out: "./drizzle",
  driver: "pg",   // ✅ MUST be exactly "pg"
  dbCredentials: {
    // @ts-ignore - TS treats this file as isolated since it is outside the src/ rootDir
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;