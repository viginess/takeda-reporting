ALTER TABLE "system_settings" ALTER COLUMN "clinical_config" SET DEFAULT '{"adminEmail":"admin@pharma.com","timezone":"UTC+05:30 (IST)","retention":"24 months","twoFA":false,"sessionTimeout":"60 min","maxLoginAttempts":"5","passwordExpiry":"90 days","senderId":"CLINSOLUTION-DEFAULT","receiverId":"EVHUMAN","meddraVersion":"29.0","lockoutCooldown":"30 min"}'::jsonb;--> statement-breakpoint
CREATE INDEX "meddra_hlgt_version_idx" ON "meddra_hlgt" USING btree ("meddra_version");--> statement-breakpoint
CREATE INDEX "meddra_hlt_version_idx" ON "meddra_hlt" USING btree ("meddra_version");--> statement-breakpoint
CREATE INDEX "meddra_llt_version_idx" ON "meddra_llt" USING btree ("meddra_version");--> statement-breakpoint
CREATE INDEX "meddra_pt_version_idx" ON "meddra_pt" USING btree ("meddra_version");--> statement-breakpoint
CREATE INDEX "meddra_soc_version_idx" ON "meddra_soc" USING btree ("meddra_version");