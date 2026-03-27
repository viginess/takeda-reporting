import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, publicProcedure } from "../../trpc/init.js";
import { rateLimitedProcedure } from "../../trpc/procedures.js";
import { db } from "../../db/index.js";
import { patientReports, notifications } from "../../db/schema.js";
import { createPatientSchema, updatePatientSchema } from "./patient.validation.js";
import { determineNotificationData, shouldCreateNotification } from "../../utils/notification-helper.js";


import { systemSettings } from "../../db/admin/settings.schema.js";

export const patientRouter = router({
  // ─── CREATE ────────────────────────────────────────────────────────────────
  create: rateLimitedProcedure
    .input(createPatientSchema)
    .mutation(async ({ input }) => {

      const [row] = await db
        .insert(patientReports)
        .values({
          // ── Step 1: Product ────────────────────────────
          referenceId: `REP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          products: input.products ?? [],

          // ── Step 2: Event ──────────────────────────────
          symptoms: (input.symptoms ?? []).map((s: any, idx: number) => ({
            ...s,
            reactionId: s.reactionId || `REAC-${Date.now()}-${idx}`
          })),

          // ── Step 3: Personal & HCP (store as JSONB) ───
          patientDetails: input.patientDetails ?? {},
          hcpDetails: input.hcpDetails ?? {},

          // ── Step 4: Additional ─────────────────────────
          takingOtherMeds: input.takingOtherMeds,
          otherMedications: input.otherMedications ?? [],

          hasRelevantHistory: input.hasRelevantHistory,
          medicalHistory: input.medicalHistory ?? [],

          labTestsPerformed: input.labTestsPerformed,
          labTests: input.labTests ?? [],

          additionalDetails: input.additionalDetails,
          attachments: input.attachments ?? [],

          // ── Step 5: Confirm ────────────────────────────
          agreedToTerms: input.agreedToTerms,
          reporterType: input.reporterType,
          status: input.status ?? "new",
          severity: input.severity || determineNotificationData(input, "Patient", "TEMP").type,
          meddraVersion: (await db.select().from(systemSettings).where(eq(systemSettings.id, 1)))[0]?.clinicalConfig?.meddraVersion || "29.1",
          countryCode: input.countryCode,
          senderTimezoneOffset: input.senderTimezoneOffset,
        })
        .returning();

      const notifData = determineNotificationData(input, "Patient", row.referenceId || row.id);
      
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

      // ── Trigger E2B XML & PDF Workflow ────────────────────────────
      try {
        const { processE2BWorkflow } = await import("../e2b/index.js");
        const e2bResult = await processE2BWorkflow(row.id);

        const { generateSafetyPDF } = await import("../pdf/pdf-generator.js");
        const { storeSafetyPDF } = await import("../pdf/storage.js");
        const { sendAdminNotificationEmail } = await import("../../utils/mailer.js");
        
        const buffer = await generateSafetyPDF(row);
        const pdfPath = await storeSafetyPDF(row.referenceId || row.id, buffer);
        await db.update(patientReports).set({ pdfUrl: pdfPath }).where(eq(patientReports.id, row.id));

        // ── Send Email Notification ──────────────────────────────────
        const recipient = settings?.clinicalConfig?.smtpUser || settings?.clinicalConfig?.smtpFrom || process.env.SMTP_USER;
        if (!recipient) {
          console.warn(`[E2B] No recipient configured for report ${row.referenceId || row.id} — email skipped`);
        } else {
          const refId = row.referenceId || row.id;
          const validationPassed = e2bResult.isValid;
          const validationErrList = (e2bResult.errors || [])
            .map((e: any) => `<li>${e.message || JSON.stringify(e)}</li>`)
            .join('');

          const subject = validationPassed
            ? `New Patient Safety Report: ${refId}`
            : `⚠️ [VALIDATION FAILED] New Patient Safety Report: ${refId}`;

          const validationBanner = validationPassed
            ? `<p style="color:green;"><b>✅ E2B XML Validation: PASSED</b></p>`
            : `<p style="color:red;"><b>⚠️ E2B XML Validation: FAILED</b></p>
               <p>The following issues were detected and must be corrected before regulatory submission:</p>
               <ul style="color:red;">${validationErrList}</ul>`;

          await sendAdminNotificationEmail({
            to: recipient,
            subject,
            html: `
              <p>A new safety report has been submitted by a Patient.</p>
              <p><b>Reference ID:</b> ${refId}</p>
              <p><b>Reporter Type:</b> ${row.reporterType || "Patient"}</p>
              ${validationBanner}
              <p>Please find the attached E2B XML and Safety PDF for your review.</p>
            `,
            attachments: [
              { filename: `${refId}.pdf`, content: buffer },
              { filename: `${refId}.xml`, content: e2bResult.xmlContent || "" }
            ]
          });
        }
      } catch (workflowErr: any) {
        console.error("[E2B] Workflow non-blocking failure:", {
          step: workflowErr?.step || 'unknown',
          message: workflowErr?.message || String(workflowErr)
        });
      }

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
        .update(patientReports)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(patientReports.id, input.id))
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
        .delete(patientReports)
        .where(eq(patientReports.id, input.id))
        .returning();

      if (!row) {
        throw new Error(`Patient with id ${input.id} not found`);
      }

      return { success: true, deletedId: row.id };
    }),
});
