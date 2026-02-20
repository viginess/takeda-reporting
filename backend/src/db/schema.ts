import {
  pgTable,
  text,
  serial,
  timestamp,
  jsonb,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─── Users table (existing) ───────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Enums ────────────────────────────────────────────────────────────────────
export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "under_review",
  "completed",
  "closed",
]);

// ─── Patients / adverse-event reports ────────────────────────────────────────
export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Step 1 – Product
  products: jsonb("products").$type<
    Array<{
      productName: string;
      conditions?: Array<{ name?: string }>;
      batches?: Array<{
        batchNumber?: string;
        expiryDate?: string;
        startDate?: string;
        endDate?: string;
        dosage?: string;
      }>;
      actionTaken?: string;
    }>
  >(),

  // Step 2 – Event / symptoms
  symptoms: jsonb("symptoms").$type<
    Array<{
      name: string;
      eventStartDate?: string;
      eventEndDate?: string;
      symptomTreated?: string;
      treatment?: string;
      seriousness?: string[];
      outcome?: string;
    }>
  >(),

  // Step 3 – Personal
  initials: text("initials"),
  dob: text("dob"),
  ageValue: text("age_value"),
  sex: text("sex"),
  contactPermission: text("contact_permission"),
  email: text("email"),
  name: text("name"),
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

  // Step 4 – Additional
  otherMedications: jsonb("other_medications").$type<
    Array<{
      product?: string;
      condition?: string;
      startDate?: string;
      endDate?: string;
    }>
  >(),
  medicalHistory: jsonb("medical_history").$type<
    Array<{
      conditionName?: string;
      startDate?: string;
      endDate?: string;
      info?: string;
    }>
  >(),
  labTests: jsonb("lab_tests").$type<
    Array<{
      testName?: string;
      testQualifier?: string;
      testValue?: string;
      outcome?: string[];
      testComments?: string;
    }>
  >(),
  additionalDetails: text("additional_details"),

  // Metadata
  status: reportStatusEnum("status").default("pending"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
