import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, publicProcedure, rateLimitedProcedure } from "../../trpc/trpc.js";
import { db } from "../../db/index.js";
import { familyReports, notifications } from "../../db/schema.js";
import { createFamilySchema, updateFamilySchema } from "./family.validation.js";
import { determineNotificationData } from "../../utils/notification-helper.js";

export const familyRouter = router({
  create: rateLimitedProcedure
    .input(createFamilySchema)
    .mutation(async ({ input }) => {
      const [row] = await db
        .insert(familyReports)
        .values({
          referenceId: `REP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          products: input.products ?? [],
          symptoms: input.symptoms ?? [],
          patientDetails: input.patientDetails ?? {},
          hcpDetails: input.hcpDetails ?? {},
          takingOtherMeds: input.takingOtherMeds,
          otherMedications: input.otherMedications ?? [],
          hasRelevantHistory: input.hasRelevantHistory,
          medicalHistory: input.medicalHistory ?? [],
          labTestsPerformed: input.labTestsPerformed,
          labTests: input.labTests ?? [],
          additionalDetails: input.additionalDetails,
          attachments: input.attachments ?? [],
          agreedToTerms: input.agreedToTerms,
          status: input.status ?? "new",
        })
        .returning();

      const notifData = determineNotificationData(input, "Family", row.referenceId || row.id);
      
      await db.insert(notifications).values({
        type: notifData.type,
        title: notifData.title,
        desc: notifData.desc,
        time: notifData.time,
        date: notifData.date,
        reportId: notifData.reportId,
        classificationReason: notifData.classificationReason,
      });

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
        .from(familyReports)
        .orderBy(desc(familyReports.createdAt))
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);

      return { success: true, data: rows, count: rows.length };
    }),

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
