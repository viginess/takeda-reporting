import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { severityEnum, statusEnum } from "./enums.schema.js";

export const archivedReports = pgTable("archived_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  referenceId: text("reference_id"),
  
  // Original context
  originalTable: text("original_table").notNull(), // 'patient', 'hcp', 'family'
  
  // Flattened structure to support all report types
  products: jsonb("products"),
  symptoms: jsonb("symptoms"),
  patientDetails: jsonb("patient_details"),
  hcpDetails: jsonb("hcp_details"),
  reporterDetails: jsonb("reporter_details"), // Specific to HCP/Family
  
  takingOtherMeds: text("taking_other_meds"),
  otherMedications: jsonb("other_medications"),
  hasRelevantHistory: text("has_relevant_history"),
  medicalHistory: jsonb("medical_history"),
  labTestsPerformed: text("lab_tests_performed"),
  labTests: jsonb("lab_tests"),
  
  additionalDetails: text("additional_details"),
  attachments: jsonb("attachments"),
  
  agreedToTerms: boolean("agreed_to_terms"),
  reporterType: text("reporter_type"),
  status: statusEnum("status"),
  severity: severityEnum("severity"),
  adminNotes: text("admin_notes"),
  
  // Timestamps
  originalCreatedAt: timestamp("original_created_at"),
  archivedAt: timestamp("archived_at").defaultNow().notNull(),
});
