import { z } from "zod";
import { sql, eq } from "drizzle-orm";
import { router, protectedProcedure } from "../../trpc/trpc.js";
import { db } from "../../db/index.js";
import { patientReports, hcpReports, familyReports, auditLogs, admins } from "../../db/schema.js";

export const adminRouter = router({
  syncProfile: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .insert(admins)
        .values({
          id: input.id,
          email: input.email,
        })
        .onConflictDoNothing()
        .returning();

      return { success: true, data: row };
    }),

  getAllReports: protectedProcedure.query(async () => {
    // 1. Fetch unified reports sorted natively by DB
    const res = await db.execute(sql`
      SELECT 
        id, 
        reference_id as "referenceId",
        'Patient' as "reporterType", 
        status, 
        severity, 
        assignee, 
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
        assignee, 
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
        assignee, 
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
      // Fetch audits, grouped by reportId in JS below
      const allAudits = await db.select().from(auditLogs); // We could filter by IN (reportIds) if needed
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
        .filter(a => a.reportId === row.id)
        .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime())
        .map(a => ({
          action: a.action,
          by: a.changedBy,
          at: new Date(a.changedAt).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" }),
          from: a.oldValue ? JSON.stringify(a.oldValue) : undefined,
          to: a.newValue ? JSON.stringify(a.newValue) : undefined,
        }));

      // Find the name appropriately depending on if it's HCP, Family or Patient
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
        status: row.status === "new" ? "Submitted" : row.status === "under_review" ? "In Review" : row.status === "approved" ? "Approved" : "Closed",
        severity: row.severity === "urgent" ? "Critical" : row.severity === "warning" ? "High" : "Low",
        submitted: new Date(row.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        assignee: row.assignee || "Unassigned",
        description: row.adminNotes || row.additionalDetails || (primarySymptom.name ? `Symptom: ${primarySymptom.name}` : "No details provided."),
        outcome: primarySymptom.outcome && primarySymptom.outcome !== "" ? primarySymptom.outcome : "Not Provided",
        audit: reportAudits,
      };
    });

    return mapped;
  }),

  updateReport: protectedProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      reporterType: z.enum(["Patient", "HCP", "Family"]),
      updates: z.object({
        status: z.enum(["new", "under_review", "approved", "closed"]).optional(),
        severity: z.enum(["info", "warning", "urgent"]).optional(),
        assignee: z.string().optional(),
        adminNotes: z.string().optional(),
      })
    }))
    .mutation(async ({ input, ctx }) => {
      const { reportId, reporterType, updates } = input;
      const adminId = ctx.user?.id || "Admin";

      let tableToUpdate: any;
      if (reporterType === "Patient") tableToUpdate = patientReports;
      else if (reporterType === "HCP") tableToUpdate = hcpReports;
      else if (reporterType === "Family") tableToUpdate = familyReports;
      else throw new Error("Invalid reporterType");

      // 1. Fetch old record for audit trail
      const [oldRecord] = await db.select().from(tableToUpdate).where(eq(tableToUpdate.id, reportId));
      if (!oldRecord) {
        throw new Error("Report not found");
      }

      // 2. Perform the update
      const [newRecord] = (await db
        .update(tableToUpdate)
        .set({
          ...updates,
          lastUpdatedAt: new Date(),
          ...(updates.assignee && oldRecord.assignee !== updates.assignee ? { assignedAt: new Date() } : {})
        })
        .where(eq(tableToUpdate.id, reportId))
        .returning()) as any[];

      // 3. Create audit log
      const changedKeys = Object.keys(updates).filter((k) => (oldRecord as any)[k] !== (updates as any)[k]);
      for (const key of changedKeys) {
        await db.insert(auditLogs).values({
          reportId: reportId,
          changedBy: adminId,
          action: `Changed ${key}`,
          oldValue: (oldRecord as any)[key] || "None",
          newValue: (updates as any)[key] || "None",
        });
      }

      return { success: true, data: newRecord };
    }),
});
