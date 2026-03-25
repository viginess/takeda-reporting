CREATE TABLE "meddra_hlgt" (
	"hlgt_code" integer PRIMARY KEY NOT NULL,
	"hlgt_name" text NOT NULL,
	"meddra_version" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meddra_hlgt_hlt" (
	"hlgt_code" integer NOT NULL,
	"hlt_code" integer NOT NULL,
	"meddra_version" text NOT NULL,
	CONSTRAINT "meddra_hlgt_hlt_hlgt_code_hlt_code_meddra_version_pk" PRIMARY KEY("hlgt_code","hlt_code","meddra_version")
);
--> statement-breakpoint
CREATE TABLE "meddra_hlt" (
	"hlt_code" integer PRIMARY KEY NOT NULL,
	"hlt_name" text NOT NULL,
	"meddra_version" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meddra_hlt_pt" (
	"hlt_code" integer NOT NULL,
	"pt_code" integer NOT NULL,
	"meddra_version" text NOT NULL,
	CONSTRAINT "meddra_hlt_pt_hlt_code_pt_code_meddra_version_pk" PRIMARY KEY("hlt_code","pt_code","meddra_version")
);
--> statement-breakpoint
CREATE TABLE "meddra_llt" (
	"llt_code" integer PRIMARY KEY NOT NULL,
	"llt_name" text NOT NULL,
	"pt_code" integer NOT NULL,
	"llt_currency" text,
	"meddra_version" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meddra_mdhier" (
	"pt_code" integer NOT NULL,
	"hlt_code" integer NOT NULL,
	"hlgt_code" integer NOT NULL,
	"soc_code" integer NOT NULL,
	"pt_name" text NOT NULL,
	"hlt_name" text NOT NULL,
	"hlgt_name" text NOT NULL,
	"soc_name" text NOT NULL,
	"soc_abbrev" text,
	"pt_soc_code" integer,
	"primary_soc_fg" text,
	"meddra_version" text NOT NULL,
	CONSTRAINT "meddra_mdhier_pt_code_hlt_code_hlgt_code_soc_code_meddra_version_pk" PRIMARY KEY("pt_code","hlt_code","hlgt_code","soc_code","meddra_version")
);
--> statement-breakpoint
CREATE TABLE "meddra_pt" (
	"pt_code" integer PRIMARY KEY NOT NULL,
	"pt_name" text NOT NULL,
	"pt_soc_code" integer,
	"meddra_version" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meddra_smq_content" (
	"smq_code" integer NOT NULL,
	"term_code" integer NOT NULL,
	"term_level" integer NOT NULL,
	"term_scope" integer,
	"term_category" text,
	"term_weight" integer,
	"term_status" text,
	"meddra_version" text NOT NULL,
	CONSTRAINT "meddra_smq_content_smq_code_term_code_meddra_version_pk" PRIMARY KEY("smq_code","term_code","meddra_version")
);
--> statement-breakpoint
CREATE TABLE "meddra_smq_list" (
	"smq_code" integer PRIMARY KEY NOT NULL,
	"smq_name" text NOT NULL,
	"smq_level" integer NOT NULL,
	"smq_description" text,
	"smq_source" text,
	"smq_note" text,
	"meddra_version" text NOT NULL,
	"status" text,
	"smq_algorithm" text
);
--> statement-breakpoint
CREATE TABLE "meddra_soc" (
	"soc_code" integer PRIMARY KEY NOT NULL,
	"soc_name" text NOT NULL,
	"soc_abbrev" text,
	"meddra_version" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meddra_soc_hlgt" (
	"soc_code" integer NOT NULL,
	"hlgt_code" integer NOT NULL,
	"meddra_version" text NOT NULL,
	CONSTRAINT "meddra_soc_hlgt_soc_code_hlgt_code_meddra_version_pk" PRIMARY KEY("soc_code","hlgt_code","meddra_version")
);
--> statement-breakpoint
CREATE TABLE "meddra_soc_intl_order" (
	"soc_code" integer NOT NULL,
	"intl_ord_code" integer NOT NULL,
	"meddra_version" text NOT NULL,
	CONSTRAINT "meddra_soc_intl_order_soc_code_meddra_version_pk" PRIMARY KEY("soc_code","meddra_version")
);
--> statement-breakpoint
ALTER TABLE "system_settings" ALTER COLUMN "clinical_config" SET DEFAULT '{"adminEmail":"admin@pharma.com","timezone":"UTC+05:30 (IST)","retention":"24 months","twoFA":false,"sessionTimeout":"60 min","maxLoginAttempts":"5","passwordExpiry":"90 days","senderId":"CLINSOLUTION-DEFAULT","receiverId":"EVHUMAN","meddraVersion":"29.1","lockoutCooldown":"30 min"}'::jsonb;--> statement-breakpoint
ALTER TABLE "family_reports" ADD COLUMN "submission_language" text DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "hcp_reports" ADD COLUMN "submission_language" text DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "patient_reports" ADD COLUMN "submission_language" text DEFAULT 'en';--> statement-breakpoint
CREATE INDEX "meddra_hlgt_name_idx" ON "meddra_hlgt" USING btree ("hlgt_name");--> statement-breakpoint
CREATE INDEX "meddra_hlt_name_idx" ON "meddra_hlt" USING btree ("hlt_name");--> statement-breakpoint
CREATE INDEX "meddra_llt_name_idx" ON "meddra_llt" USING btree ("llt_name");--> statement-breakpoint
CREATE INDEX "meddra_llt_pt_idx" ON "meddra_llt" USING btree ("pt_code");--> statement-breakpoint
CREATE INDEX "meddra_hier_pt_name_idx" ON "meddra_mdhier" USING btree ("pt_name");--> statement-breakpoint
CREATE INDEX "meddra_hier_pt_code_idx" ON "meddra_mdhier" USING btree ("pt_code");--> statement-breakpoint
CREATE INDEX "meddra_pt_name_idx" ON "meddra_pt" USING btree ("pt_name");--> statement-breakpoint
CREATE INDEX "meddra_smq_name_idx" ON "meddra_smq_list" USING btree ("smq_name");--> statement-breakpoint
CREATE INDEX "meddra_soc_name_idx" ON "meddra_soc" USING btree ("soc_name");