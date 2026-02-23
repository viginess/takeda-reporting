import { z } from "zod";
import { sql, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, mfaProtectedProcedure } from "../../trpc/trpc.js";
import { db } from "../../db/index.js";
import { 
  patientReports, 
  hcpReports, 
  familyReports, 
  notifications, 
  admins
} from "../../db/schema.js";
import { systemSettings } from "../../db/admin/settings.schema.js";
import { auditLogs } from "../../db/audit.schema.js";
import { determineUpdateNotification, shouldCreateNotification } from "../../utils/notification-helper.js";
import { runArchiver } from "../../jobs/archiver.js";
export const adminRouter = router({
  syncProfile: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      try {
        const [row] = await db
          .insert(admins)
          .values({
            id: input.id,
            email: input.email,
            lastLoginAt: new Date(),
            failedLoginAttempts: 0,
            lockedAt: null,
          })
          .onConflictDoUpdate({
            target: admins.id,
            set: {
              lastLoginAt: new Date(),
              failedLoginAttempts: 0,
              lockedAt: null,
              updatedAt: new Date(),
            }
          })
          .returning();
        return { success: true, data: row };
      } catch (err: any) {
        console.error("Error in syncProfile:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to sync admin profile",
        });
      }
    }),
  getAllReports: mfaProtectedProcedure.query(async () => {
    // 1. Fetch unified reports sorted natively by DB
    const res = await db.execute(sql`
      SELECT 
        id, 
        reference_id as "referenceId",
        'Patient' as "reporterType", 
        status, 
        severity, 
        admin_notes as "adminNotes", 
        created_at as "createdAt", 
        patient_details as "patientDetails", 
        hcp_details as "hcpDetails",
        NULL as "reporterDetails",
        symptoms,
        additional_details as "additionalDetails",
        products 
      FROM patient_reports
      UNION ALL
      SELECT 
        id, 
        reference_id as "referenceId",
        'HCP' as "reporterType", 
        status, 
        severity, 
        admin_notes as "adminNotes", 
        created_at as "createdAt", 
        patient_details as "patientDetails", 
        NULL as "hcpDetails",
        reporter_details as "reporterDetails",
        symptoms,
        additional_details as "additionalDetails",
        products 
      FROM hcp_reports
      UNION ALL
      SELECT 
        id, 
        reference_id as "referenceId",
        'Family' as "reporterType", 
        status, 
        severity, 
        admin_notes as "adminNotes", 
        created_at as "createdAt", 
        patient_details as "patientDetails", 
        hcp_details as "hcpDetails",
        NULL as "reporterDetails",
        symptoms,
        additional_details as "additionalDetails",
        products 
      FROM family_reports
      ORDER BY "createdAt" DESC
    `);
    // 2. Fetch all audit logs for these reports
    const reportIds = res.rows.map((r: any) => r.id);
    let audits: any[] = [];
    if (reportIds.length > 0) {
      const allAudits = await db.select().from(auditLogs);
      audits = allAudits;
    }
    // 3. Map to frontend format
    const mapped = res.rows.map((row: any) => {
      const patient = row.patientDetails || {};
      const symptomsArr = Array.isArray(row.symptoms) ? row.symptoms : (row.symptoms ? [row.symptoms] : []);
      const primarySymptom = symptomsArr[0] || {};
      const products = row.products || [];
      const primaryProduct = products[0] || {};
      const reportAudits = audits
        .filter(a => a.entity === "report" && a.entityId === row.id)
        .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime())
        .map(a => ({
          action: a.action,
          by: a.changedBy,
          at: new Date(a.changedAt).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" }),
          from: a.oldValue ? JSON.stringify(a.oldValue) : undefined,
          to: a.newValue ? JSON.stringify(a.newValue) : undefined,
        }));
      const reporter = row.reporterDetails || row.hcpDetails || {};
      const reporterFullName = [reporter.firstName, reporter.lastName].filter(Boolean).join(" ");
      let reporterName = reporterFullName || patient.name || patient.initials || "Anonymous";
      return {
        id: row.referenceId || row.id.substring(0, 8),
        originalId: row.id,
        drug: primaryProduct.productName || "Unknown",
        batch: primaryProduct.batches?.[0]?.batchNumber || "Unknown",
        reporter: reporterName,
        reporterType: row.reporterType,
        status: row.severity === "urgent" && row.status !== "closed" && row.status !== "approved" 
          ? "Urgent" 
          : row.status === "new" ? "Submitted" : row.status === "under_review" ? "In Review" : row.status === "approved" ? "Approved" : "Closed",
        severity: row.severity === "urgent" ? "Critical" : row.severity === "warning" ? "High" : "Low",
        submitted: new Date(row.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        description: row.adminNotes || row.additionalDetails || (primarySymptom.name ? `Symptom: ${primarySymptom.name}` : "No details provided."),
        outcome: primarySymptom.outcome && primarySymptom.outcome !== "" ? primarySymptom.outcome : "Not Provided",
        audit: reportAudits,
      };
    });
    return mapped;
  }),
  updateReport: mfaProtectedProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      reporterType: z.enum(["Patient", "HCP", "Family"]),
      updates: z.object({
        status: z.enum(["new", "under_review", "approved", "closed"]).optional(),
        severity: z.enum(["info", "warning", "urgent"]).optional(),
        adminNotes: z.string().optional(),
      })
    }))
    .mutation(async ({ input, ctx }) => {
      const { reportId, reporterType, updates } = input;
      const adminId = ctx.user?.id || "Admin";
      const [admin] = await db.select().from(admins).where(eq(admins.id, adminId));
      const adminName = admin?.firstName && admin?.lastName 
        ? `${admin.firstName} ${admin.lastName} (${admin.email})`
        : admin?.email || adminId;
      let tableToUpdate: any;
      if (reporterType === "Patient") tableToUpdate = patientReports;
      else if (reporterType === "HCP") tableToUpdate = hcpReports;
      else if (reporterType === "Family") tableToUpdate = familyReports;
      else throw new Error("Invalid reporterType");
      const [oldRecord] = await db.select().from(tableToUpdate).where(eq(tableToUpdate.id, reportId));
      if (!oldRecord) throw new Error("Report not found");
      const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
      const [newRecord] = (await db
        .update(tableToUpdate)
        .set({
          ...updates as any,
          lastUpdatedAt: new Date(),
        })
        .where(eq(tableToUpdate.id, reportId))
        .returning()) as any[];
      const clinical = settings?.clinicalConfig || {};
      const changedKeys = Object.keys(updates).filter((k) => (oldRecord as any)[k] !== (updates as any)[k]);
      for (const key of changedKeys) {
        await db.insert(auditLogs).values({
          entity: "report",
          entityId: reportId,
          changedBy: adminId,
          action: `Changed ${key}`,
          oldValue: { [key]: (oldRecord as any)[key] || "None" },
          newValue: { [key]: (updates as any)[key] || "None" },
        });
      }
      const updateNotif = determineUpdateNotification(oldRecord, updates, reporterType, newRecord.referenceId || newRecord.id);
      if (updateNotif && shouldCreateNotification(settings, updateNotif)) {
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
      return { success: true, data: newRecord };
    }),
  getDashboardStats: protectedProcedure
    .query(async () => {
      const res = await db.execute(sql`
        WITH all_reports AS (
          SELECT status, severity, created_at FROM patient_reports
          UNION ALL
          SELECT status, severity, created_at FROM hcp_reports
          UNION ALL
          SELECT status, severity, created_at FROM family_reports
        )
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'new' OR status = 'under_review') as pending,
          COUNT(*) FILTER (WHERE status = 'approved') as approved,
          COUNT(*) FILTER (WHERE severity = 'urgent' AND status != 'closed') as urgent
        FROM all_reports
      `);
      const stats = res.rows[0] as any;
      return {
        total: Number(stats.total),
        pending: Number(stats.pending),
        approved: Number(stats.approved),
        urgent: Number(stats.urgent),
      };
    }),
  getUrgentReports: protectedProcedure
    .query(async () => {
      const res = await db.execute(sql`
        SELECT 
          id, 
          reference_id as "referenceId",
          status, 
          severity, 
          created_at as "createdAt",
          patient_details as "patientDetails",
          hcp_details as "hcpDetails",
          NULL as "reporterDetails",
          additional_details as "additionalDetails",
          symptoms
        FROM patient_reports WHERE severity = 'urgent' AND status != 'closed'
        UNION ALL
        SELECT 
          id, 
          reference_id as "referenceId",
          status, 
          severity, 
          created_at as "createdAt",
          patient_details as "patientDetails",
          NULL as "hcpDetails",
          reporter_details as "reporterDetails",
          additional_details as "additionalDetails",
          symptoms
        FROM hcp_reports WHERE severity = 'urgent' AND status != 'closed'
        UNION ALL
        SELECT 
          id, 
          reference_id as "referenceId",
          status, 
          severity, 
          created_at as "createdAt",
          patient_details as "patientDetails",
          hcp_details as "hcpDetails",
          NULL as "reporterDetails",
          additional_details as "additionalDetails",
          symptoms
        FROM family_reports WHERE severity = 'urgent' AND status != 'closed'
        ORDER BY "createdAt" DESC
        LIMIT 5
      `);
      return res.rows.map((row: any) => {
        const symptomsArr = Array.isArray(row.symptoms) ? row.symptoms : (row.symptoms ? [row.symptoms] : []);
        const primarySymptom = symptomsArr[0] || {};
        return {
          id: row.referenceId || row.id.substring(0, 8),
          title: row.additionalDetails || (primarySymptom.name ? `Symptom: ${primarySymptom.name}` : "Urgent Case"),
          severity: row.severity === "urgent" ? "Critical" : "High",
          due: "Today",
        };
      });
    }),
  getStatusDistribution: protectedProcedure
    .query(async () => {
      const res = await db.execute(sql`
        WITH all_reports AS (
          SELECT status FROM patient_reports
          UNION ALL
          SELECT status FROM hcp_reports
          UNION ALL
          SELECT status FROM family_reports
        )
        SELECT status, COUNT(*) as value FROM all_reports GROUP BY status
      `);
      const statusMap: Record<string, string> = {
        new: "Submitted",
        under_review: "In Review",
        approved: "Approved",
        closed: "Closed"
      };
      return res.rows.map((row: any) => ({
        name: statusMap[row.status] || row.status,
        value: Number(row.value)
      }));
    }),
  getMonthlyVolume: protectedProcedure
    .query(async () => {
      const res = await db.execute(sql`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', current_date) - interval '5 months',
            date_trunc('month', current_date),
            interval '1 month'
          )::date as month
        ),
        all_reports AS (
          SELECT 'Patient' as type, date_trunc('month', created_at)::date as month FROM patient_reports
          UNION ALL
          SELECT 'HCP' as type, date_trunc('month', created_at)::date as month FROM hcp_reports
          UNION ALL
          SELECT 'Family' as type, date_trunc('month', created_at)::date as month FROM family_reports
        )
        SELECT 
          m.month,
          COUNT(r.month) FILTER (WHERE r.type = 'Patient') as patient,
          COUNT(r.month) FILTER (WHERE r.type = 'HCP') as hcp,
          COUNT(r.month) FILTER (WHERE r.type = 'Family') as family
        FROM months m
        LEFT JOIN all_reports r ON m.month = r.month
        GROUP BY m.month
        ORDER BY m.month ASC
      `);
      return res.rows.map((row: any) => ({
        month: new Date(row.month).toLocaleDateString("en-US", { month: "short" }),
        Patient: Number(row.patient),
        HCP: Number(row.hcp),
        Family: Number(row.family)
      }));
    }),
  getSystemSettings: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin access required" });
      }
      let [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
      if (!settings) {
        [settings] = await db.insert(systemSettings).values({ id: 1 }).returning();
      }
      return settings;
    }),
  updateSystemSettings: mfaProtectedProcedure
    .input(z.object({
      defaultLanguage: z.string().min(1).optional(),
      notificationThresholds: z.object({
        urgentAlerts: z.boolean(),
        alertThreshold: z.string(),
        notifyOnApproval: z.boolean(),
        emailDigest: z.boolean(),
        digestFrequency: z.string(),
        smsAlerts: z.boolean(),
      }).optional(),
      clinicalConfig: z.object({
        adminEmail: z.string().email(),
        timezone: z.string(),
        retention: z.string(),
        maintenanceMode: z.boolean(),
        twoFA: z.boolean(),
        sessionTimeout: z.string(),
        maxLoginAttempts: z.string(),
        passwordExpiry: z.string(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin access required" });
      }
      const adminId = ctx.user?.id || "Admin";
      const [admin] = await db.select().from(admins).where(eq(admins.id, adminId));
      const adminName = admin?.firstName && admin?.lastName 
        ? `${admin.firstName} ${admin.lastName} (${admin.email})`
        : admin?.email || adminId;
      return await db.transaction(async (tx) => {
        try {
          const [oldSettings] = await tx.select().from(systemSettings).where(eq(systemSettings.id, 1));
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
            changedBy: adminId,
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
    }),
  updateAdminProfile: mfaProtectedProcedure
    .input(z.object({
      firstName: z.string(),
      lastName: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const adminId = ctx.user.id;
      const [row] = await db
        .update(admins)
        .set({
          firstName: input.firstName,
          lastName: input.lastName,
          updatedAt: new Date(),
        })
        .where(eq(admins.id, adminId))
        .returning();
      return { success: true, data: row };
    }),
  getSettingsAuditLogs: mfaProtectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin access required" });
      }
      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.entity, "system_settings"))
        .orderBy(sql`${auditLogs.changedAt} DESC`);
      return logs;
    }),
  getAdmins: mfaProtectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin access required" });
      }
      return await db.select().from(admins).orderBy(admins.email);
    }),
  runManualArchiving: mfaProtectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin access required" });
      }
      await runArchiver();
      return { success: true };
    }),
});
