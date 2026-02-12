import { pgTable, serial, jsonb, timestamp } from "drizzle-orm/pg-core";

export const patientReports = pgTable("patient_reports", {
  id: serial("id").primaryKey(),
  products: jsonb("products"),
  symptoms: jsonb("symptoms"),
  personalDetails: jsonb("personal_details"),
  additionalDetails: jsonb("additional_details"),
  createdAt: timestamp("created_at").defaultNow(),
});
