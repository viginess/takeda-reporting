import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, publicProcedure } from '../../trpc/core/init.js';
import { rateLimitedProcedure } from '../../trpc/core/procedures.js';
import { db } from '../../db/core/index.js';
import { hcpReports } from '../../db/core/schema.js';
import { createHcpSchema, updateHcpSchema } from "./hcp.validation.js";
import { createHcpReport } from "./hcp.service.js";
import { verifyRecaptcha } from "../../utils/services/recaptcha.service.js";

export const hcpRouter = router({
  // ─── CREATE ────────────────────────────────────────────────────────────────
  create: rateLimitedProcedure
    .input(createHcpSchema)
    .mutation(async ({ input }) => {
      // Verify reCAPTCHA token if present in input
      if (input.captchaToken) {
        await verifyRecaptcha(input.captchaToken);
      } else if (process.env.RECAPTCHA_SECRET_KEY && process.env.RECAPTCHA_SECRET_KEY !== 'paste_your_secret_key_here') {
        // If secret key is configured but no token provided, reject
        throw new Error("reCAPTCHA token is required");
      }

      const row = await createHcpReport(input);
      return { success: true, data: row };
    }),

  // ─── GET ALL ───────────────────────────────────────────────────────────────
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

  // ─── GET BY ID ─────────────────────────────────────────────────────────────
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

  // ─── UPDATE ────────────────────────────────────────────────────────────────
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

  // ─── DELETE ────────────────────────────────────────────────────────────────
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
