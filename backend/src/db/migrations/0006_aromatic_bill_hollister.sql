ALTER TABLE "family_reports" ADD COLUMN "sender_timezone_offset" integer;--> statement-breakpoint
ALTER TABLE "hcp_reports" ADD COLUMN "sender_timezone_offset" integer;--> statement-breakpoint
ALTER TABLE "patient_reports" ADD COLUMN "sender_timezone_offset" integer;--> statement-breakpoint
ALTER TABLE "system_settings" DROP COLUMN "default_language";