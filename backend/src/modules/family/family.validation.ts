import { z } from "zod";

// ─── Shared sub-schemas (identical to patient) ───────────────────────────────

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

// ─── Step 3: Personal details (same shape as patient) ────────────────────────

const patientDetailsSchema = z.object({
  name: z.string().optional(),
  gender: z.string().optional(),
  initials: z.string().optional(),
  dob: z.string().optional(),
  ageValue: z.union([z.number(), z.string()]).optional(),
  contactPermission: z.string().optional(),
  email: z.string().optional(),
});

// ─── Step 3: HCP details (same shape as patient) ─────────────────────────────

const hcpDetailsSchema = z.object({
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

// ─── Create schema ────────────────────────────────────────────────────────────

export const createFamilySchema = z.object({
  // Step 1: Product
  products: z.array(productSchema).optional(),

  // Step 2: Event
  symptoms: z.array(symptomSchema).optional(),

  // Step 3: Personal & HCP (family form reuses patient-report PersonalDetails)
  patientDetails: patientDetailsSchema.optional(),
  hcpDetails: hcpDetailsSchema.optional(),

  // Step 4: Additional
  takingOtherMeds: z.string().optional(),
  otherMedications: z.array(otherMedicationSchema).optional(),

  hasRelevantHistory: z.string().optional(),
  medicalHistory: z.array(medicalHistorySchema).optional(),

  labTestsPerformed: z.string().optional(),
  labTests: z.array(labTestSchema).optional(),

  additionalDetails: z.string().optional(),
  attachments: z.array(z.string()).optional(),

  // Step 5: Confirm
  agreedToTerms: z.boolean().refine((v) => v === true, {
    message: "You must agree to the terms",
  }),
  status: z.enum(["pending", "submitted", "reviewed", "closed"]).optional(),
});

export const updateFamilySchema = createFamilySchema.partial();

export type CreateFamilyInput = z.infer<typeof createFamilySchema>;
export type UpdateFamilyInput = z.infer<typeof updateFamilySchema>;
