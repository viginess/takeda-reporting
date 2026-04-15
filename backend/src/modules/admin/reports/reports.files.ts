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
} from '../../../db/core/schema.js';
import { generateSafetyPDF } from "../../pdf/pdf-generator.js";
import { storeSafetyPDF, getSignedPDFUrl } from "../../pdf/storage.js";
import AdmZip from "adm-zip";
import { getSupabaseAdmin } from "../../../utils/services/supabase.js";

export const getReportPDF = adminProcedure
  .input(z.object({ 
    reportId: z.string().uuid(),
    reporterType: z.enum(["Patient", "HCP", "Family"])
  }))
  .mutation(async ({ input }) => {
    const { reportId, reporterType } = input;
    
    let table: any;
    if (reporterType === "Patient") table = patientReports;
    else if (reporterType === "HCP") table = hcpReports;
    else if (reporterType === "Family") table = familyReports;
    else throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid reporter type" });

    const [report] = await db.select().from(table).where(eq(table.id, reportId));
    if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });

    if (report.isValid === false) {
      throw new TRPCError({ 
        code: "FORBIDDEN", 
        message: "PDF download blocked: Report has validation errors. Please fix and regenerate first." 
      });
    }

    // If PDF already exists, return its signed URL
    if (report.pdfUrl) {
      try {
        const url = await getSignedPDFUrl(report.pdfUrl);
        return { success: true, url };
      } catch (e) {
        console.warn("Failed to get signed URL for existing PDF, regenerating...");
      }
    }

    // Otherwise, generate it now
    const buffer = await generateSafetyPDF(report as any);
    const filePath = await storeSafetyPDF(report.referenceId || report.id, buffer);

    // Save path to DB
    await db.update(table).set({ pdfUrl: filePath }).where(eq(table.id, reportId));

    const signedUrl = await getSignedPDFUrl(filePath);
    return { success: true, url: signedUrl };
  });

export const getReportXML = adminProcedure
  .input(z.object({ 
    reportId: z.string().uuid(),
    reporterType: z.enum(["Patient", "HCP", "Family"])
  }))
  .mutation(async ({ input }) => {
    const { reportId, reporterType } = input;
    let table: any;
    if (reporterType === "Patient") table = patientReports;
    else if (reporterType === "HCP") table = hcpReports;
    else if (reporterType === "Family") table = familyReports;
    else throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid reporter type" });

    const [report] = await db.select().from(table).where(eq(table.id, reportId));
    if (!report || !report.xmlUrl) throw new TRPCError({ code: "NOT_FOUND", message: "XML not found" });

    if (report.isValid === false) {
      throw new TRPCError({ 
        code: "FORBIDDEN", 
        message: "XML download blocked: Report has validation errors. Please fix and regenerate first." 
      });
    }

    const { getSignedE2BUrl } = await import("../../e2b/core/storage.js");
    const url = await getSignedE2BUrl(report.xmlUrl);
    return { success: true, url };
  });

export const getBulkReports = adminProcedure
  .input(z.object({
    reports: z.array(z.object({
      reportId: z.string().uuid(),
      reporterType: z.enum(["Patient", "HCP", "Family"])
    }))
  }))
  .mutation(async ({ input }) => {
    const { reports } = input;
    if (reports.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "No reports selected" });

    const zip = new AdmZip();
    const supabase = getSupabaseAdmin();
    const bucketName = 'reports-xml';

    for (const item of reports) {
      let table: any;
      if (item.reporterType === "Patient") table = patientReports;
      else if (item.reporterType === "HCP") table = hcpReports;
      else if (item.reporterType === "Family") table = familyReports;
      else continue;

      const [report] = await db.select().from(table).where(eq(table.id, item.reportId));
      if (!report) continue;

      const refId = report.referenceId || report.id;

      // 1. Handle PDF
      let pdfBuffer: Buffer | null = null;
      if (report.pdfUrl) {
        const { data, error } = await supabase.storage.from(bucketName).download(report.pdfUrl);
        if (!error && data) pdfBuffer = Buffer.from(await data.arrayBuffer());
      }
      
      if (!pdfBuffer) {
        pdfBuffer = await generateSafetyPDF(report as any);
        const filePath = await storeSafetyPDF(refId, pdfBuffer);
        await db.update(table).set({ pdfUrl: filePath }).where(eq(table.id, item.reportId));
      }
      zip.addFile(`${refId}/${refId}.pdf`, pdfBuffer);

      // 2. Handle XML
      if (report.xmlUrl) {
        const { data, error } = await supabase.storage.from(bucketName).download(report.xmlUrl);
        if (!error && data) {
          const xmlBuffer = Buffer.from(await data.arrayBuffer());
          zip.addFile(`${refId}/${refId}.xml`, xmlBuffer);
        }
      }
    }

    const zipBuffer = zip.toBuffer();
    const zipName = `bulk_export_${Date.now()}.zip`;
    const zipPath = `exports/${zipName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(zipPath, zipBuffer, {
        contentType: 'application/zip',
        upsert: true
      });

    if (uploadError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to upload ZIP" });

    const { data: signedData, error: urlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(zipPath, 3600);

    if (urlError || !signedData) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to sign ZIP URL" });

    return { success: true, url: signedData.signedUrl };
  });

