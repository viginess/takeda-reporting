import { z } from "zod";

// ------- Sub-schemas (match exact field names used in form components) -------

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
  // conditions is an array of { name } objects
  conditions: z.array(conditionSchema).optional(),
  // legacy single condition field
  condition: z.string().optional(),
  batches: z.array(batchSchema).optional(),
  dosage: z.string().optional(),
  actionTaken: z.string().optional(),
});

const symptomSchema = z.object({
  name: z.string().optional(),
  eventStartDate: z.string().optional(),
  eventEndDate: z.string().optional(),
  symptomTreated: z.string().optional(),
  treatment: z.string().optional(),
  // seriousness is a string[] from CheckboxGroup
  seriousness: z.array(z.string()).optional(),
  outcome: z.string().optional(),
});

const otherMedicationSchema = z.object({
  // form uses "product" as the field name (not "name")
  product: z.string().optional(),
  condition: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const medicalHistorySchema = z.object({
  // form uses "conditionName" and "info"
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
  // outcome is a string[] from CheckboxGroup
  outcome: z.array(z.string()).optional(),
});

// ------- Main patient form schema -------
export const createPatientSchema = z.object({
  // Personal
  name: z.string().optional().default(""),
  gender: z.string().optional().default(""),
  initials: z.string().optional(),
  dob: z.string().optional(),
  ageValue: z.union([z.number(), z.string()]).optional(),
  contactPermission: z.string().optional(),
  email: z.string().optional(),

  // HCP
  hcpContactPermission: z.string().optional(),
  hcpFirstName: z.string().optional(),
  hcpLastName: z.string().optional(),
  hcpEmail: z.string().optional(),
  hcpPhone: z.string().optional(),
  hcpInstitution: z.string().optional(),
  hcpAddress: z.string().optional(),
  hcpCity: z.string().optional(),
  hcpState: z.string().optional(),
  hcpZipCode: z.string().optional(),
  hcpCountry: z.string().optional(),

  // Medical flags (from Radio state in parent)
  takingOtherMeds: z.string().optional(),
  hasRelevantHistory: z.string().optional(),
  labTestsPerformed: z.string().optional(),
  additionalDetails: z.string().optional(),

  // JSONB arrays — full shape matching form field names
  products: z.array(productSchema).optional(),
  symptoms: z.array(symptomSchema).optional(),
  otherMedications: z.array(otherMedicationSchema).optional(),
  medicalHistory: z.array(medicalHistorySchema).optional(),
  labTests: z.array(labTestSchema).optional(),

  // Consent
  agreedToTerms: z.boolean().refine((v) => v === true, {
    message: "You must agree to the terms",
  }),

  // Meta
  reporterType: z.enum(["patient", "hcp", "family"]).optional(),
  status: z.enum(["pending", "in_review", "closed"]).optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

// Update schema — all fields optional
export const updatePatientSchema = createPatientSchema.partial().extend({
  agreedToTerms: z.boolean().optional(),
});

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
