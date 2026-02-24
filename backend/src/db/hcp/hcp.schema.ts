import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { severityEnum, statusEnum } from "../shared/enums.schema.js";

export const hcpReports = pgTable("hcp_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  referenceId: text("reference_id"), // Custom human-readable ID e.g., REP-123456

  // ── Step 1: Product ─────────────────────────────────────
  products: jsonb("products"),

  // ── Step 2: Event (symptoms) ─────────────────────────────
  symptoms: jsonb("symptoms"),

  // ── Step 3: Patient details (HCP-specific fields) ────────
  // { initials, dob, age, gender, reference, height, weight }
  patientDetails: jsonb("patient_details"),

  // ── Step 4: Reporter / You ───────────────────────────────
  // { firstName, lastName, email, phone, institution, address, city, state, zipCode, country, contactPermission }
  reporterDetails: jsonb("reporter_details"),

  // ── Step 5: Additional Details ───────────────────────────
  takingOtherMeds: text("taking_other_meds"),
  otherMedications: jsonb("other_medications"),

  hasRelevantHistory: text("has_relevant_history"),
  medicalHistory: jsonb("medical_history"),

  labTestsPerformed: text("lab_tests_performed"),
  labTests: jsonb("lab_tests"),

  additionalDetails: text("additional_details"),
  attachments: jsonb("attachments"),

  // ── Step 6: Confirm ──────────────────────────────────────
  agreedToTerms: boolean("agreed_to_terms").notNull().default(false),
  status: statusEnum("status").default("new"),
  severity: severityEnum("severity").default("info"),
  adminNotes: text("admin_notes"),
  lastUpdatedAt: timestamp("last_updated_at"),

  // Meta
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    severityIdx: index("hcp_severity_idx").on(table.severity),
    statusIdx: index("hcp_status_idx").on(table.status),
    createdAtIdx: index("hcp_created_at_idx").on(table.createdAt),
  };
});
