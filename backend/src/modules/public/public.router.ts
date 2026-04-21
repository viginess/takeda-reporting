import { z } from "zod";
import { router, publicProcedure } from '../../trpc/core/init.js';
import { rateLimitedProcedure } from '../../trpc/core/procedures.js';
import { publicService } from "./public.service.js";

// Publicly accessible procedures for authentication and security
export const publicRouter = router({
  getAuthPolicy: publicProcedure.query(async () => {
    return publicService.getAuthPolicy();
  }),

  /**
   * Specifically checks if a user needs MFA based on their preference 
   * OR global enforcement.
   */
  checkMfaRequirement: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      return publicService.checkMfaRequirement(input.email);
    }),

  checkLockout: rateLimitedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      return publicService.checkLockout(input.email);
    }),

  recordLoginFailure: rateLimitedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      return publicService.recordLoginFailure(input.email);
    }),
});
