import { eq } from "drizzle-orm";
import { db } from "../../db/core/index.js";
import { systemSettings } from "../../db/admin/settings.schema.js";

/**
 * The standard "Post-Submission" workflow for all reporting types.
 * 1. Triggers E2B XML Processing.
 * 2. Generates the Safety PDF.
 * 3. Saves Generated File Paths.
 * 4. Dispatches Admin Email.
 */
export async function runReportingWorkflow(params: {
  reportId: string;
  reporterType: "Patient" | "HCP" | "Family";
  table: any;
}) {
  const { reportId, reporterType, table } = params;

  try {
    // 1. Fetch current record & settings
    const [row] = await db.select().from(table).where(eq(table.id, reportId));
    if (!row) throw new Error(`Report ${reportId} not found in ${table}`);

    let [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));

    // 2. Trigger E2B XML Logic
    const { processE2BWorkflow } = await import("../../modules/e2b/index.js");
    const e2bResult = await processE2BWorkflow(reportId);

    // 3. Generate and Store PDF
    const { generateSafetyPDF } = await import("../../modules/pdf/pdf-generator.js");
    const { storeSafetyPDF } = await import("../../modules/pdf/storage.js");
    
    // Use enriched report (with WHODrug ingredients) for PDF generation
    const buffer = await generateSafetyPDF((e2bResult as any).enrichedReport || row);
    const pdfPath = await storeSafetyPDF(row.referenceId || row.id, buffer);
    
    // 4. Update Database
    await db.update(table).set({ pdfUrl: pdfPath }).where(eq(table.id, reportId));

    // 5. Send Admin Notification Email
    const { sendAdminNotificationEmail } = await import("../services/mailer.js");
    
    const recipient = settings?.clinicalConfig?.smtpFrom || process.env.SMTP_FROM || 'aereporting@viginess.com';
    if (recipient) {
      const refId = row.referenceId || row.id;
      const validationPassed = e2bResult.isValid;
      const validationErrList = (e2bResult.errors || [])
        .map((e: any) => `<li>${e.message || JSON.stringify(e)}</li>`)
        .join('');

      const subject = validationPassed
        ? `New ${reporterType} Safety Report: ${refId}`
        : `[VALIDATION FAILED] New ${reporterType} Safety Report: ${refId}`;

      const validationBanner = validationPassed
        ? `<p style="color:green;"><b>E2B XML Validation: PASSED</b></p>`
        : `<p style="color:red;"><b>E2B XML Validation: FAILED</b></p>
           <p>The following issues were detected and must be corrected before regulatory submission:</p>
           <ul style="color:red;">${validationErrList}</ul>`;

      await sendAdminNotificationEmail({
        to: recipient,
        subject,
        html: `
          <p>A new safety report has been submitted by a ${reporterType}.</p>
          <p><b>Reference ID:</b> ${refId}</p>
          <p><b>Reporter Type:</b> ${row.reporterType || reporterType}</p>
          ${validationBanner}
          <p>Please find the attached E2B XML and Safety PDF for your review.</p>
        `,
        attachments: [
          { filename: `${refId}.pdf`, content: buffer },
          { filename: `${refId}.xml`, content: e2bResult.xmlContent || "" }
        ]
      });
    }

    return { success: true, e2b: e2bResult, pdfPath };
  } catch (err: any) {
    console.error(`[Workflow] Failure for ${reporterType} ${reportId}:`, {
      message: err?.message || String(err)
    });
    // Non-blocking for the API response, but logged
    return { success: false, error: err?.message };
  }
}
