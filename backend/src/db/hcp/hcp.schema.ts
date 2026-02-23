import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

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
  status: text("status").default("pending"),

  // Meta
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
