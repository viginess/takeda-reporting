import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  adminProcedure,
} from '../../../trpc/core/procedures.js';
import { db } from '../../../db/core/index.js';
import {
  patientReports,
  hcpReports,
  familyReports,
  notifications,
  admins,
} from '../../../db/core/schema.js';
import { systemSettings } from "../../../db/admin/settings.schema.js";
import { auditLogs } from "../../../db/audit/audit.schema.js";
import {
  determineUpdateNotification,
  shouldCreateNotification,
} from "../../../utils/common/notification-helper.js";
import { generateE2BR3 } from "../../e2b/core/generator.js";
import { validateE2BR3 } from "../../e2b/validation/validator.js";

export const updateReport = adminProcedure
  .input(
    z.object({
      reportId: z.string().uuid(),
      reporterType: z.enum(["Patient", "HCP", "Family"]),
      updates: z.object({
        status: z
          .enum(["new", "under_review", "approved", "closed"])
          .optional(),
        severity: z.enum(["info", "warning", "urgent"]).optional(),
        adminNotes: z.string().optional(),
        symptoms: z.any().optional(), 
        patientDetails: z.any().optional(),
        hcpDetails: z.any().optional(),
        reporterDetails: z.any().optional(),
        products: z.any().optional(),
        medicalHistory: z.any().optional(),
        labTests: z.any().optional(),
        additionalDetails: z.any().optional(),
      }),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { reportId, reporterType, updates } = input;
    const adminId = ctx.user?.id || "Admin";

    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.id, adminId));

    const adminName =
      admin?.firstName && admin?.lastName
        ? `${admin.firstName} ${admin.lastName} (${admin.email})`
        : admin?.email || adminId;

    let tableToUpdate: any;

    if (reporterType === "Patient") tableToUpdate = patientReports;
    else if (reporterType === "HCP") tableToUpdate = hcpReports;
    else if (reporterType === "Family") tableToUpdate = familyReports;
    else throw new Error("Invalid reporterType");

    const [oldRecord] = await db
      .select()
      .from(tableToUpdate)
      .where(eq(tableToUpdate.id, reportId));

    if (!oldRecord) throw new Error("Report not found");

    const [sysSettings] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.id, 1));

    const userRole = ctx.user?.role || "admin";
    if (userRole === "admin") {
      if (oldRecord.status === "closed") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admins cannot edit closed reports.",
        });
      }
      if (updates.status === "closed") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Super Admins can close reports.",
        });
      }
    }

    // Strict XSD Validation for Approval
    if (updates.status === "approved") {
      const senderId = sysSettings?.clinicalConfig?.senderId || 'CLINSOLUTION-DEFAULT';
      const receiverId = sysSettings?.clinicalConfig?.receiverId || 'EVHUMAN';
      
      const meddraVersion = sysSettings?.clinicalConfig?.meddraVersion || "29.0";
      const xml = generateE2BR3(oldRecord as any, { senderId, receiverId, meddraVersion });
      const validation = await validateE2BR3(xml);
      
      if (!validation.valid) {
        const errorList = validation.errors.map((e: any) => e.message || e.rawMessage).join("; ");
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot approve report: E2B XML validation failed. Errors: ${errorList}`,
        });
      }
    }

    const [newRecord] = (await db
      .update(tableToUpdate)
      .set({
        ...(({ symptoms, ...rest } = updates as any) => rest)(),
        ...(updates.symptoms ? { symptoms: updates.symptoms } : {}),
        lastUpdatedAt: new Date(),
      } as any)
      .where(eq(tableToUpdate.id, reportId))
      .returning()) as any[];

    // ─── Automated Sync Flow ────────────────────────────────────────────────
    // 1. Pre-Validate Data
    const { preValidateFormData } = await import("../../e2b/validation/pre-validator.js");
    const preRes = preValidateFormData(newRecord);
    
    let finalIsValid = preRes.valid;
    let finalErrors = preRes.errors;

    // 2. Regenerate & Schema Validate if logic is OK
    if (finalIsValid) {
      const senderId = sysSettings?.clinicalConfig?.senderId || 'CLINSOLUTION-DEFAULT';
      const receiverId = sysSettings?.clinicalConfig?.receiverId || 'EVHUMAN';
      const meddraVersion = sysSettings?.clinicalConfig?.meddraVersion || "29.0";

      try {
        const xml = generateE2BR3(newRecord as any, { 
          senderId, 
          receiverId, 
          meddraVersion,
          reportType: reporterType 
        });
        const validation = await validateE2BR3(xml);
        finalIsValid = validation.valid;
        finalErrors = [...finalErrors, ...validation.errors];
      } catch (genErr: any) {
        finalIsValid = false;
        finalErrors.push({ message: `Generation Error: ${genErr.message}`, type: 'exception' });
      }
    }

    // 3. Persist final status
    await db.update(tableToUpdate)
      .set({ 
        isValid: finalIsValid, 
        validationErrors: finalErrors 
      } as any)
      .where(eq(tableToUpdate.id, reportId));

    const changedKeys = Object.keys(updates).filter(
      (k) => (oldRecord as any)[k] !== (updates as any)[k],
    );

    for (const key of changedKeys) {
      await db.insert(auditLogs).values({
        entity: "report",
        entityId: reportId,
        changedBy: adminName,
        action: `Changed ${key}`,
        oldValue: { [key]: (oldRecord as any)[key] || "None" },
        newValue: { [key]: (updates as any)[key] || "None" },
      });
    }

    const updateNotif = determineUpdateNotification(
      oldRecord,
      updates,
      reporterType,
      newRecord.referenceId || newRecord.id,
    );

    if (updateNotif && shouldCreateNotification(sysSettings, updateNotif)) {
      await db.insert(notifications).values({
        type: updateNotif.type,
        title: updateNotif.title,
        desc: updateNotif.desc.replace("${adminId}", adminName),
        time: updateNotif.time,
        date: updateNotif.date,
        reportId: updateNotif.reportId,
        classificationReason: updateNotif.classificationReason,
      });
    }

    return { success: true, data: { ...newRecord, isValid: finalIsValid, validationErrors: finalErrors } };
  });

export const revalidateAllReports = adminProcedure.mutation(async () => {
    const { preValidateFormData } = await import("../../e2b/validation/pre-validator.js");
    const tables = [patientReports, hcpReports, familyReports];
    for (const table of tables) {
      const all = await db.select().from(table);
      for (const r of all) {
        const res = preValidateFormData(r);
        await db.update(table)
          .set({ 
            isValid: res.valid, 
            validationErrors: res.errors 
          } as any)
          .where(eq(table.id, r.id));
      }
    }
    return { success: true };
  });

export const regenerateReportFiles = adminProcedure
  .input(z.object({
    reportId: z.string().uuid(),
    reporterType: z.enum(["Patient", "HCP", "Family"])
  }))
  .mutation(async ({ input }) => {
    const { reportId } = input;
    const { processE2BWorkflow } = await import("../../e2b/index.js");
    return await processE2BWorkflow(reportId);
  });

