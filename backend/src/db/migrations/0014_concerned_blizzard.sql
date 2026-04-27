CREATE TABLE "dictionary_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "whodrug_bna" DROP CONSTRAINT "whodrug_bna_drug_record_number_alias_name_whodrug_version_unique";--> statement-breakpoint
ALTER TABLE "whodrug_dd" DROP CONSTRAINT "whodrug_dd_drug_record_number_seq1_seq2_whodrug_version_unique";--> statement-breakpoint
ALTER TABLE "whodrug_dda" DROP CONSTRAINT "whodrug_dda_drug_record_number_seq1_atc_code_whodrug_version_unique";--> statement-breakpoint
ALTER TABLE "whodrug_ing" DROP CONSTRAINT "whodrug_ing_drug_record_number_seq1_ingredient_code_whodrug_version_unique";--> statement-breakpoint
DROP INDEX "meddra_hlgt_version_idx";--> statement-breakpoint
DROP INDEX "meddra_hlt_version_idx";--> statement-breakpoint
DROP INDEX "meddra_llt_version_idx";--> statement-breakpoint
DROP INDEX "meddra_pt_version_idx";--> statement-breakpoint
DROP INDEX "meddra_soc_version_idx";--> statement-breakpoint
DROP INDEX "whodrug_bna_version_idx";--> statement-breakpoint
DROP INDEX "whodrug_ccode_version_idx";--> statement-breakpoint
DROP INDEX "whodrug_dd_version_idx";--> statement-breakpoint
DROP INDEX "whodrug_dda_version_idx";--> statement-breakpoint
DROP INDEX "whodrug_ina_version_idx";--> statement-breakpoint
DROP INDEX "whodrug_ing_version_idx";--> statement-breakpoint
DROP INDEX "whodrug_man_version_idx";--> statement-breakpoint
DROP INDEX "whodrug_source_version_idx";--> statement-breakpoint
ALTER TABLE "meddra_hlgt_hlt" DROP CONSTRAINT "meddra_hlgt_hlt_hlgt_code_hlt_code_meddra_version_pk";--> statement-breakpoint
ALTER TABLE "meddra_hlt_pt" DROP CONSTRAINT "meddra_hlt_pt_hlt_code_pt_code_meddra_version_pk";--> statement-breakpoint
ALTER TABLE "meddra_mdhier" DROP CONSTRAINT "meddra_mdhier_pt_code_hlt_code_hlgt_code_soc_code_meddra_version_pk";--> statement-breakpoint
ALTER TABLE "meddra_smq_content" DROP CONSTRAINT "meddra_smq_content_smq_code_term_code_meddra_version_pk";--> statement-breakpoint
ALTER TABLE "meddra_soc_hlgt" DROP CONSTRAINT "meddra_soc_hlgt_soc_code_hlgt_code_meddra_version_pk";--> statement-breakpoint
ALTER TABLE "meddra_soc_intl_order" DROP CONSTRAINT "meddra_soc_intl_order_soc_code_meddra_version_pk";--> statement-breakpoint
ALTER TABLE "whodrug_ccode" DROP CONSTRAINT "whodrug_ccode_country_code_whodrug_version_pk";--> statement-breakpoint
ALTER TABLE "whodrug_ina" DROP CONSTRAINT "whodrug_ina_atc_code_whodrug_version_pk";--> statement-breakpoint
ALTER TABLE "whodrug_man" DROP CONSTRAINT "whodrug_man_company_code_whodrug_version_pk";--> statement-breakpoint
ALTER TABLE "whodrug_source" DROP CONSTRAINT "whodrug_source_source_code_whodrug_version_pk";--> statement-breakpoint
ALTER TABLE "archived_reports" ALTER COLUMN "reference_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "archived_reports" ALTER COLUMN "reporter_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "meddra_hlgt" ALTER COLUMN "meddra_version" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "meddra_hlgt_hlt" ALTER COLUMN "meddra_version" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "meddra_hlt" ALTER COLUMN "meddra_version" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "meddra_hlt_pt" ALTER COLUMN "meddra_version" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "meddra_llt" ALTER COLUMN "meddra_version" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "meddra_mdhier" ALTER COLUMN "meddra_version" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "meddra_pt" ALTER COLUMN "meddra_version" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "meddra_smq_content" ALTER COLUMN "meddra_version" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "meddra_smq_list" ALTER COLUMN "meddra_version" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "meddra_soc" ALTER COLUMN "meddra_version" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "meddra_soc_hlgt" ALTER COLUMN "meddra_version" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "meddra_soc_intl_order" ALTER COLUMN "meddra_version" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "whodrug_bna" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "whodrug_dd" ALTER COLUMN "rid" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "whodrug_dda" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "whodrug_ing" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "meddra_hlgt_hlt" ADD CONSTRAINT "meddra_hlgt_hlt_hlgt_code_hlt_code_version_id_pk" PRIMARY KEY("hlgt_code","hlt_code","version_id");--> statement-breakpoint
ALTER TABLE "meddra_hlt_pt" ADD CONSTRAINT "meddra_hlt_pt_hlt_code_pt_code_version_id_pk" PRIMARY KEY("hlt_code","pt_code","version_id");--> statement-breakpoint
ALTER TABLE "meddra_mdhier" ADD CONSTRAINT "meddra_mdhier_pt_code_hlt_code_hlgt_code_soc_code_version_id_pk" PRIMARY KEY("pt_code","hlt_code","hlgt_code","soc_code","version_id");--> statement-breakpoint
ALTER TABLE "meddra_smq_content" ADD CONSTRAINT "meddra_smq_content_smq_code_term_code_version_id_pk" PRIMARY KEY("smq_code","term_code","version_id");--> statement-breakpoint
ALTER TABLE "meddra_soc_hlgt" ADD CONSTRAINT "meddra_soc_hlgt_soc_code_hlgt_code_version_id_pk" PRIMARY KEY("soc_code","hlgt_code","version_id");--> statement-breakpoint
ALTER TABLE "meddra_soc_intl_order" ADD CONSTRAINT "meddra_soc_intl_order_soc_code_version_id_pk" PRIMARY KEY("soc_code","version_id");--> statement-breakpoint
ALTER TABLE "whodrug_ina" ADD CONSTRAINT "whodrug_ina_atc_code_version_id_pk" PRIMARY KEY("atc_code","version_id");--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN "active_meddra_version_id" integer;--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN "active_whodrug_version_id" integer;--> statement-breakpoint
ALTER TABLE "archived_reports" ADD COLUMN "storage_path" text NOT NULL;--> statement-breakpoint
ALTER TABLE "meddra_hlgt" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "meddra_hlgt_hlt" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "meddra_hlt" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "meddra_hlt_pt" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "meddra_llt" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "meddra_mdhier" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "meddra_pt" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "meddra_smq_content" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "meddra_smq_list" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "meddra_soc" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "meddra_soc_hlgt" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "meddra_soc_intl_order" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "whodrug_bna" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "whodrug_ccode" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "whodrug_ccode" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "whodrug_dd" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "whodrug_dd" ADD COLUMN "company_id" integer;--> statement-breakpoint
ALTER TABLE "whodrug_dd" ADD COLUMN "country_id" integer;--> statement-breakpoint
ALTER TABLE "whodrug_dd" ADD COLUMN "source_id" integer;--> statement-breakpoint
ALTER TABLE "whodrug_dda" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "whodrug_ina" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "whodrug_ing" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "whodrug_man" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "whodrug_man" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "whodrug_source" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "whodrug_source" ADD COLUMN "version_id" integer;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_active_meddra_version_id_dictionary_versions_id_fk" FOREIGN KEY ("active_meddra_version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_active_whodrug_version_id_dictionary_versions_id_fk" FOREIGN KEY ("active_whodrug_version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meddra_hlgt" ADD CONSTRAINT "meddra_hlgt_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meddra_hlgt_hlt" ADD CONSTRAINT "meddra_hlgt_hlt_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meddra_hlt" ADD CONSTRAINT "meddra_hlt_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meddra_hlt_pt" ADD CONSTRAINT "meddra_hlt_pt_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meddra_llt" ADD CONSTRAINT "meddra_llt_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meddra_mdhier" ADD CONSTRAINT "meddra_mdhier_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meddra_pt" ADD CONSTRAINT "meddra_pt_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meddra_smq_content" ADD CONSTRAINT "meddra_smq_content_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meddra_smq_list" ADD CONSTRAINT "meddra_smq_list_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meddra_soc" ADD CONSTRAINT "meddra_soc_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meddra_soc_hlgt" ADD CONSTRAINT "meddra_soc_hlgt_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meddra_soc_intl_order" ADD CONSTRAINT "meddra_soc_intl_order_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whodrug_bna" ADD CONSTRAINT "whodrug_bna_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whodrug_ccode" ADD CONSTRAINT "whodrug_ccode_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whodrug_dd" ADD CONSTRAINT "whodrug_dd_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whodrug_dda" ADD CONSTRAINT "whodrug_dda_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whodrug_ina" ADD CONSTRAINT "whodrug_ina_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whodrug_ing" ADD CONSTRAINT "whodrug_ing_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whodrug_man" ADD CONSTRAINT "whodrug_man_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whodrug_source" ADD CONSTRAINT "whodrug_source_version_id_dictionary_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."dictionary_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "whodrug_dd_company_idx" ON "whodrug_dd" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "whodrug_dd_country_idx" ON "whodrug_dd" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "whodrug_dd_source_idx" ON "whodrug_dd" USING btree ("source_id");--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "original_table";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "products";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "symptoms";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "patient_details";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "hcp_details";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "reporter_details";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "taking_other_meds";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "other_medications";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "has_relevant_history";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "medical_history";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "lab_tests_performed";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "lab_tests";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "additional_details";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "attachments";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "agreed_to_terms";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "severity";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "admin_notes";--> statement-breakpoint
ALTER TABLE "archived_reports" DROP COLUMN "original_created_at";--> statement-breakpoint
ALTER TABLE "whodrug_bna" DROP COLUMN "whodrug_version";--> statement-breakpoint
ALTER TABLE "whodrug_ccode" DROP COLUMN "whodrug_version";--> statement-breakpoint
ALTER TABLE "whodrug_dd" DROP COLUMN "company_code";--> statement-breakpoint
ALTER TABLE "whodrug_dd" DROP COLUMN "country_code";--> statement-breakpoint
ALTER TABLE "whodrug_dd" DROP COLUMN "source_code";--> statement-breakpoint
ALTER TABLE "whodrug_dd" DROP COLUMN "whodrug_version";--> statement-breakpoint
ALTER TABLE "whodrug_dda" DROP COLUMN "whodrug_version";--> statement-breakpoint
ALTER TABLE "whodrug_ina" DROP COLUMN "whodrug_version";--> statement-breakpoint
ALTER TABLE "whodrug_ing" DROP COLUMN "ingredient_name";--> statement-breakpoint
ALTER TABLE "whodrug_ing" DROP COLUMN "whodrug_version";--> statement-breakpoint
ALTER TABLE "whodrug_man" DROP COLUMN "whodrug_version";--> statement-breakpoint
ALTER TABLE "whodrug_source" DROP COLUMN "whodrug_version";--> statement-breakpoint
ALTER TABLE "whodrug_bna" ADD CONSTRAINT "whodrug_bna_drug_record_number_alias_name_version_id_unique" UNIQUE("drug_record_number","alias_name","version_id");--> statement-breakpoint
ALTER TABLE "whodrug_ccode" ADD CONSTRAINT "whodrug_ccode_unq" UNIQUE("country_code","version_id");--> statement-breakpoint
ALTER TABLE "whodrug_dd" ADD CONSTRAINT "whodrug_dd_drug_record_number_seq1_seq2_version_id_unique" UNIQUE("drug_record_number","seq1","seq2","version_id");--> statement-breakpoint
ALTER TABLE "whodrug_dda" ADD CONSTRAINT "whodrug_dda_drug_record_number_seq1_atc_code_version_id_unique" UNIQUE("drug_record_number","seq1","atc_code","version_id");--> statement-breakpoint
ALTER TABLE "whodrug_ing" ADD CONSTRAINT "whodrug_ing_drug_record_number_seq1_ingredient_code_version_id_unique" UNIQUE("drug_record_number","seq1","ingredient_code","version_id");--> statement-breakpoint
ALTER TABLE "whodrug_man" ADD CONSTRAINT "whodrug_man_unq" UNIQUE("company_code","version_id");--> statement-breakpoint
ALTER TABLE "whodrug_source" ADD CONSTRAINT "whodrug_source_unq" UNIQUE("source_code","version_id");