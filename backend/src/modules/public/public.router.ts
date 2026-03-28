import { z } from "zod";
import { router, publicProcedure } from '../../trpc/core/init.js';
import { rateLimitedProcedure } from '../../trpc/core/procedures.js';
import { TRPCError } from "@trpc/server";
import { db } from '../../db/core/index.js';
import { eq, sql } from "drizzle-orm";
import { systemSettings } from "../../db/admin/settings.schema.js";
import { admins } from "../../db/admin/admin.schema.js";

// Publicly accessible procedures for authentication and security
export const publicRouter = router({
  getAuthPolicy: publicProcedure.query(async () => {
    try {
      let [settings] = await db
        .select({
          clinicalConfig: systemSettings.clinicalConfig,
        })
        .from(systemSettings)
        .where(eq(systemSettings.id, 1));

      if (!settings) {
        return {
          isMfaRequired: false, // Default to false if not configured
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
  }),

  /**
   * Specifically checks if a user needs MFA based on their preference 
   * OR global enforcement.
   */
  checkMfaRequirement: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      // Check user-level setting only (as requested: personal preference only)
      const [admin] = await db.select().from(admins).where(eq(admins.email, input.email));
      return { isMfaRequired: !!admin?.twoFactorEnabled };
    }),

  checkLockout: rateLimitedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const [admin] = await db.select().from(admins).where(eq(admins.email, input.email));
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
            // Auto-unlock: reset counts in DB and return not locked
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
    }),

  recordLoginFailure: rateLimitedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const [admin] = await db.select().from(admins).where(eq(admins.email, input.email));
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
    }),
});
