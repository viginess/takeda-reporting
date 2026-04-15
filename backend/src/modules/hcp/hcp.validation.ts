import { z } from "zod";

// ─── Shared sub-schemas (same as patient) ────────────────────────────────────

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
  conditions: z.array(conditionSchema).optional(),
  batches: z.array(batchSchema).min(1, "At least one batch is required"),
  doseForm: z.string().optional(),
  route: z.string().optional(),
  whodrugCode: z.string().optional(),
});

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
  relationship: z.string().optional(),
});

const otherMedicationSchema = z.object({
  product: z.string().optional(),
  condition: z.string().optional(),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
});

const medicalHistorySchema = z.object({
  conditionName: z.string().optional(),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
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
  dob: z.string().optional().or(z.literal("")),
  ageValue: z.preprocess((val) => (typeof val === "string" ? parseInt(val, 10) : val), z.number({ invalid_type_error: "Age must be a number" }).optional()),
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
  reference: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
});

// ─── HCP reporter/you details ─────────────────────────────────────────────────

const hcpReporterDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  institution: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  contactPermission: z.string().min(1, "Contact permission is required"),
}).refine(data => {
  if (data.contactPermission === 'yes') {
    return !!data.email && !!data.phone;
  }
  return true;
}, {
  message: "Email and phone are required if contact permission is granted",
  path: ["email"]
});

// ─── Create schema ────────────────────────────────────────────────────────────

export const createHcpSchema = z.object({
  // Step 1: Product
  products: z.array(productSchema).min(1, "At least one product is required"),

  // Step 2: Event
  symptoms: z.array(symptomSchema).min(1, "At least one symptom is required"),

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
  status: z.enum(["new", "under_review", "closed"]).optional(),
  countryCode: z.string().optional(),
  submissionLanguage: z.string().optional().default("en"),
  severity: z.string().optional(),
  senderTimezoneOffset: z.number().optional(),
});

export const updateHcpSchema = createHcpSchema.partial();

export type CreateHcpInput = z.infer<typeof createHcpSchema>;
export type UpdateHcpInput = z.infer<typeof updateHcpSchema>;
