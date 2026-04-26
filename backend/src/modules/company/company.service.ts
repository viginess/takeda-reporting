import { db } from "../../db/core/index.js";
import { companies, companyNotifications } from "../../db/company/company.schema.js";
import { eq, sql } from "drizzle-orm";
import { sendAdminNotificationEmail as sendEmail } from "../../utils/services/mailer.js";

/**
 * Service for handling manufacturer-specific notification logic.
 */
export const companyNotificationService = {
  /**
   * Identifies all companies involved in a report and dispatches notification emails.
   * Only called if the report has passed E2B validation.
   */
  async notifyManufacturersForReport(params: {
    reportId: string;
    products: any[];
    referenceId: string;
    pdfBuffer: Buffer;
    xmlContent: string;
  }) {
    const { reportId, products, referenceId, pdfBuffer, xmlContent } = params;

    try {
      // 1. Extract unique manufacturer names and their provided emails
      const manufacturersToNotify = products.reduce((acc: any[], p: any) => {
        if (p.manufacturerName) {
          const existing = acc.find(m => m.name === p.manufacturerName);
          if (!existing) {
            acc.push({ name: p.manufacturerName, email: p.manufacturerEmail });
          } else if (!existing.email && p.manufacturerEmail) {
            existing.email = p.manufacturerEmail;
          }
        }
        return acc;
      }, []);

      if (manufacturersToNotify.length === 0) {
        console.log(`[Notification] No manufacturers found for report ${referenceId}. Skipping.`);
        return;
      }

      for (const m of manufacturersToNotify) {
        // 2. Lookup or Create company
        let [company] = await db
          .select()
          .from(companies)
          .where(sql`LOWER(${companies.name}) = LOWER(${m.name})`);

        if (!company) {
          console.log(`[Notification] New manufacturer detected: ${m.name}. Adding to database.`);
          [company] = await db.insert(companies).values({
            name: m.name,
            email: m.email || null,
            isRegistered: !!m.email // Register automatically if email is provided
          }).returning();

          // 3. Notify Admin about the new manufacturer
          await sendEmail({
            to: process.env.SMTP_FROM || 'admin@viginess.com', // Fallback to admin
            subject: `[ACTION REQUIRED] New Manufacturer Added: ${m.name}`,
            html: `
              <p>A new manufacturer has been automatically added to the system during report submission.</p>
              <p><b>Name:</b> ${m.name}</p>
              <p><b>Email Provided:</b> ${m.email || 'None'}</p>
              <p><b>Report Reference:</b> ${referenceId}</p>
              <p>Please log in to the admin panel to verify their contact details and registration status.</p>
            `
          });
        } else if (m.email && !company.email) {
          // Update email if we found a match but the stored email was blank
          await db.update(companies).set({ email: m.email, isRegistered: true }).where(eq(companies.id, company.id));
          company.email = m.email;
          company.isRegistered = true;
        }

        // 4. Create a pending notification record
        const [notification] = await db.insert(companyNotifications).values({
          reportId,
          companyId: company.id,
          status: 'pending'
        }).returning();

        // 5. Skip if no email or not registered for automated notifications
        if (!company.email || !company.isRegistered) {
          console.log(`[Notification] Company ${company.name} lacks verified email. Notification skipped.`);
          await db.update(companyNotifications)
            .set({ status: 'failed', lastError: 'Missing contact email or not registered. Please add email and retry.' })
            .where(eq(companyNotifications.id, notification.id));
          continue;
        }

        // 6. Dispatch Email
        const result = await sendEmail({
          to: company.email,
          subject: `ADVERSE EVENT NOTIFICATION: Safety Report ${referenceId}`,
          html: `
            <div style="font-family: sans-serif; line-height: 1.5;">
              <h2>Safety Report Notification</h2>
              <p>Dear ${company.name} Pharmacovigilance Team,</p>
              <p>This is an automated notification of a new safety report involving one or more of your products.</p>
              <hr />
              <p><b>Reference ID:</b> ${referenceId}</p>
              <p><b>Transmission Type:</b> Initial E2B R3 Submission</p>
              <hr />
              <p>The attached E2B XML and Safety PDF contain the full details of the event for your review and regulatory processing.</p>
              <p>Please acknowledge receipt of this notification.</p>
              <br />
              <p><i>This is an automated message from the Viginess Reporting System.</i></p>
            </div>
          `,
          attachments: [
            { filename: `${referenceId}.pdf`, content: pdfBuffer },
            { filename: `${referenceId}.xml`, content: xmlContent }
          ]
        });

        // 7. Update status based on delivery result
        const hasRejections = result.success && result.rejected && (result.rejected as any[]).length > 0;
        
        await db.update(companyNotifications)
          .set({ 
            status: (result.success && !hasRejections) ? 'sent' : 'failed',
            sentAt: result.success ? new Date() : null,
            lastError: result.success 
              ? (hasRejections ? `Rejected by IONOS: ${(result.rejected as any[]).join(', ')}` : null)
              : (result.error || 'Failed to dispatch via SMTP')
          })
          .where(eq(companyNotifications.id, notification.id));
      }

    } catch (error) {
      console.error(`[Notification] Critical failure for report ${referenceId}:`, error);
    }
  },

  /**
   * Resends an existing notification that failed.
   */
  async resendNotification(notificationId: string) {
    const [notif] = await db.select().from(companyNotifications).where(eq(companyNotifications.id, notificationId));
    if (!notif) throw new Error("Notification record not found.");

    const [company] = await db.select().from(companies).where(eq(companies.id, notif.companyId));
    if (!company || !company.email) throw new Error("Manufacturer contact email is missing.");

    // Fetch report data to regenerate attachments
    // We try all 3 tables since we don't know the type
    const tables = [
      await import("../../db/patient/patient.schema.js").then(m => m.patientReports),
      await import("../../db/hcp/hcp.schema.js").then(m => m.hcpReports),
      await import("../../db/family/family.schema.js").then(m => m.familyReports)
    ];

    let reportRow: any = null;
    for (const table of tables) {
      const [row] = await db.select().from(table as any).where(eq((table as any).id, notif.reportId));
      if (row) {
        reportRow = row;
        break;
      }
    }

    if (!reportRow) throw new Error("Original clinical report not found.");

    const referenceId = reportRow.referenceId || reportRow.id;
    console.log(`[Resend] Re-triggering transmission for ${referenceId} to ${company.name}`);

    // Regenerate XML
    const { processE2BWorkflow } = await import("../e2b/index.js");
    const e2bResult = await processE2BWorkflow(reportRow.id);

    // Regenerate PDF
    const { generateSafetyPDF } = await import("../../modules/pdf/pdf-generator.js");
    const buffer = await generateSafetyPDF((e2bResult as any).enrichedReport || reportRow);

    const { sendAdminNotificationEmail } = await import("../../utils/services/mailer.js");
    
    const result = await sendAdminNotificationEmail({
      to: company.email,
      subject: `ADVERSE EVENT NOTIFICATION: Safety Report ${referenceId}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5;">
          <h2>Safety Report Notification</h2>
          <p>Dear ${company.name} Pharmacovigilance Team,</p>
          <p>This is an automated notification of a safety report involving one or more of your products.</p>
          <hr />
          <p><b>Reference ID:</b> ${referenceId}</p>
          <p><b>Transmission Type:</b> Initial E2B R3 Submission</p>
          <hr />
          <p>The attached E2B XML and Safety PDF contain the full details of the event for your review and regulatory processing.</p>
          <p>Please acknowledge receipt of this notification.</p>
          <br />
          <p><i>This is an automated message from the Viginess Reporting System.</i></p>
        </div>
      `,
      attachments: [
        { filename: `${referenceId}.pdf`, content: buffer },
        { filename: `${referenceId}.xml`, content: e2bResult.xmlContent || "" }
      ]
    });

    const hasRejections = result.success && result.rejected && (result.rejected as any[]).length > 0;
    
    await db.update(companyNotifications)
      .set({ 
        status: (result.success && !hasRejections) ? 'sent' : 'failed',
        sentAt: new Date(), // Update to the new send time
        lastError: result.success 
          ? (hasRejections ? `Rejected by IONOS: ${(result.rejected as any[]).join(', ')}` : null)
          : (result.error || 'Failed to dispatch via SMTP')
      })
      .where(eq(companyNotifications.id, notificationId));

    // Trigger automated post-resend audit after a 20s delay
    setTimeout(async () => {
      try {
        console.log(`[Resend] Running automated post-resend audit for ${referenceId}...`);
        const { inboxMonitorService } = await import("../notifications/inbox-monitor.service.js");
        await inboxMonitorService.scanForBounces();
      } catch (err) {
        console.error("Automated post-resend audit failed:", err);
      }
    }, 20000);

    return { success: true };
  }
};
