import { z } from "zod";
import { sql, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  viewerProcedure,
  adminProcedure,
} from "../../trpc/procedures.js";
import { db } from "../../db/index.js";
import {
  patientReports,
  hcpReports,
  familyReports,
  notifications,
  admins,
} from "../../db/schema.js";
import { systemSettings } from "../../db/admin/settings.schema.js";
import { auditLogs } from "../../db/audit/audit.schema.js";
import {
  determineUpdateNotification,
  shouldCreateNotification,
} from "../../utils/notification-helper.js";

export const getAllReports = viewerProcedure.query(async () => {
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
        products,
        other_medications as "otherMedications",
        medical_history as "medicalHistory",
        lab_tests as "labTests",
        attachments,
        taking_other_meds as "takingOtherMeds",
        has_relevant_history as "hasRelevantHistory",
        lab_tests_performed as "labTestsPerformed"
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
        products,
        other_medications as "otherMedications",
        medical_history as "medicalHistory",
        lab_tests as "labTests",
        attachments,
        taking_other_meds as "takingOtherMeds",
        has_relevant_history as "hasRelevantHistory",
        lab_tests_performed as "labTestsPerformed"
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
        products,
        other_medications as "otherMedications",
        medical_history as "medicalHistory",
        lab_tests as "labTests",
        attachments,
        taking_other_meds as "takingOtherMeds",
        has_relevant_history as "hasRelevantHistory",
        lab_tests_performed as "labTestsPerformed"
      FROM family_reports
      ORDER BY "createdAt" DESC
    `);

  const reportIds = res.rows.map((r: any) => r.id);
  let audits: any[] = [];

  if (reportIds.length > 0) {
    const allAudits = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entity, "report"));
    audits = allAudits;
  }

  const mapped = res.rows.map((row: any) => {
    const patient = row.patientDetails || {};
    const symptomsArr = Array.isArray(row.symptoms)
      ? row.symptoms
      : row.symptoms
        ? [row.symptoms]
        : [];
    const primarySymptom = symptomsArr[0] || {};
    const products = row.products || [];
    const primaryProduct = products[0] || {};

    const reportAudits = audits
      .filter((a) => a.entity === "report" && String(a.entityId) === String(row.id))
      .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime())
      .map((a) => {
        let field: string | undefined;
        let from: string | undefined;
        let to: string | undefined;

        const oldVal = a.oldValue;
        const newVal = a.newValue;

        if (
          oldVal &&
          typeof oldVal === "object" &&
          !Array.isArray(oldVal)
        ) {
          const keys = Object.keys(oldVal);
          if (keys.length === 1) {
            field = keys[0];
            const key = field;
            from =
              oldVal[key] === null || oldVal[key] === undefined
                ? "None"
                : String(oldVal[key]);

            if (
              newVal &&
              typeof newVal === "object" &&
              !Array.isArray(newVal)
            ) {
              const nv = (newVal as any)[key];
              to =
                nv === null || nv === undefined ? "None" : String(nv);
            }
          }
        }

        // Fallback to raw JSON if we couldn't infer a single field
        if (!field) {
          from = oldVal ? JSON.stringify(oldVal) : undefined;
          to = newVal ? JSON.stringify(newVal) : undefined;
        }

        return {
          action: a.action,
          by: a.changedBy,
          at: new Date(a.changedAt).toLocaleString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            month: "short",
            day: "numeric",
          }),
          field,
          from,
          to,
        };
      });

    const reporter = row.reporterDetails || row.hcpDetails || {};
    const reporterFullName = [reporter.firstName, reporter.lastName]
      .filter(Boolean)
      .join(" ");

    const reporterName =
      reporterFullName || patient.name || patient.initials || "Anonymous";

    return {
      id: row.referenceId || row.id,
      originalId: row.id,
      drug: primaryProduct.productName || "Unknown",
      batch: primaryProduct.batches?.[0]?.batchNumber || "Unknown",
      reporter: reporterName,
      reporterType: row.reporterType,
      status:
        row.severity === "urgent" &&
        row.status !== "closed" &&
        row.status !== "approved"
          ? "Urgent"
          : row.status === "new"
            ? "Submitted"
            : row.status === "under_review"
              ? "In Review"
              : row.status === "approved"
                ? "Approved"
                : "Closed",
      severity:
        row.severity === "urgent"
          ? "Critical"
          : row.severity === "warning"
            ? "High"
            : "Low",
      submitted: new Date(row.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      adminNotes: row.adminNotes || null,
      description:
        row.adminNotes ||
        row.additionalDetails ||
        (primarySymptom.name
          ? `Symptom: ${primarySymptom.name}`
          : "No details provided."),
      outcome:
        primarySymptom.outcome && primarySymptom.outcome !== ""
          ? primarySymptom.outcome
          : "Not Provided",
      audit: reportAudits,
      fullDetails: {
        patientDetails: row.patientDetails || null,
        hcpDetails: row.hcpDetails || null,
        reporterDetails: row.reporterDetails || null,
        symptoms: row.symptoms || null,
        products: row.products || null,
        medicalHistory: {
          hasHistory: row.hasRelevantHistory || null,
          details: row.medicalHistory || null,
        },
        medications: {
          takingOtherMeds: row.takingOtherMeds || null,
          details: row.otherMedications || null,
        },
        labTests: {
          performed: row.labTestsPerformed || null,
          details: row.labTests || null,
        },
        attachments: row.attachments || null,
        additionalDetails: row.additionalDetails || null,
      },
    };
  });

  return mapped;
});

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

    const [settings] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.id, 1));

    const [newRecord] = (await db
      .update(tableToUpdate)
      .set({
        ...(updates as any),
        lastUpdatedAt: new Date(),
      })
      .where(eq(tableToUpdate.id, reportId))
      .returning()) as any[];

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
  });

export const getDashboardStats = viewerProcedure.query(async () => {
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
});

export const getUrgentReports = viewerProcedure.query(async () => {
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
    const symptomsArr = Array.isArray(row.symptoms)
      ? row.symptoms
      : row.symptoms
        ? [row.symptoms]
        : [];
    const primarySymptom = symptomsArr[0] || {};

    return {
      id: row.referenceId || row.id.substring(0, 8),
      title:
        row.additionalDetails ||
        (primarySymptom.name
          ? `Symptom: ${primarySymptom.name}`
          : "Urgent Case"),
      severity: row.severity === "urgent" ? "Critical" : "High",
      due: "Today",
    };
  });
});

export const getStatusDistribution = viewerProcedure.query(async () => {
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
    closed: "Closed",
  };

  return res.rows.map((row: any) => ({
    name: statusMap[row.status] || row.status,
    value: Number(row.value),
  }));
});

export const getMonthlyVolume = viewerProcedure.query(async () => {
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
    month: new Date(row.month).toLocaleDateString("en-US", {
      month: "short",
    }),
    Patient: Number(row.patient),
    HCP: Number(row.hcp),
    Family: Number(row.family),
  }));
});

