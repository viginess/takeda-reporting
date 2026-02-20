import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure } from "../../trpc/trpc.js";
import { db } from "../../db/index.js";
import { patients } from "../../db/schema.js";

// ─── Zod sub-schemas ─────────────────────────────────────────────────────────

const batchSchema = z.object({
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  dosage: z.string().optional(),
});

const conditionSchema = z.object({
  name: z.string().optional(),
});

const productSchema = z.object({
  productName: z.string(),
  conditions: z.array(conditionSchema).optional(),
  batches: z.array(batchSchema).optional(),
  actionTaken: z.string().optional(),
});

const symptomSchema = z.object({
  name: z.string(),
  eventStartDate: z.string().optional(),
  eventEndDate: z.string().optional(),
  symptomTreated: z.string().optional(),
  treatment: z.string().optional(),
  seriousness: z.array(z.string()).optional(),
  outcome: z.string().optional(),
});

const otherMedSchema = z.object({
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

// ─── Submission input schema ──────────────────────────────────────────────────

const patientCreateInput = z.object({
  // Step 1
  products: z.array(productSchema).optional(),

  // Step 2
  symptoms: z.array(symptomSchema).optional(),

  // Step 3 – Personal
  initials: z.string().optional(),
  dob: z.string().optional(),
  ageValue: z.string().optional(),
  sex: z.string().optional(),
  contactPermission: z.string().optional(),
  email: z.string().optional(),
  name: z.string().optional(),
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

  // Step 4 – Additional
  otherMedications: z.array(otherMedSchema).optional(),
  medicalHistory: z.array(medicalHistorySchema).optional(),
  labTests: z.array(labTestSchema).optional(),
  additionalDetails: z.string().optional(),
});

// ─── Router ──────────────────────────────────────────────────────────────────

export const patientRouter = router({
  /** Submit a new adverse-event report */
  create: publicProcedure
    .input(patientCreateInput)
    .mutation(async ({ input }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const values: any = {
        products: input.products ?? [],
        symptoms: input.symptoms ?? [],
        initials: input.initials,
        dob: input.dob,
        ageValue: input.ageValue,
        sex: input.sex,
        contactPermission: input.contactPermission,
        email: input.email,
        name: input.name,
        hcpContactPermission: input.hcpContactPermission,
        hcpFirstName: input.hcpFirstName,
        hcpLastName: input.hcpLastName,
        hcpEmail: input.hcpEmail,
        hcpPhone: input.hcpPhone,
        hcpInstitution: input.hcpInstitution,
        hcpAddress: input.hcpAddress,
        hcpCity: input.hcpCity,
        hcpState: input.hcpState,
        hcpZipCode: input.hcpZipCode,
        hcpCountry: input.hcpCountry,
        otherMedications: input.otherMedications ?? [],
        medicalHistory: input.medicalHistory ?? [],
        labTests: input.labTests ?? [],
        additionalDetails: input.additionalDetails,
      };
      const inserted = await db
        .insert(patients)
        .values(values)
        .returning();

      return { success: true, report: inserted[0] };
    }),

  /** List all reports (for admin dashboard) */
  getAll: publicProcedure.query(async () => {
    const reports = await db
      .select({
        id: patients.id,
        initials: patients.initials,
        name: patients.name,
        email: patients.email,
        status: patients.status,
        submittedAt: patients.submittedAt,
      })
      .from(patients)
      .orderBy(patients.submittedAt);

    return reports;
  }),

  /** Get a single report by ID */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const report = await db
        .select()
        .from(patients)
        .where(eq(patients.id, input.id))
        .limit(1);

      if (!report[0]) {
        throw new Error(`Report with id ${input.id} not found`);
      }
      return report[0];
    }),

  /** Update report review status */
  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["pending", "under_review", "completed", "closed"]),
      })
    )
    .mutation(async ({ input }) => {
      const updated = await db
        .update(patients)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(patients.id, input.id))
        .returning({ id: patients.id, status: patients.status });

      return { success: true, report: updated[0] };
    }),

  /** Delete a report */
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db.delete(patients).where(eq(patients.id, input.id));
      return { success: true };
    }),
});
