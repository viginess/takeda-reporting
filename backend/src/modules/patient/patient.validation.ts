import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// STEP 1 – PRODUCT DETAILS
// ─────────────────────────────────────────────────────────────

const conditionSchema = z.object({
  name: z.string().optional(),
  meddraCode: z.string().optional(),
});

const batchSchema = z.object({
  batchNumber: z.string().min(1, "Batch number is required"),
  expiryDate: z.string().optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  dosage: z.string().optional(),
});

const productSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  manufacturerName: z.string().optional(),
  conditions: z.array(conditionSchema).optional(),
  batches: z.array(batchSchema).min(1, "At least one batch is required"),
  dosage: z.string().optional(),
  actionTaken: z.string().optional(),
  whodrugCode: z.string().optional(),
  images: z.array(z.string()).optional(),           
});

// ─────────────────────────────────────────────────────────────
// STEP 2 – EVENT DETAILS (symptoms)
// ─────────────────────────────────────────────────────────────

const symptomSchema = z.object({
  name: z.string().min(1, "Symptom name is required"),
  meddraCode: z.string().optional(),
  lltCode: z.string().optional(),
  lltName: z.string().optional(),
  ptCode: z.string().optional(),
  ptName: z.string().optional(),
  meddraTerm: z.string().optional(),
  reactionId: z.string().optional(),
  eventStartDate: z.string().optional().or(z.literal("")),
  eventEndDate: z.string().optional().or(z.literal("")),
  symptomTreated: z.string().optional(),
  treatment: z.string().optional(),
  seriousness: z.union([z.string(), z.array(z.string())]).optional(),         
  outcome: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────
// STEP 3 – PERSONAL DETAILS (nested objects)
// ─────────────────────────────────────────────────────────────

export const patientDetailsSchema = z.object({
  name: z.string().optional().default(""),
  gender: z.preprocess((val) => {
    if (typeof val === "string") {
      const low = val.toLowerCase();
      if (low === "male") return "M";
      if (low === "female") return "F";
      if (low === "other") return "O";
      if (low === "" || low === "unknown") return "Unknown";
    }
    return val || "Unknown";
  }, z.enum(["M", "F", "O", "Unknown"]).optional().default("Unknown")),
  initials: z.string().optional(),
  dob: z.string().optional().or(z.literal("")),
  ageValue: z.preprocess((val) => (typeof val === "string" ? parseInt(val, 10) : val), z.number({ invalid_type_error: "Age must be a number" }).optional()),
  contactPermission: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

export const hcpDetailsSchema = z.object({
  contactPermission: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  relationship: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  institution: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  hcpContactPermission: z.string().optional(),
  hcpFirstName: z.string().optional(),
  hcpLastName: z.string().optional(),
  hcpEmail: z.string().optional(),
  hcpPhone: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────
// STEP 4 – ADDITIONAL DETAILS sub-schemas
// ─────────────────────────────────────────────────────────────

const otherMedicationSchema = z.object({
  product: z.string().optional(),
  condition: z.string().optional(),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
});

const medicalHistorySchema = z.object({
  conditionName: z.string().optional(),
  info: z.string().optional(),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
});

const labTestSchema = z.object({
  testName: z.string().optional(),
  testQualifier: z.string().optional(),
  testValue: z.string().optional(),
  testComments: z.string().optional(),
  outcome: z.array(z.string()).optional(),
});

// ─────────────────────────────────────────────────────────────
// MAIN VALIDATION SCHEMA (ordered to match form steps 1 → 5)
// ─────────────────────────────────────────────────────────────

export const createPatientSchema = z.object({

  // ── Step 1: Product ──────────────────────────────────────
  products: z.array(productSchema).min(1, "At least one product is required"),

  // ── Step 2: Event (symptoms) ──────────────────────────────
  symptoms: z.array(symptomSchema).min(1, "At least one symptom is required"),

  // ── Step 3: Personal & HCP (nested objects) ───────────────
  patientDetails: patientDetailsSchema.optional(),
  hcpDetails: hcpDetailsSchema.optional(),

  // ── Step 4: Additional Details ───────────────────────────
  takingOtherMeds: z.string().optional(),
  otherMedications: z.array(otherMedicationSchema).optional(),

  hasRelevantHistory: z.string().optional(),
  medicalHistory: z.array(medicalHistorySchema).optional(),

  labTestsPerformed: z.string().optional(),
  labTests: z.array(labTestSchema).optional(),

  additionalDetails: z.string().optional(),
  attachments: z.array(z.string()).optional(),        

  // ── Step 5: Confirm ──────────────────────────────────────
  agreedToTerms: z.boolean().refine((v) => v === true, {
    message: "You must agree to the terms",
  }),
  reporterType: z.enum(["patient", "hcp", "family"]).optional(),
  status: z.enum(["new", "under_review", "closed"]).optional(),
  countryCode: z.string().optional(),
  submissionLanguage: z.string().optional().default("en"),
  severity: z.string().optional(),
  senderTimezoneOffset: z.number().optional(),
  captchaToken: z.string().optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type PatientDetailsInput = z.infer<typeof patientDetailsSchema>;
export type HcpDetailsInput = z.infer<typeof hcpDetailsSchema>;

// Update schema — all fields optional
export const updatePatientSchema = createPatientSchema.partial().extend({
  agreedToTerms: z.boolean().optional(),
});

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
