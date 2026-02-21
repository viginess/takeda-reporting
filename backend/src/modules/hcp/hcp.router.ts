import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, publicProcedure, rateLimitedProcedure } from "../../trpc/trpc.js";
import { db } from "../../db/index.js";
import { hcpReports } from "../../db/schema.js";
import { createHcpSchema, updateHcpSchema } from "./hcp.validation.js";

export const hcpRouter = router({
  create: rateLimitedProcedure
    .input(createHcpSchema)
    .mutation(async ({ input }) => {
      const [row] = await db
        .insert(hcpReports)
        .values({
          products: input.products ?? [],
          symptoms: input.symptoms ?? [],
          patientDetails: input.patientDetails ?? {},
          reporterDetails: input.reporterDetails ?? {},
          takingOtherMeds: input.takingOtherMeds,
          otherMedications: input.otherMedications ?? [],
          hasRelevantHistory: input.hasRelevantHistory,
          medicalHistory: input.medicalHistory ?? [],
          labTestsPerformed: input.labTestsPerformed,
          labTests: input.labTests ?? [],
          additionalDetails: input.additionalDetails,
          attachments: input.attachments ?? [],
          agreedToTerms: input.agreedToTerms,
          status: input.status ?? "pending",
        })
        .returning();

      return { success: true, data: row };
    }),

  getAll: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        limit: z.number().min(1).max(200).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(hcpReports)
        .orderBy(desc(hcpReports.createdAt))
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);

      return { success: true, data: rows, count: rows.length };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const [row] = await db
        .select()
        .from(hcpReports)
        .where(eq(hcpReports.id, input.id));

      if (!row) throw new Error(`HCP report ${input.id} not found`);
      return { success: true, data: row };
    }),

  update: publicProcedure
    .input(z.object({ id: z.string().uuid(), data: updateHcpSchema }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .update(hcpReports)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(hcpReports.id, input.id))
        .returning();

      if (!row) throw new Error(`HCP report ${input.id} not found`);
      return { success: true, data: row };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .delete(hcpReports)
        .where(eq(hcpReports.id, input.id))
        .returning();

      if (!row) throw new Error(`HCP report ${input.id} not found`);
      return { success: true, deletedId: row.id };
    }),
});
