import { TRPCError } from "@trpc/server";
import { t } from "../init.js";
import { db } from "../../db/index.js";
import { systemSettings } from "../../db/admin/settings.schema.js";
import { eq } from "drizzle-orm";

export const isMfaAuthed = t.middleware(async ({ ctx, next }) => {
  let clinical: any = {};
  try {
    const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
    clinical = settings?.clinicalConfig || {};
  } catch (e) {}

  const user = (ctx as any).user;
  const isAal2 = user?.aal === 'aal2';
  const amrArr = Array.isArray(user?.amr) ? user.amr : [];
  
  const hasStrongAuth = isAal2 || amrArr.some((m: any) => 
    m === 'otp' || m === 'email' || m === 'mfa' || 
    (typeof m === 'object' && (m.method === 'otp' || m.method === 'email' || m.method === 'mfa'))
  );

  if (clinical.twoFA === true && !hasStrongAuth) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "MFA verification required." });
  }
  return next();
});
