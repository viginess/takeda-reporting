import { sql, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  viewerProcedure,
} from '../../../trpc/core/procedures.js';
import { db } from '../../../db/core/index.js';
import { archivedReports } from "../../../db/archive/archive.schema.js";
import { auditLogs } from "../../../db/audit/audit.schema.js";
import { companies, companyNotifications } from "../../../db/company/company.schema.js";
import { mapReportRecord } from "./reports.mapper.js";
import { getReportFromArchive } from "../../../jobs/archive-storage.js";

export const getAllReports = viewerProcedure.query(async () => {
  // ... (union select remains unchanged)
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
        lab_tests_performed as "labTestsPerformed",
        xml_url as "xmlUrl",
        pdf_url as "pdfUrl",
        is_valid as "isValid",
        validation_errors as "validationErrors"
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
        lab_tests_performed as "labTestsPerformed",
        xml_url as "xmlUrl",
        pdf_url as "pdfUrl",
        is_valid as "isValid",
        validation_errors as "validationErrors"
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
        lab_tests_performed as "labTestsPerformed",
        xml_url as "xmlUrl",
        pdf_url as "pdfUrl",
        is_valid as "isValid",
        validation_errors as "validationErrors"
      FROM family_reports
      ORDER BY "createdAt" DESC
    `);

  const reportIds = res.rows.map((r: any) => r.id);
  let audits: any[] = [];
  let notifications: any[] = [];

  if (reportIds.length > 0) {
    // Fetch Audits
    audits = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entity, "report"));

    // Fetch Company Notifications
    notifications = await db
      .select({
        id: companyNotifications.id,
        reportId: companyNotifications.reportId,
        status: companyNotifications.status,
        sentAt: companyNotifications.sentAt,
        error: companyNotifications.lastError,
        companyName: companies.name
      })
      .from(companyNotifications)
      .leftJoin(companies, eq(companyNotifications.companyId, companies.id))
      .where(inArray(companyNotifications.reportId, reportIds));
  }

  return res.rows.map((row: any) => mapReportRecord(row, audits, notifications));
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

export const getArchivedReports = viewerProcedure.query(async () => {
  return await db
    .select()
    .from(archivedReports)
    .orderBy(sql`archived_at DESC`);
});

export const getArchivedReportDetails = viewerProcedure
  .input(z.object({ storagePath: z.string() }))
  .query(async ({ input }) => {
    return await getReportFromArchive(input.storagePath);
  });
