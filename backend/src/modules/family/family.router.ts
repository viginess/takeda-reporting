import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, publicProcedure } from '../../trpc/core/init.js';
import { rateLimitedProcedure } from '../../trpc/core/procedures.js';
import { db } from '../../db/core/index.js';
import { familyReports } from '../../db/core/schema.js';
import { updateFamilySchema, createFamilySchema } from "./family.validation.js";
import { createFamilyReport } from "./family.service.js";

export const familyRouter = router({
  // ─── CREATE ────────────────────────────────────────────────────────────────
  create: rateLimitedProcedure
    .input(createFamilySchema)
    .mutation(async ({ input }) => {
      const row = await createFamilyReport(input);
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
        .from(familyReports)
        .orderBy(desc(familyReports.createdAt))
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
        .from(familyReports)
        .where(eq(familyReports.id, input.id));

      if (!row) throw new Error(`Family report ${input.id} not found`);
      return { success: true, data: row };
    }),

  // ─── UPDATE ────────────────────────────────────────────────────────────────
  update: publicProcedure
    .input(z.object({ id: z.string().uuid(), data: updateFamilySchema }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .update(familyReports)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(familyReports.id, input.id))
        .returning();

      if (!row) throw new Error(`Family report ${input.id} not found`);
      return { success: true, data: row };
    }),

  // ─── DELETE ────────────────────────────────────────────────────────────────
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .delete(familyReports)
        .where(eq(familyReports.id, input.id))
        .returning();

      if (!row) throw new Error(`Family report ${input.id} not found`);
      return { success: true, deletedId: row.id };
    }),
});
