import { pgTable, serial, jsonb, timestamp } from "drizzle-orm/pg-core";

export const hcpReports = pgTable("hcp_reports", {
  id: serial("id").primaryKey(),
  products: jsonb("products"),
  symptoms: jsonb("symptoms"),
  patientDetails: jsonb("patient_details"),
  reporterDetails: jsonb("reporter_details"),
  additionalDetails: jsonb("additional_details"),
  createdAt: timestamp("created_at").defaultNow(),
});
