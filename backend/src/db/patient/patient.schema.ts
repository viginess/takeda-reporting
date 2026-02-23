import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { severityEnum, statusEnum } from "../enums.schema.js";

export const patientReports = pgTable("patient_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  referenceId: text("reference_id"), // Custom human-readable ID e.g., REP-123456

  // ── Step 1: Product ─────────────────────────────────────
  products: jsonb("products"),

  // ── Step 2: Event (symptoms) ─────────────────────────────
  symptoms: jsonb("symptoms"),

  // ── Step 3: Personal & HCP (stored as JSONB objects) ────
  // patientDetails: { name, gender, initials, dob, ageValue, contactPermission, email }
  patientDetails: jsonb("patient_details"),
  // hcpDetails: { contactPermission, firstName, lastName, email, phone, institution, address, city, state, zipCode, country }
  hcpDetails: jsonb("hcp_details"),

  // ── Step 4: Additional Details ───────────────────────────
  takingOtherMeds: text("taking_other_meds"),
  otherMedications: jsonb("other_medications"),

  hasRelevantHistory: text("has_relevant_history"),
  medicalHistory: jsonb("medical_history"),

  labTestsPerformed: text("lab_tests_performed"),
  labTests: jsonb("lab_tests"),

  additionalDetails: text("additional_details"),
  attachments: jsonb("attachments"),               // base64 image arrays from Additional step

  // ── Step 5: Confirm ──────────────────────────────────────
  agreedToTerms: boolean("agreed_to_terms").notNull(),
  reporterType: text("reporter_type"),
  status: statusEnum("status").default("new"),
  severity: severityEnum("severity").default("info"),
  assignee: text("assignee"),
  adminNotes: text("admin_notes"),
  assignedAt: timestamp("assigned_at"),
  lastUpdatedAt: timestamp("last_updated_at"),

  // Meta
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    severityIdx: index("patient_severity_idx").on(table.severity),
    statusIdx: index("patient_status_idx").on(table.status),
    assigneeIdx: index("patient_assignee_idx").on(table.assignee),
    createdAtIdx: index("patient_created_at_idx").on(table.createdAt),
  };
});
