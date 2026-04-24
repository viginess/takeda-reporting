ALTER TABLE "companies" DROP CONSTRAINT "companies_company_code_unique";--> statement-breakpoint
DROP INDEX "companies_code_idx";--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "company_code";