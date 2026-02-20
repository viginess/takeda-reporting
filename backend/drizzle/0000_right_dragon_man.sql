DO $$ BEGIN
 CREATE TYPE "report_status" AS ENUM('pending', 'under_review', 'completed', 'closed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"created_at" timestamp DEFAULT now()
);
