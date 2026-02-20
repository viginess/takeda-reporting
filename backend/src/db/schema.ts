import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  date,
} from "drizzle-orm/pg-core";

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Personal
  initials: text("initials"),
  dob: date("dob"),
  ageValue: integer("age_value"),
  gender: text("gender").notNull(),
  contactPermission: text("contact_permission"),
  email: text("email"),
  name: text("name").notNull(),

  // HCP
  hcpContactPermission: text("hcp_contact_permission"),
  hcpFirstName: text("hcp_first_name"),
  hcpLastName: text("hcp_last_name"),
  hcpEmail: text("hcp_email"),
  hcpPhone: text("hcp_phone"),
  hcpInstitution: text("hcp_institution"),
  hcpAddress: text("hcp_address"),
  hcpCity: text("hcp_city"),
  hcpState: text("hcp_state"),
  hcpZipCode: text("hcp_zip_code"),
  hcpCountry: text("hcp_country"),

  // Medical
  takingOtherMeds: text("taking_other_meds"),
  hasRelevantHistory: text("has_relevant_history"),
  labTestsPerformed: text("lab_tests_performed"),
  additionalDetails: text("additional_details"),

  // Arrays
  products: jsonb("products"),
  symptoms: jsonb("symptoms"),
  otherMedications: jsonb("other_medications"),
  medicalHistory: jsonb("medical_history"),
  labTests: jsonb("lab_tests"),

  // Consent
  agreedToTerms: boolean("agreed_to_terms").notNull(),

  // Meta
  status: text("status").default("pending"),
  reporterType: text("reporter_type"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});