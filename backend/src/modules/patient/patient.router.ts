import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, publicProcedure } from "../../trpc/trpc.js";
import { db } from "../../db/index.js";
import { patients } from "../../db/schema.js";
import { createPatientSchema, updatePatientSchema } from "./patient.schema.js";

export const patientRouter = router({
  // ─── CREATE ────────────────────────────────────────────────────────────────
  create: publicProcedure
    .input(createPatientSchema)
    .mutation(async ({ input }) => {
      const [row] = await db
        .insert(patients)
        .values({
          // Personal
          name: input.name,
          gender: input.gender,
          initials: input.initials,
          dob: input.dob,
          ageValue: input.ageValue != null ? Number(input.ageValue) : undefined,
          contactPermission: input.contactPermission,
          email: input.email,

          // HCP
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

          // Medical
          takingOtherMeds: input.takingOtherMeds,
          hasRelevantHistory: input.hasRelevantHistory,
          labTestsPerformed: input.labTestsPerformed,
          additionalDetails: input.additionalDetails,

          // JSONB
          products: input.products ?? [],
          symptoms: input.symptoms ?? [],
          otherMedications: input.otherMedications ?? [],
          medicalHistory: input.medicalHistory ?? [],
          labTests: input.labTests ?? [],

          // Consent & Meta
          agreedToTerms: input.agreedToTerms,
          reporterType: input.reporterType,
          status: input.status ?? "pending",
        })
        .returning();

      return { success: true, data: row };
    }),

  // ─── GET ALL ───────────────────────────────────────────────────────────────
  getAll: publicProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
          reporterType: z.string().optional(),
          limit: z.number().min(1).max(200).optional().default(50),
          offset: z.number().min(0).optional().default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(patients)
        .orderBy(desc(patients.createdAt))
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);

      return { success: true, data: rows, count: rows.length };
    }),

  // ─── GET BY ID ─────────────────────────────────────────────────────────────
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const [row] = await db
        .select()
        .from(patients)
        .where(eq(patients.id, input.id));

      if (!row) {
        throw new Error(`Patient with id ${input.id} not found`);
      }

      return { success: true, data: row };
    }),

  // ─── UPDATE ────────────────────────────────────────────────────────────────
  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: updatePatientSchema,
      })
    )
    .mutation(async ({ input }) => {
      const [row] = await db
        .update(patients)
        .set({
          ...{ ...input.data, ageValue: input.data.ageValue != null ? Number(input.data.ageValue) : undefined },
          updatedAt: new Date(),
        })
        .where(eq(patients.id, input.id))
        .returning();

      if (!row) {
        throw new Error(`Patient with id ${input.id} not found`);
      }

      return { success: true, data: row };
    }),

  // ─── DELETE ────────────────────────────────────────────────────────────────
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .delete(patients)
        .where(eq(patients.id, input.id))
        .returning();

      if (!row) {
        throw new Error(`Patient with id ${input.id} not found`);
      }

      return { success: true, deletedId: row.id };
    }),
});
