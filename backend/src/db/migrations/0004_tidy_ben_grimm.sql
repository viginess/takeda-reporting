CREATE TABLE "meddra_imports" (
	"id" serial PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"file_name" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"total_rows" integer DEFAULT 0,
	"processed_rows" integer DEFAULT 0,
	"error_log" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text
);
--> statement-breakpoint
ALTER TABLE "system_settings" ALTER COLUMN "clinical_config" SET DEFAULT '{"companyEmail":"info@takeda-reporting.com","timezone":"UTC+05:30 (IST)","retention":"24 months","twoFA":false,"sessionTimeout":"60 min","maxLoginAttempts":"5","passwordExpiry":"90 days","senderId":"CLINSOLUTION-DEFAULT","receiverId":"EVHUMAN","meddraVersion":"29.0","lockoutCooldown":"30 min"}'::jsonb;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "two_factor_enabled" boolean DEFAULT false NOT NULL;