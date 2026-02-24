import { z } from "zod";
import { router, publicProcedure } from "../../trpc/trpc.js";
import { TRPCError } from "@trpc/server";
import { db } from "../../db/index.js";
import { eq, sql } from "drizzle-orm";
import { systemSettings } from "../../db/admin/settings.schema.js";
import { admins } from "../../db/admin/admin.schema.js";

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
          isMfaRequired: true,
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

  checkLockout: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const [admin] = await db.select().from(admins).where(eq(admins.email, input.email));
      if (!admin) return { locked: false };

      const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
      const clinical = settings?.clinicalConfig || {};
      const maxAttempts = parseInt(clinical.maxLoginAttempts || "5");

      if (admin.failedLoginAttempts >= maxAttempts) {
        // Simple lockout logic: if they reached the limit, they are locked.
        // In a real system you'd check lockedAt cooldown.
        return { 
          locked: true, 
          message: "Account locked due to too many failed attempts. Contact administrator.",
          remainingAttempts: 0
        };
      }

      return { 
        locked: false, 
        remainingAttempts: maxAttempts - admin.failedLoginAttempts 
      };
    }),

  recordLoginFailure: publicProcedure
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
