import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, publicProcedure } from "../../trpc/init.js";
import { rateLimitedProcedure } from "../../trpc/procedures.js";
import { db } from "../../db/index.js";
import { patientReports, notifications } from "../../db/schema.js";
import { createPatientSchema, updatePatientSchema } from "./patient.validation.js";
import { determineNotificationData, shouldCreateNotification } from "../../utils/notification-helper.js";

import { assertNoMaintenance } from "../../utils/config-helper.js";
import { systemSettings } from "../../db/admin/settings.schema.js";

export const patientRouter = router({
  // ─── CREATE ────────────────────────────────────────────────────────────────
  create: rateLimitedProcedure
    .input(createPatientSchema)
    .mutation(async ({ input }) => {
      await assertNoMaintenance();
      const [row] = await db
        .insert(patientReports)
        .values({
          // ── Step 1: Product ────────────────────────────
          referenceId: `REP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          products: input.products ?? [],

          // ── Step 2: Event ──────────────────────────────
          symptoms: input.symptoms ?? [],

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
          severity: determineNotificationData(input, "Patient", "TEMP").type as any,
        })
        .returning();

      const notifData = determineNotificationData(input, "Patient", row.referenceId || row.id);
      
      const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
      
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
