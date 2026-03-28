ALTER TABLE "family_reports" ADD COLUMN "is_valid" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "family_reports" ADD COLUMN "validation_errors" jsonb;--> statement-breakpoint
ALTER TABLE "hcp_reports" ADD COLUMN "is_valid" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "hcp_reports" ADD COLUMN "validation_errors" jsonb;--> statement-breakpoint
ALTER TABLE "patient_reports" ADD COLUMN "is_valid" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "patient_reports" ADD COLUMN "validation_errors" jsonb;