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

export const familyReports = pgTable("family_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  referenceId: text("reference_id"), // Custom human-readable ID e.g., REP-123456

  // ── Step 1: Product ─────────────────────────────────────
  products: jsonb("products"),

  // ── Step 2: Event (symptoms) ─────────────────────────────
  symptoms: jsonb("symptoms"),

  // ── Step 3: Personal & HCP (same as patient form) ────────
  // patientDetails: { name, gender, initials, dob, ageValue, contactPermission, email }
  patientDetails: jsonb("patient_details"),
  // hcpDetails: { contactPermission, firstName, lastName, email, phone, ... }
  hcpDetails: jsonb("hcp_details"),

  // ── Step 4: Additional Details ───────────────────────────
  takingOtherMeds: text("taking_other_meds"),
  otherMedications: jsonb("other_medications"),

  hasRelevantHistory: text("has_relevant_history"),
  medicalHistory: jsonb("medical_history"),

  labTestsPerformed: text("lab_tests_performed"),
  labTests: jsonb("lab_tests"),

  additionalDetails: text("additional_details"),
  attachments: jsonb("attachments"),

  // ── Step 5: Confirm ──────────────────────────────────────
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
    severityIdx: index("family_severity_idx").on(table.severity),
    statusIdx: index("family_status_idx").on(table.status),
    createdAtIdx: index("family_created_at_idx").on(table.createdAt),
  };
});
