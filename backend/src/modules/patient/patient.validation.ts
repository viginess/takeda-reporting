import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// STEP 1 – PRODUCT DETAILS
// ─────────────────────────────────────────────────────────────

const conditionSchema = z.object({
  name: z.string().optional(),
});

const batchSchema = z.object({
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  dosage: z.string().optional(),
});

const productSchema = z.object({
  productName: z.string().optional(),
  conditions: z.array(conditionSchema).optional(),
  condition: z.string().optional(),
  batches: z.array(batchSchema).optional(),
  dosage: z.string().optional(),
  actionTaken: z.string().optional(),
  images: z.array(z.string()).optional(),           
});

// ─────────────────────────────────────────────────────────────
// STEP 2 – EVENT DETAILS (symptoms)
// ─────────────────────────────────────────────────────────────

const symptomSchema = z.object({
  name: z.string().optional(),
  eventStartDate: z.string().optional(),
  eventEndDate: z.string().optional(),
  symptomTreated: z.string().optional(),
  treatment: z.string().optional(),
  seriousness: z.string().optional(),         
  outcome: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────
// STEP 3 – PERSONAL DETAILS (nested objects)
// ─────────────────────────────────────────────────────────────

export const patientDetailsSchema = z.object({
  name: z.string().optional().default(""),
  gender: z.string().optional().default(""),
  initials: z.string().optional(),
  dob: z.string().optional(),
  ageValue: z.union([z.number(), z.string()]).optional(),
  contactPermission: z.string().optional(),
  email: z.string().optional(),
});

export const hcpDetailsSchema = z.object({
  contactPermission: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  institution: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────
// STEP 4 – ADDITIONAL DETAILS sub-schemas
// ─────────────────────────────────────────────────────────────

const otherMedicationSchema = z.object({
  product: z.string().optional(),
  condition: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const medicalHistorySchema = z.object({
  conditionName: z.string().optional(),
  info: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
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
  products: z.array(productSchema).optional(),

  // ── Step 2: Event (symptoms) ──────────────────────────────
  symptoms: z.array(symptomSchema).optional(),

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
  status: z.enum(["pending", "in_review", "closed"]).optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type PatientDetailsInput = z.infer<typeof patientDetailsSchema>;
export type HcpDetailsInput = z.infer<typeof hcpDetailsSchema>;

// Update schema — all fields optional
export const updatePatientSchema = createPatientSchema.partial().extend({
  agreedToTerms: z.boolean().optional(),
});

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
