import { db } from "../../db/core/index.js";
import { companies, companyNotifications } from "../../db/company/company.schema.js";
import { eq, inArray } from "drizzle-orm";
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
      // 1. Extract unique company codes from the products list
      // We look for 'companyCode' which should be present after WHODrug enrichment
      const companyCodes = [...new Set(
        products
          .map((p: any) => p.companyCode)
          .filter(Boolean)
      )] as string[];

      if (companyCodes.length === 0) {
        console.log(`[Notification] No company codes found for report ${referenceId}. Skipping.`);
        return;
      }

      // 2. Lookup registered companies
      const targetCompanies = await db
        .select()
        .from(companies)
        .where(inArray(companies.companyCode, companyCodes));

      console.log(`[Notification] Found ${targetCompanies.length} companies to notify for report ${referenceId}.`);

      for (const company of targetCompanies) {
        // Skip if no email or not registered for automated notifications
        if (!company.email || !company.isRegistered) continue;

        // Skip generic pools if they are marked N/A
        if (company.email.includes("N/A")) continue;

        // 3. Create a pending notification record
        const [notification] = await db.insert(companyNotifications).values({
          reportId,
          companyId: company.id,
          status: 'pending'
        }).returning();

        // 4. Dispatch Email
        const success = await sendEmail({
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

        // 5. Update status based on delivery result
        await db.update(companyNotifications)
          .set({ 
            status: success ? 'sent' : 'failed',
            sentAt: success ? new Date() : null,
            lastError: success ? null : 'Failed to dispatch via SMTP'
          })
          .where(eq(companyNotifications.id, notification.id));
      }

    } catch (error) {
      console.error(`[Notification] Critical failure for report ${referenceId}:`, error);
    }
  }
};
