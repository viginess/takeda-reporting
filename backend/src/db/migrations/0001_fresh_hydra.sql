CREATE TYPE "public"."admin_role" AS ENUM('super_admin', 'admin', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('info', 'warning', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('new', 'under_review', 'approved', 'closed');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'admin',
	"first_name" text,
	"last_name" text,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_at" timestamp,
	"password_changed_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	"last_active_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"default_language" text DEFAULT 'English (US)' NOT NULL,
	"notification_thresholds" jsonb DEFAULT '{"urgentAlerts":true,"alertThreshold":"All Severities","notifyOnApproval":true,"emailDigest":true,"digestFrequency":"Daily","smsAlerts":false}'::jsonb NOT NULL,
	"clinical_config" jsonb DEFAULT '{"adminEmail":"admin@pharma.com","timezone":"UTC+05:30 (IST)","retention":"24 months","maintenanceMode":false,"twoFA":false,"sessionTimeout":"60 min","maxLoginAttempts":"5","passwordExpiry":"90 days","senderId":"CLINSOLUTION-DEFAULT","receiverId":"EVHUMAN","meddraVersion":"29.1","lockoutCooldown":"30 min"}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "archived_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_id" text,
	"original_table" text NOT NULL,
	"products" jsonb,
	"symptoms" jsonb,
	"patient_details" jsonb,
	"hcp_details" jsonb,
	"reporter_details" jsonb,
	"taking_other_meds" text,
	"other_medications" jsonb,
	"has_relevant_history" text,
	"medical_history" jsonb,
	"lab_tests_performed" text,
	"lab_tests" jsonb,
	"additional_details" text,
	"attachments" jsonb,
	"agreed_to_terms" boolean,
	"reporter_type" text,
	"status" text,
	"severity" text,
	"admin_notes" text,
	"original_created_at" timestamp,
	"archived_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"report_id" text,
	"changed_by" text NOT NULL,
	"action" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_id" text,
	"products" jsonb,
	"symptoms" jsonb,
	"patient_details" jsonb,
	"hcp_details" jsonb,
	"taking_other_meds" text,
	"other_medications" jsonb,
	"has_relevant_history" text,
	"medical_history" jsonb,
	"lab_tests_performed" text,
	"lab_tests" jsonb,
	"additional_details" text,
	"attachments" jsonb,
	"agreed_to_terms" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'new',
	"severity" text DEFAULT 'info',
	"admin_notes" text,
	"xml_url" text,
	"pdf_url" text,
	"meddra_version" text,
	"last_updated_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hcp_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_id" text,
	"products" jsonb,
	"symptoms" jsonb,
	"patient_details" jsonb,
	"reporter_details" jsonb,
	"taking_other_meds" text,
	"other_medications" jsonb,
	"has_relevant_history" text,
	"medical_history" jsonb,
	"lab_tests_performed" text,
	"lab_tests" jsonb,
	"additional_details" text,
	"attachments" jsonb,
	"agreed_to_terms" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'new',
	"severity" text DEFAULT 'info',
	"admin_notes" text,
	"xml_url" text,
	"pdf_url" text,
	"meddra_version" text,
	"last_updated_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"desc" text NOT NULL,
	"time" varchar(50) NOT NULL,
	"date" varchar(50) NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"report_id" varchar(50),
	"classification_reason" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_id" text,
	"products" jsonb,
	"symptoms" jsonb,
	"patient_details" jsonb,
	"hcp_details" jsonb,
	"taking_other_meds" text,
	"other_medications" jsonb,
	"has_relevant_history" text,
	"medical_history" jsonb,
	"lab_tests_performed" text,
	"lab_tests" jsonb,
	"additional_details" text,
	"attachments" jsonb,
	"agreed_to_terms" boolean NOT NULL,
	"reporter_type" text,
	"status" text DEFAULT 'new',
	"severity" text DEFAULT 'info',
	"admin_notes" text,
	"xml_url" text,
	"pdf_url" text,
	"meddra_version" text,
	"last_updated_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "family_severity_idx" ON "family_reports" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "family_status_idx" ON "family_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "family_created_at_idx" ON "family_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "hcp_severity_idx" ON "hcp_reports" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "hcp_status_idx" ON "hcp_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "hcp_created_at_idx" ON "hcp_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "patient_severity_idx" ON "patient_reports" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "patient_status_idx" ON "patient_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "patient_created_at_idx" ON "patient_reports" USING btree ("created_at");