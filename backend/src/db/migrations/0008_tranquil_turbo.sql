CREATE TABLE "whodrug_bna" (
	"id" text PRIMARY KEY NOT NULL,
	"drug_record_number" text NOT NULL,
	"alias_name" text NOT NULL,
	"whodrug_version" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whodrug_ccode" (
	"country_code" text NOT NULL,
	"country_name" text NOT NULL,
	"whodrug_version" text NOT NULL,
	CONSTRAINT "whodrug_ccode_country_code_whodrug_version_pk" PRIMARY KEY("country_code","whodrug_version")
);
--> statement-breakpoint
CREATE TABLE "whodrug_dd" (
	"rid" text PRIMARY KEY NOT NULL,
	"drug_record_number" text NOT NULL,
	"seq1" text NOT NULL,
	"seq2" text NOT NULL,
	"trade_name" text NOT NULL,
	"company_code" text,
	"country_code" text,
	"source_code" text,
	"whodrug_version" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whodrug_dda" (
	"id" text PRIMARY KEY NOT NULL,
	"drug_record_number" text NOT NULL,
	"seq1" text NOT NULL,
	"atc_code" text NOT NULL,
	"whodrug_version" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whodrug_ina" (
	"atc_code" text NOT NULL,
	"description" text NOT NULL,
	"level" integer NOT NULL,
	"whodrug_version" text NOT NULL,
	CONSTRAINT "whodrug_ina_atc_code_whodrug_version_pk" PRIMARY KEY("atc_code","whodrug_version")
);
--> statement-breakpoint
CREATE TABLE "whodrug_ing" (
	"id" text PRIMARY KEY NOT NULL,
	"drug_record_number" text NOT NULL,
	"seq1" text NOT NULL,
	"ingredient_code" text NOT NULL,
	"ingredient_name" text,
	"whodrug_version" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whodrug_man" (
	"company_code" text NOT NULL,
	"company_name" text NOT NULL,
	"whodrug_version" text NOT NULL,
	CONSTRAINT "whodrug_man_company_code_whodrug_version_pk" PRIMARY KEY("company_code","whodrug_version")
);
--> statement-breakpoint
CREATE TABLE "whodrug_source" (
	"source_code" text NOT NULL,
	"source_name" text NOT NULL,
	"whodrug_version" text NOT NULL,
	CONSTRAINT "whodrug_source_source_code_whodrug_version_pk" PRIMARY KEY("source_code","whodrug_version")
);
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
ALTER TABLE "system_settings" ALTER COLUMN "clinical_config" SET DEFAULT '{"timezone":"UTC+05:30 (IST)","retention":"24 months","twoFA":false,"sessionTimeout":"60 min","maxLoginAttempts":"5","passwordExpiry":"90 days","senderId":"CLINSOLUTION-DEFAULT","receiverId":"EVHUMAN","meddraVersion":"29.0","lockoutCooldown":"30 min","smtpHost":"","smtpPort":"587","smtpUser":"","smtpPass":"","smtpFrom":"info@viginess.com"}'::jsonb;--> statement-breakpoint
CREATE INDEX "whodrug_bna_drn_idx" ON "whodrug_bna" USING btree ("drug_record_number");--> statement-breakpoint
CREATE INDEX "whodrug_bna_name_idx" ON "whodrug_bna" USING btree ("alias_name");--> statement-breakpoint
CREATE INDEX "whodrug_dd_name_idx" ON "whodrug_dd" USING gin ("trade_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "whodrug_dd_drn_seq_idx" ON "whodrug_dd" USING btree ("drug_record_number","seq1");--> statement-breakpoint
CREATE INDEX "whodrug_dd_version_idx" ON "whodrug_dd" USING btree ("whodrug_version");--> statement-breakpoint
CREATE INDEX "whodrug_dda_drn_seq_idx" ON "whodrug_dda" USING btree ("drug_record_number","seq1");--> statement-breakpoint
CREATE INDEX "whodrug_dda_atc_idx" ON "whodrug_dda" USING btree ("atc_code");--> statement-breakpoint
CREATE INDEX "whodrug_ina_atc_idx" ON "whodrug_ina" USING btree ("atc_code");--> statement-breakpoint
CREATE INDEX "whodrug_ing_drn_seq_idx" ON "whodrug_ing" USING btree ("drug_record_number","seq1");--> statement-breakpoint
CREATE INDEX "whodrug_ing_code_idx" ON "whodrug_ing" USING btree ("ingredient_code");