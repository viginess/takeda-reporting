import { eq } from "drizzle-orm";
import { db } from "../../db/core/index.js";
import { systemSettings } from "../../db/admin/settings.schema.js";
import { auditLogs } from "../../db/audit/audit.schema.js";

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
  console.log(`[Workflow]  Starting workflow for ${reporterType} report: ${reportId}`);

  try {
    // 1. Fetch current record & settings
    const [row] = await db.select().from(table).where(eq(table.id, reportId));
    if (!row) {
      console.error(`[Workflow]  Error: Report ${reportId} not found in ${table.tableName}`);
      return;
    }

    let [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
    const refId = row.referenceId || row.id;
    console.log(`[Workflow]  Record loaded: ${refId}`);

    // 2. Trigger E2B XML Logic
    console.log(`[Workflow]  Generating E2B XML...`);
    const { processE2BWorkflow } = await import("../../modules/e2b/index.js");
    const e2bResult = await processE2BWorkflow(reportId);
    console.log(`[Workflow]  XML Generated (Valid: ${e2bResult.isValid})`);

    // 3. Generate and Store PDF
    console.log(`[Workflow]  Generating Safety PDF...`);
    const { generateSafetyPDF } = await import("../../modules/pdf/pdf-generator.js");
    const { storeSafetyPDF } = await import("../../modules/pdf/storage.js");
    
    const buffer = await generateSafetyPDF((e2bResult as any).enrichedReport || row);
    const pdfPath = await storeSafetyPDF(row.referenceId || row.id, buffer);
    console.log(`[Workflow]  PDF Stored: ${pdfPath}`);
    
    // 4. Update Database
    await db.update(table).set({ pdfUrl: pdfPath }).where(eq(table.id, reportId));

    // 5. Send Admin Notification Email
    const { sendAdminNotificationEmail } = await import("../services/mailer.js");
    
    const recipient = settings?.clinicalConfig?.smtpFrom || process.env.SMTP_FROM || 'aereporting@viginess.com';
    console.log(`[Workflow] Dispatching Admin Notification to: ${recipient}`);
    
    if (recipient) {
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

      const adminEmailSent = await sendAdminNotificationEmail({
        to: recipient,
        subject,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #CE0037;">New Safety Report Submitted</h2>
            <p>A new safety report has been submitted by a <b>${reporterType}</b>.</p>
            <hr />
            <p><b>Reference ID:</b> ${refId}</p>
            <p><b>Status:</b> ${row.status || 'New'}</p>
            <p><b>Severity:</b> ${row.severity || 'Normal'}</p>
            ${validationBanner}
            <hr />
            <p>The E2B XML and PDF are attached for your review.</p>
          </div>
        `,
        attachments: [
          { filename: `${refId}.pdf`, content: buffer },
          { filename: `${refId}.xml`, content: e2bResult.xmlContent || "" }
        ]
      });
      console.log(`[Workflow] Admin Email Status: ${adminEmailSent ? ' SENT' : ' FAILED'}`);
    }

    // 6. Notify Manufacturers (only if report is valid/compliant)
    if (e2bResult.isValid) {
      console.log(`[Workflow]  Dispatching Manufacturer Notifications...`);
      // Small 1.5s delay to prevent SMTP 'Greeting never received' errors on rapid fire
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { companyNotificationService } = await import("../../modules/company/company.service.js");
      await companyNotificationService.notifyManufacturersForReport({
        reportId,
        products: (e2bResult as any).enrichedReport?.products || row.products || [],
        referenceId: row.referenceId || row.id,
        pdfBuffer: buffer,
        xmlContent: e2bResult.xmlContent || ""
      });
    } else {
      console.log(`[Workflow]  Skipping Manufacturer Notifications: Report is NOT compliant.`);
      try {
        await db.insert(auditLogs).values({
          entity: 'report',
          entityId: reportId,
          action: 'notification_skipped',
          changedBy: 'System Workflow',
          details: 'Manufacturer notification skipped: Report failed compliance/E2B validation.'
        } as any);
      } catch (aerr) {
        console.error("Failed to log notification skip to audit:", aerr);
      }
    }

    console.log(`[Workflow]  Finished workflow for ${refId}`);

    // background check for bounces after a 20s delay to allow mail server processing
    setTimeout(async () => {
      try {
        console.log(`[Workflow] Running automated post-send audit for ${refId}...`);
        const { inboxMonitorService } = await import("../../modules/notifications/inbox-monitor.service.js");
        await inboxMonitorService.scanForBounces();
      } catch (err) {
        console.error("Automated post-send audit failed:", err);
      }
    }, 20000);

    return { success: true, e2b: e2bResult, pdfPath };
  } catch (err: any) {
    console.error(`[Workflow] CRITICAL FAILURE for ${reporterType} ${reportId}:`, err);
    return { success: false, error: err?.message };
  }
}
