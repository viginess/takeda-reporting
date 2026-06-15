import { z } from "zod";
import { router, publicProcedure } from '../../trpc/core/init.js';
import { publicService } from "./public.service.js";
import { verifyRecaptcha } from "../../utils/services/recaptcha.service.js";
import { TRPCError } from "@trpc/server";

export const contactRouter = router({
  submitContactForm: publicProcedure
    .input(z.object({
      title: z.string().max(20),
      firstName: z.string().min(1).max(100),
      lastName: z.string().min(1).max(100),
      email: z.string().email().max(254),
      country: z.string().max(100),
      inquiryType: z.enum(["general", "pv", "career", "privacy", "technical"]),
      message: z.string().min(10).max(5000),
      captchaToken: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Enforce reCAPTCHA when a secret key is configured
      const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
      if (recaptchaSecret && recaptchaSecret !== 'paste_your_secret_key_here') {
        if (!input.captchaToken) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "reCAPTCHA verification is required.",
          });
        }
        await verifyRecaptcha(input.captchaToken);
      }
      return publicService.handleContactInquiry(input);
    }),
});

