/**
 * Safe migration script – only creates the patients table and report_status enum.
 * Does NOT drop any existing tables.
 */
import pg from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/takeda_db";

const sql = `
DO $$ BEGIN
  CREATE TYPE "report_status" AS ENUM('pending', 'under_review', 'completed', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "patients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "products" jsonb,
  "symptoms" jsonb,
  "initials" text,
  "dob" text,
  "age_value" text,
  "sex" text,
  "contact_permission" text,
  "email" text,
  "name" text,
  "hcp_contact_permission" text,
  "hcp_first_name" text,
  "hcp_last_name" text,
  "hcp_email" text,
  "hcp_phone" text,
  "hcp_institution" text,
  "hcp_address" text,
  "hcp_city" text,
  "hcp_state" text,
  "hcp_zip_code" text,
  "hcp_country" text,
  "other_medications" jsonb,
  "medical_history" jsonb,
  "lab_tests" jsonb,
  "additional_details" text,
  "status" "report_status" DEFAULT 'pending',
  "submitted_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
`;

async function run() {
  const client = new pg.Client({ connectionString });
  await client.connect();
  console.log("✅ Connected to database");
  try {
    await client.query(sql);
    console.log("✅ patients table created (or already exists)");
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
