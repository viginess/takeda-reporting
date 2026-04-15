import { z } from "zod";
import { router, publicProcedure } from '../../trpc/core/init.js';
import { publicService } from "./public.service.js";

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
      return publicService.handleContactInquiry(input);
    }),
});

