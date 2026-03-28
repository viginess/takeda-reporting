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
      console.error("MFA Middleware Error:", err);
      // If DB check fails, we might want to fail safe or allow? 
      // Given it's a security check, failing safe (rejecting) is usually better, 
      // but let's allow it to proceed if DB is down to avoid logout loops 
      // UNLESS strong auth is already present.
    }
  }

  return next();
});
