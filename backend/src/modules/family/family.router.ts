import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, publicProcedure } from "../../trpc/init.js";
import { rateLimitedProcedure } from "../../trpc/procedures.js";
import { db } from "../../db/index.js";
import { familyReports, notifications } from "../../db/schema.js";
import { systemSettings } from "../../db/admin/settings.schema.js";
import { createFamilySchema, updateFamilySchema } from "./family.validation.js";
import { determineNotificationData, shouldCreateNotification } from "../../utils/notification-helper.js";
import { assertNoMaintenance } from "../../utils/config-helper.js";

export const familyRouter = router({
  create: rateLimitedProcedure
    .input(createFamilySchema)
    .mutation(async ({ input }) => {
      await assertNoMaintenance();
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
          severity: determineNotificationData(input, "Family", "TEMP").type as any,
          meddraVersion: (await db.select().from(systemSettings).where(eq(systemSettings.id, 1)))[0]?.clinicalConfig?.meddraVersion || "29.1",
        })
        .returning();

      const notifData = determineNotificationData(input, "Family", row.referenceId || row.id);
      
      let [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
      if (!settings) {
        settings = { id: 1, notificationThresholds: { urgentAlerts: true, alertThreshold: "All Severities", notifyOnApproval: true, emailDigest: false, digestFrequency: "Daily", smsAlerts: false } } as any;
      }
      
      if (shouldCreateNotification(settings, notifData)) {
        await db.insert(notifications).values({
          type: notifData.type,
          title: notifData.title,
          desc: notifData.desc,
          time: notifData.time,
          date: notifData.date,
          reportId: notifData.reportId,
          classificationReason: notifData.classificationReason,
        });
      }

      // Trigger E2B XML & PDF Workflow
      try {
        const { processE2BWorkflow } = await import("../e2b/index.js");
        await processE2BWorkflow(row.id);

        const { generateSafetyPDF } = await import("../pdf/pdf-generator.js");
        const { storeSafetyPDF } = await import("../pdf/storage.js");
        
        const buffer = await generateSafetyPDF(row);
        const pdfPath = await storeSafetyPDF(row.referenceId || row.id, buffer);
        await db.update(familyReports).set({ pdfUrl: pdfPath }).where(eq(familyReports.id, row.id));
      } catch (workflowErr) {
        console.error("Workflow failure for Family report:", workflowErr);
      }

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
