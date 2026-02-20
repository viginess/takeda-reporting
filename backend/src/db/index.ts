import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not set. Create a backend/.env file with your Supabase connection string.");
  console.error("   Copy backend/.env.example → backend/.env and fill in your password.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

export const db = drizzle(pool, { schema });

