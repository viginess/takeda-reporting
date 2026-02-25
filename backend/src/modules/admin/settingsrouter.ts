import { z } from "zod";
import { sql, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { superAdminProcedure, viewerProcedure } from "../../trpc/procedures.js";
import { db } from "../../db/index.js";
import { admins, notifications } from "../../db/schema.js";
import { systemSettings } from "../../db/admin/settings.schema.js";
import { auditLogs } from "../../db/audit/audit.schema.js";
import { runArchiver } from "../../jobs/archiver.js";

export const getSystemSettings = viewerProcedure.query(async () => {
  let [settings] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.id, 1));

  if (!settings) {
    [settings] = await db
      .insert(systemSettings)
      .values({ id: 1 })
      .returning();
  }

  return settings;
});

export const updateSystemSettings = superAdminProcedure
  .input(
    z.object({
      defaultLanguage: z.string().min(1).optional(),
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
          adminEmail: z.string().email(),
          timezone: z.string(),
          retention: z.string(),
          maintenanceMode: z.boolean(),
          twoFA: z.boolean(),
          sessionTimeout: z.string(),
          maxLoginAttempts: z.string(),
          passwordExpiry: z.string(),
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

        const [newSettings] = await tx
          .update(systemSettings)
          .set({
            ...input,
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

