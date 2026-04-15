import { db } from '../../db/core/index.js';
import { eq, sql } from "drizzle-orm";
import { systemSettings } from "../../db/admin/settings.schema.js";
import { admins } from "../../db/admin/admin.schema.js";
import { TRPCError } from "@trpc/server";

export const publicService = {
  /**
   * Fetches global authentication policies (MFA requirement, lockout settings)
   */
  async getAuthPolicy() {
    try {
      let [settings] = await db
        .select({
          clinicalConfig: systemSettings.clinicalConfig,
        })
        .from(systemSettings)
        .where(eq(systemSettings.id, 1));

      if (!settings) {
        return {
          isMfaRequired: false,
          maxLoginAttempts: 5,
        };
      }

      const clinical = settings.clinicalConfig || {};
      return {
        isMfaRequired: clinical.twoFA === true,
        maxLoginAttempts: parseInt(clinical.maxLoginAttempts || "5"),
      };
    } catch (err: any) {
      console.error("Error in getAuthPolicy:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "Failed to fetch auth policy",
      });
    }
  },

  /**
   * Checks if a specific administrator has enabled MFA
   */
  async checkMfaRequirement(email: string) {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return { isMfaRequired: !!admin?.twoFactorEnabled };
  },

  /**
   * Evaluates lockout status based on failed attempts and cooldown periods
   */
  async checkLockout(email: string) {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    if (!admin) return { locked: false };

    const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
    const clinical = settings?.clinicalConfig || {};
    const maxAttempts = parseInt(clinical.maxLoginAttempts || "5");
    const lockoutMinutes = parseInt(clinical.lockoutCooldown || "30");

    if (admin.failedLoginAttempts >= maxAttempts) {
      if (admin.lockedAt) {
        const lockedAtTime = new Date(admin.lockedAt).getTime();
        const cooldownMs = lockoutMinutes * 60 * 1000;
        const isCooldownPassed = Date.now() - lockedAtTime > cooldownMs;

        if (isCooldownPassed) {
          // Auto-unlock: reset counts in DB
          await db
            .update(admins)
            .set({ failedLoginAttempts: 0, lockedAt: null })
            .where(eq(admins.id, admin.id));
          
          return {
            locked: false,
            remainingAttempts: maxAttempts
          };
        }
      }

      return { 
        locked: true, 
        message: "Account locked due to too many failed attempts. Try again later or contact administrator.",
        remainingAttempts: 0
      };
    }

    return { 
      locked: false, 
      remainingAttempts: Math.max(0, maxAttempts - admin.failedLoginAttempts)
    };
  },

  /**
   * Increments failed login count and triggers lockout timestamp if threshold reached
   */
  async recordLoginFailure(email: string) {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    if (!admin) return { success: false };

    await db
      .update(admins)
      .set({
        failedLoginAttempts: sql`${admins.failedLoginAttempts} + 1`,
        lockedAt: sql`CASE WHEN ${admins.failedLoginAttempts} + 1 >= (SELECT (clinical_config->>'maxLoginAttempts')::int FROM system_settings WHERE id = 1) THEN NOW() ELSE NULL END`,
        updatedAt: new Date(),
      })
      .where(eq(admins.id, admin.id));

    return { success: true };
  },

  /**
   * Formats and dispatches the website contact inquiry email
   */
  async handleContactInquiry(input: {
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    country: string;
    inquiryType: string;
    message: string;
  }) {
    const { sendAdminNotificationEmail } = await import("../../utils/services/mailer.js");
    const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
    
    const recipient = settings?.clinicalConfig?.smtpFrom || process.env.SMTP_FROM || 'aereporting@viginess.com';
    
    const success = await sendAdminNotificationEmail({
      to: recipient,
      subject: `New Web Inquiry: ${input.inquiryType} from ${input.firstName} ${input.lastName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
          <h2 style="color: #CE0037; border-bottom: 2px solid #CE0037; padding-bottom: 10px;">New Website Inquiry</h2>
          <p>A new message has been received from the website contact form:</p>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 150px;">Name:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${input.title} ${input.firstName} ${input.lastName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${input.email}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Country:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${input.country}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Inquiry Type:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${input.inquiryType}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
            <p style="margin-top: 0; font-weight: bold;">Message:</p>
            <p style="white-space: pre-wrap;">${input.message}</p>
          </div>
          
          <p style="font-size: 11px; color: #999; margin-top: 30px; text-align: center;">
            This inquiry was sent automatically from the Takeda Reporting Contact Page.
          </p>
        </div>
      `
    });

    if (!success) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to send your message. Please try again later."
      });
    }

    return { success: true };
  }
};
