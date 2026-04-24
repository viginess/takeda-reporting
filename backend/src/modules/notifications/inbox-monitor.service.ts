import { ImapFlow } from 'imapflow';
import { db } from '../../db/core/index.js';
import { companyNotifications } from '../../db/company/company.schema.js';
import { eq, sql } from 'drizzle-orm';
import { convert } from 'html-to-text';

/**
 * InboxMonitorService
 * Automatically monitors the IONOS inbox for bounce-back emails (Delivery Status Notifications).
 * When a bounce is detected, it parses the report ID and updates the dashboard status to 'failed'.
 */
class InboxMonitorService {
  private client: ImapFlow;

  constructor() {
    this.client = new ImapFlow({
      host: 'imap.ionos.com',
      port: 993,
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'aereporting@viginess.com',
        pass: process.env.SMTP_PASS || 'viginess@24'
      },
      logger: false
    });
  }

  async scanForBounces() {
    console.log('[InboxMonitor] Starting bounce scan...');
    try {
      await this.client.connect();
      const lock = await this.client.getMailboxLock('INBOX');

      try {
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - 2);

        console.log(`[InboxMonitor] Deep Scanning ALL emails since ${sinceDate.toLocaleDateString()}...`);

        const uids = await this.client.search({
          since: sinceDate
        });

        if (!uids || uids.length === 0) {
          console.log('[InboxMonitor] Inbox is empty or no emails today.');
          return;
        }

        console.log(`[InboxMonitor] Analyzing ${uids.length} emails for bounce patterns...`);

        let matchCount = 0;

        for (const uid of uids) {
          const content = await this.client.fetchOne(uid, { source: true, envelope: true });
          if (!content || !content.source) continue;
          
          const subject = (content.envelope?.subject || "").toLowerCase();
          const from = (content.envelope?.from?.[0]?.address || "").toLowerCase();
          const bodyRaw = content.source.toString();
          const text = convert(bodyRaw).toLowerCase();

          console.log(`[InboxMonitor] Checking email: "${content.envelope?.subject}" from <${from}>`);

          // Broad failure pattern matching (Vocabulary)
          const failureKeywords = [
            "failure", "undelivered", "bounce", "returned", "rejected", 
            "access denied", "quota", "mailbox full", "unrouteable", "unsuccessful"
          ];
          
          const isTechnicalSender = from.includes("mailer-daemon") || from.includes("postmaster") || from.includes("noreply") || from.includes("cisco");
          const hasFailureKeyword = failureKeywords.some(kw => subject.includes(kw) || text.includes(kw));
          const hasDiagnostic = text.includes("diagnostic-code") || text.includes("reason for the problem");

          if (isTechnicalSender || hasFailureKeyword || hasDiagnostic) {
            console.log(`[InboxMonitor]   MATCH: This looks like a bounce report. Scanning for ID...`);
            
            // Look for our specific Report ID format (REP-[6 chars])
            const repMatches = text.match(/REP-[A-Z0-9]{6}/gi);
          
            if (repMatches) {
              const uniqueMatches = Array.from(new Set(repMatches.map(m => m.toUpperCase())));
              
              for (const referenceId of uniqueMatches) {
                // 1. Find the report ID (UUID)
                const reportQuery = sql`
                  SELECT id FROM (
                    SELECT id, reference_id FROM patient_reports
                    UNION ALL
                    SELECT id, reference_id FROM hcp_reports
                    UNION ALL
                    SELECT id, reference_id FROM family_reports
                  ) AS r WHERE r.reference_id = ${referenceId}
                `;
                
                const [reportRow]: any = (await db.execute(reportQuery)).rows;

                if (reportRow) {
                  const reportId = reportRow.id;

                  // 2. Extract reason
                  let failReason = "Unknown delivery failure";
                  const diagnosticMatch = text.match(/diagnostic-code:[^]*?(?=\n\n|\n[a-z-]*:|$)/i);
                  const reasonMatch = text.match(/reason for the problem:[^]*?(?=\n\n|\n[a-z-]*:|$|\[)/i);
                  
                  if (diagnosticMatch) {
                    failReason = diagnosticMatch[0].replace(/diagnostic-code:\s*(smtp;)?\s*/i, '').trim();
                  } else if (reasonMatch) {
                    failReason = reasonMatch[0].replace(/reason for the problem:/i, '').trim();
                  }

                  const fullDiagnostic = `FROM: ${content.envelope?.from?.[0]?.address}\nSUBJECT: ${content.envelope?.subject}\n\nREASON: ${failReason}`;

                  const updateResult = await db.update(companyNotifications)
                    .set({
                      status: 'failed',
                      lastError: fullDiagnostic,
                      bouncedAt: new Date()
                    })
                    .where(eq(companyNotifications.reportId, reportId));

                  if (updateResult && updateResult.rowCount && updateResult.rowCount > 0) {
                    console.log(`[InboxMonitor] Successfully flipped status to FAILED for ${referenceId}`);
                    matchCount++;
                  }
                }
              }
            }
          }
          // Mark as seen
          await this.client.messageFlagsAdd(uid, ['\\Seen']);
        }
        console.log(`[InboxMonitor] Scan complete. Updated ${matchCount} reports.`);
      } finally {
        lock.release();
      }
    } catch (err) {
      console.error('[InboxMonitor] Error during scan:', err);
    } finally {
      await this.client.logout();
    }
  }
}

export const inboxMonitorService = new InboxMonitorService();
