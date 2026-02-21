CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_name" text NOT NULL,
	"age" integer NOT NULL,
	"gender" text NOT NULL,
	"diagnosis" text,
	"treatment" text,
	"created_at" timestamp DEFAULT now()
);
