import { TRPCError } from "@trpc/server";
import { t } from "../core/init.js";
import { db } from '../../db/core/index.js';
import { admins } from "../../db/admin/admin.schema.js";
import { eq } from "drizzle-orm";

export const isMfaAuthed = t.middleware(async ({ ctx, next }) => {

  const user = (ctx as any).user;
  const isAal2 = user?.aal === 'aal2';
  const amrArr = Array.isArray(user?.amr) ? user.amr : [];
  
  const hasStrongAuth = isAal2 || amrArr.some((m: any) => 
    m === 'otp' || m === 'email' || m === 'mfa' || 
    (typeof m === 'object' && (m.method === 'otp' || m.method === 'email' || m.method === 'mfa'))
  );

  // Check user-level preference (Global enforcement removed per user request)
  if (user?.id) {
    try {
      const [admin] = await db.select().from(admins).where(eq(admins.id, user.id));
      if (admin?.twoFactorEnabled && !hasStrongAuth) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "MFA verification required (User Preference)." });
      }
    } catch (err) {
      if (err instanceof TRPCError) throw err;
      // DB error during MFA check — fail closed to prevent bypass
      console.error("MFA Middleware DB Error:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not verify MFA status. Please try again.",
      });
    }
  }

  return next();
});
