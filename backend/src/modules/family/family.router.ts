import { router } from '../../trpc/core/init.js';
import { rateLimitedProcedure } from '../../trpc/core/procedures.js';
import { createFamilySchema } from "./family.validation.js";
import { createFamilyReport } from "./family.service.js";
import { verifyRecaptcha } from "../../utils/services/recaptcha.service.js";

export const familyRouter = router({
  // ─── CREATE ────────────────────────────────────────────────────────────────
  create: rateLimitedProcedure
    .input(createFamilySchema)
    .mutation(async ({ input }) => {
      // Verify reCAPTCHA token if present in input
      if (input.captchaToken) {
        await verifyRecaptcha(input.captchaToken);
      } else if (process.env.RECAPTCHA_SECRET_KEY && process.env.RECAPTCHA_SECRET_KEY !== 'paste_your_secret_key_here') {
        // If secret key is configured but no token provided, reject
        throw new Error("reCAPTCHA token is required");
      }

      const row = await createFamilyReport(input);
      return { success: true, data: row };
    }),
});
