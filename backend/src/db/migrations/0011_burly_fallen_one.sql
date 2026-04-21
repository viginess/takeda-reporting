CREATE TABLE "whodrug_imports" (
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
ALTER TABLE "system_settings" ALTER COLUMN "clinical_config" SET DEFAULT '{"timezone":"UTC+05:30 (IST)","retention":"24 months","twoFA":false,"sessionTimeout":"60 min","maxLoginAttempts":"5","passwordExpiry":"90 days","senderId":"CLINSOLUTION-DEFAULT","receiverId":"EVHUMAN","meddraVersion":"29.0","whodrugVersion":"Global B3 March 2025","lockoutCooldown":"30 min","smtpHost":"","smtpPort":"587","smtpUser":"","smtpPass":"","smtpFrom":"info@viginess.com"}'::jsonb;--> statement-breakpoint
CREATE INDEX "whodrug_bna_version_idx" ON "whodrug_bna" USING btree ("whodrug_version");--> statement-breakpoint
CREATE INDEX "whodrug_ccode_version_idx" ON "whodrug_ccode" USING btree ("whodrug_version");--> statement-breakpoint
CREATE INDEX "whodrug_dda_version_idx" ON "whodrug_dda" USING btree ("whodrug_version");--> statement-breakpoint
CREATE INDEX "whodrug_ina_version_idx" ON "whodrug_ina" USING btree ("whodrug_version");--> statement-breakpoint
CREATE INDEX "whodrug_ing_version_idx" ON "whodrug_ing" USING btree ("whodrug_version");--> statement-breakpoint
CREATE INDEX "whodrug_man_version_idx" ON "whodrug_man" USING btree ("whodrug_version");--> statement-breakpoint
CREATE INDEX "whodrug_source_version_idx" ON "whodrug_source" USING btree ("whodrug_version");--> statement-breakpoint
ALTER TABLE "whodrug_bna" ADD CONSTRAINT "whodrug_bna_drug_record_number_alias_name_whodrug_version_unique" UNIQUE("drug_record_number","alias_name","whodrug_version");--> statement-breakpoint
ALTER TABLE "whodrug_dd" ADD CONSTRAINT "whodrug_dd_drug_record_number_seq1_seq2_whodrug_version_unique" UNIQUE("drug_record_number","seq1","seq2","whodrug_version");--> statement-breakpoint
ALTER TABLE "whodrug_dda" ADD CONSTRAINT "whodrug_dda_drug_record_number_seq1_atc_code_whodrug_version_unique" UNIQUE("drug_record_number","seq1","atc_code","whodrug_version");--> statement-breakpoint
ALTER TABLE "whodrug_ing" ADD CONSTRAINT "whodrug_ing_drug_record_number_seq1_ingredient_code_whodrug_version_unique" UNIQUE("drug_record_number","seq1","ingredient_code","whodrug_version");