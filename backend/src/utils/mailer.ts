import nodemailer from 'nodemailer';
import { db } from '../db/index.js';
import { systemSettings } from '../db/admin/settings.schema.js';
import { eq } from 'drizzle-orm';

/**
 * Generic mailer utility.
 * Fetches SMTP configuration from the database.
 * Falls back to environment variables if not set in DB,
 * and finally to Ethereal Email for dev/testing.
 */
export async function sendAdminNotificationEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer | string }[];
}) {
  try {
    const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
    const clinical = settings?.clinicalConfig;

    const host = clinical?.smtpHost || process.env.SMTP_HOST;
    const port = Number(clinical?.smtpPort) || Number(process.env.SMTP_PORT) || 587;
    const user = clinical?.smtpUser || process.env.SMTP_USER;
    const pass = clinical?.smtpPass || process.env.SMTP_PASS;
    const from = clinical?.smtpFrom || process.env.SMTP_FROM || '"Clin Solutions Notification" <no-reply@clinsolutions.com>';

    let transporter;

    if (host && user && pass) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      // Create a test account (Ethereal) if SMTP is missing
      console.warn("SMTP credentials missing in DB and .env. Using Ethereal Email for dev/testing.");
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      attachments,
    });

    console.log(`Email sent to ${to}. Message ID: ${info.messageId}`);
    if (!host) {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}
