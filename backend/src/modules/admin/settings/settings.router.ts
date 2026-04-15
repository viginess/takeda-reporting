import { z } from "zod";
import { sql, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { superAdminProcedure, viewerProcedure } from '../../../trpc/core/procedures.js';
import { db } from '../../../db/core/index.js';
import { admins, notifications } from '../../../db/core/schema.js';
import { systemSettings } from "../../../db/admin/settings.schema.js";
import { auditLogs } from "../../../db/audit/audit.schema.js";
import { runArchiver } from "../../../jobs/archiver.js";

export const getSystemSettings = viewerProcedure.query(async () => {
  let [settings] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.id, 1));

  if (!settings) {
    // Populate initial record with environment variables if available
    const initialClinicalConfig = {
      smtpHost: process.env.SMTP_HOST || "",
      smtpPort: process.env.SMTP_PORT || "587",
      smtpUser: process.env.SMTP_USER || "",
      smtpPass: process.env.SMTP_PASS || "",
      smtpFrom: process.env.SMTP_FROM || "info@viginess.com",
      
      // Other defaults
      timezone: "UTC+05:30 (IST)",
      retention: "24 months",
      sessionTimeout: "60 min",
      maxLoginAttempts: "5",
      passwordExpiry: "90 days",
      senderId: "CLINSOLUTION-DEFAULT",
      receiverId: "EVHUMAN",
      meddraVersion: "29.1",
      lockoutCooldown: "30 min",
    };

    [settings] = await db
      .insert(systemSettings)
      .values({ 
        id: 1,
        clinicalConfig: initialClinicalConfig as any
      })
      .returning();
  }

  return settings;
});

export const updateSystemSettings = superAdminProcedure
  .input(
    z.object({
      notificationThresholds: z
        .object({
          urgentAlerts: z.boolean(),
          alertThreshold: z.string(),
          notifyOnApproval: z.boolean(),
          emailDigest: z.boolean(),
          digestFrequency: z.string(),
          smsAlerts: z.boolean(),
        })
        .optional(),
      clinicalConfig: z
        .object({
          retention: z.string().optional(),

          twoFA: z.boolean().optional(),
          sessionTimeout: z.string(),
          maxLoginAttempts: z.string(),
          passwordExpiry: z.string(),
          senderId: z.string().optional(),
          receiverId: z.string().optional(),
          meddraVersion: z.string().optional(),
          lockoutCooldown: z.string().optional(),

          smtpHost: z.string().optional(),
          smtpPort: z.string().optional(),
          smtpUser: z.string().optional(),
          smtpPass: z.string().optional(),
          smtpFrom: z.string().optional(),
        })
        .optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const adminId = ctx.user?.id || "Admin";

    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.id, adminId));

    const adminName =
      admin?.firstName && admin?.lastName
        ? `${admin.firstName} ${admin.lastName} (${admin.email})`
        : admin?.email || adminId;

    return await db.transaction(async (tx) => {
      try {
        const [oldSettings] = await tx
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.id, 1));
          
        const updatePayload = {
          ...input,
          clinicalConfig: input.clinicalConfig ? {
            ...input.clinicalConfig,
            senderId: input.clinicalConfig.senderId || oldSettings.clinicalConfig.senderId,
            receiverId: input.clinicalConfig.receiverId || oldSettings.clinicalConfig.receiverId,
            meddraVersion: input.clinicalConfig.meddraVersion || oldSettings.clinicalConfig.meddraVersion || "29.1",
            lockoutCooldown: input.clinicalConfig.lockoutCooldown || oldSettings.clinicalConfig.lockoutCooldown || "30 min",
          } as any : undefined,
        };

        const [newSettings] = await tx
          .update(systemSettings)
          .set({
            ...updatePayload,
            updatedAt: new Date(),
            updatedBy: adminId,
          })
          .where(eq(systemSettings.id, 1))
          .returning();

        await tx.insert(auditLogs).values({
          entity: "system_settings",
          entityId: "1",
          changedBy: adminName,
          action: "UPDATE_SETTINGS",
          oldValue: oldSettings,
          newValue: newSettings,
        });

        await tx.insert(notifications).values({
          type: "system",
          title: "System Settings Updated",
          desc: `The system configuration was modified by ${adminName}.`,
          time: "Just now",
          date: "Today",
          classificationReason: "System settings modification",
        });

        return { success: true, data: newSettings };
      } catch (err: any) {
        console.error("Error in updateSystemSettings:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to update system settings",
        });
      }
    });
  });

export const getSettingsAuditLogs = superAdminProcedure.query(
  async () => {
    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entity, "system_settings"))
      .orderBy(sql`${auditLogs.changedAt} DESC`);

    return logs;
  },
);

export const runManualArchiving = superAdminProcedure.mutation(
  async () => {
    await runArchiver();

    return { success: true };
  },
);

