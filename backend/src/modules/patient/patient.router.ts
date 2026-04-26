import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, publicProcedure } from '../../trpc/core/init.js';
import { rateLimitedProcedure } from '../../trpc/core/procedures.js';
import { db } from '../../db/core/index.js';
import { patientReports } from '../../db/core/schema.js';
import { createPatientSchema, updatePatientSchema } from "./patient.validation.js";
import { createPatientReport } from "./patient.service.js";
import { verifyRecaptcha } from "../../utils/services/recaptcha.service.js";

export const patientRouter = router({
  // ─── CREATE ────────────────────────────────────────────────────────────────
  create: rateLimitedProcedure
    .input(createPatientSchema)
    .mutation(async ({ input }) => {
      // Verify reCAPTCHA token if present in input
      if (input.captchaToken) {
        await verifyRecaptcha(input.captchaToken);
      } else if (process.env.RECAPTCHA_SECRET_KEY && process.env.RECAPTCHA_SECRET_KEY !== 'paste_your_secret_key_here') {
        // If secret key is configured but no token provided, reject
        throw new Error("reCAPTCHA token is required");
      }

      const row = await createPatientReport(input);
      return { success: true, data: row };
    }),

  // ─── GET ALL ───────────────────────────────────────────────────────────────
  getAll: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        reporterType: z.string().optional(),
        limit: z.number().min(1).max(200).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(patientReports)
        .orderBy(desc(patientReports.createdAt))
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
        .from(patientReports)
        .where(eq(patientReports.id, input.id));

      if (!row) throw new Error(`Patient with id ${input.id} not found`);
      return { success: true, data: row };
    }),

  // ─── UPDATE ────────────────────────────────────────────────────────────────
  update: publicProcedure
    .input(z.object({ id: z.string().uuid(), data: updatePatientSchema }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .update(patientReports)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(patientReports.id, input.id))
        .returning();

      if (!row) throw new Error(`Patient with id ${input.id} not found`);
      return { success: true, data: row };
    }),

  // ─── DELETE ────────────────────────────────────────────────────────────────
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .delete(patientReports)
        .where(eq(patientReports.id, input.id))
        .returning();

      if (!row) throw new Error(`Patient with id ${input.id} not found`);
      return { success: true, deletedId: row.id };
    }),
});
