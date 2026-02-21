import { z } from "zod";

// ─── Shared sub-schemas (same as patient) ────────────────────────────────────

const conditionSchema = z.object({ name: z.string().optional() });

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
  batches: z.array(batchSchema).optional(),
  doseForm: z.string().optional(),
  route: z.string().optional(),
});

const symptomSchema = z.object({
  name: z.string().optional(),
  eventStartDate: z.string().optional(),
  eventEndDate: z.string().optional(),
  symptomTreated: z.string().optional(),
  treatment: z.string().optional(),
  seriousness: z.string().optional(),
  outcome: z.string().optional(),
  relationship: z.string().optional(),
});

const otherMedicationSchema = z.object({
  product: z.string().optional(),
  condition: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const medicalHistorySchema = z.object({
  conditionName: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  info: z.string().optional(),
});

const labTestSchema = z.object({
  testName: z.string().optional(),
  testQualifier: z.string().optional(),
  testValue: z.string().optional(),
  outcome: z.array(z.string()).optional(),
  testComments: z.string().optional(),
});

// ─── HCP-specific patient details ────────────────────────────────────────────

const hcpPatientDetailsSchema = z.object({
  initials: z.string().optional(),
  dob: z.string().optional(),
  age: z.union([z.number(), z.string()]).optional(),
  gender: z.string().optional(),
  reference: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
});

// ─── HCP reporter/you details ─────────────────────────────────────────────────

const hcpReporterDetailsSchema = z.object({
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
  contactPermission: z.string().optional(),
});

// ─── Create schema ────────────────────────────────────────────────────────────

export const createHcpSchema = z.object({
  // Step 1: Product
  products: z.array(productSchema).optional(),

  // Step 2: Event
  symptoms: z.array(symptomSchema).optional(),

  // Step 3: Patient (HCP view)
  patientDetails: hcpPatientDetailsSchema.optional(),

  // Step 4: Reporter / You
  reporterDetails: hcpReporterDetailsSchema.optional(),

  // Step 5: Additional
  takingOtherMeds: z.string().optional(),
  otherMedications: z.array(otherMedicationSchema).optional(),

  hasRelevantHistory: z.string().optional(),
  medicalHistory: z.array(medicalHistorySchema).optional(),

  labTestsPerformed: z.string().optional(),
  labTests: z.array(labTestSchema).optional(),

  additionalDetails: z.string().optional(),
  attachments: z.array(z.string()).optional(),

  // Step 6: Confirm
  agreedToTerms: z.boolean().refine((v) => v === true, {
    message: "You must agree to the terms",
  }),
  status: z.enum(["pending", "submitted", "reviewed", "closed"]).optional(),
});

export const updateHcpSchema = createHcpSchema.partial();

export type CreateHcpInput = z.infer<typeof createHcpSchema>;
export type UpdateHcpInput = z.infer<typeof updateHcpSchema>;
