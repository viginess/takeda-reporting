import { z } from "zod";
import { router, publicProcedure } from '../../trpc/core/init.js';
import { db } from '../../db/core/index.js';
import { eq } from "drizzle-orm";
import { systemSettings } from "../../db/admin/settings.schema.js";
import { TRPCError } from "@trpc/server";

export const contactRouter = router({
  submitContactForm: publicProcedure
    .input(z.object({
      title: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      country: z.string(),
      inquiryType: z.string(),
      message: z.string()
    }))
    .mutation(async ({ input }) => {
      const { sendAdminNotificationEmail } = await import("../../utils/mailer.js");
      const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
      
      const recipient = settings?.clinicalConfig?.smtpFrom || process.env.SMTP_FROM || 'aereporting@viginess.com';
      
      const success = await sendAdminNotificationEmail({
        to: recipient,
        subject: `🌐 New Web Inquiry: ${input.inquiryType} from ${input.firstName} ${input.lastName}`,
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
    }),
});
