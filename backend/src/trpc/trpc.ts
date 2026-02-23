import { initTRPC, TRPCError } from "@trpc/server";
import { checkRateLimit } from "./rateLimit.js";
import { db } from "../db/index.js";
import { systemSettings } from "../db/admin/settings.schema.js";
import { admins } from "../db/admin/admin.schema.js";
import { eq } from "drizzle-orm";

export interface Context {
  ip: string;
  userAgent: string;
  clientId: string | string[];
  token: string | null;
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin token missing" });
  }

  // Basic validation. In production use jwt.verify
  if (ctx.token.length < 10) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin token" });
  }

  // Fetch system settings for policy enforcement
  let clinical: any = {};
  try {
    const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
    clinical = settings?.clinicalConfig || {};
  } catch (err) {
    console.error("Error fetching system settings in isAuthed:", err);
    // Continue with defaults to avoid total lockout if DB is twitchy
  }

    // 1. Enforce Maintenance Mode (Centralized)
    if (clinical.maintenanceMode) {
      console.warn("Access denied: Maintenance mode enabled");
      throw new TRPCError({ 
        code: "FORBIDDEN", 
        message: "System is in maintenance mode. Admin operations are temporarily disabled." 
      });
    }

    // 2. Decode JWT to check AAL (Authenticator Assurance Level) and AMR (Auth Methods)
    try {
      const payload = JSON.parse(Buffer.from(ctx.token.split('.')[1], 'base64').toString());
      const aal = payload.aal || 'aal1';
      const amr = payload.amr || [];
      const userId = payload.sub;
      const iat = payload.iat || 0;

      // 3. Enforce Session Timeout
      if (clinical.sessionTimeout && clinical.sessionTimeout !== "Never") {
        const timeoutMinutes = parseInt(clinical.sessionTimeout);
        if (!isNaN(timeoutMinutes)) {
          const nowSeconds = Math.floor(Date.now() / 1000);
          if (nowSeconds - iat > timeoutMinutes * 60) {
            console.warn(`Session expired for user ${userId}. IAT: ${iat}, Now: ${nowSeconds}`);
            throw new TRPCError({ 
              code: "UNAUTHORIZED", 
              message: "Session expired. Please log in again." 
            });
          }
        }
      }

      // 4. Enforce Password Expiry
      if (clinical.passwordExpiry && clinical.passwordExpiry !== "Never") {
        const [admin] = await db.select().from(admins).where(eq(admins.id, userId));
        if (admin?.passwordChangedAt) {
          const expiryDays = parseInt(clinical.passwordExpiry);
          if (!isNaN(expiryDays)) {
            const daysSinceChange = (Date.now() - new Date(admin.passwordChangedAt).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceChange > expiryDays) {
              console.warn(`Password expired for user ${userId}. Last changed: ${admin.passwordChangedAt}`);
              throw new TRPCError({ 
                code: "UNAUTHORIZED", 
                message: "Password expired. Please reset your password." 
              });
            }
          }
        }
      }

      return next({
        ctx: {
          user: { id: userId, role: "admin", aal, amr }
        }
      });
    } catch (err) {
      if (err instanceof TRPCError) throw err;
      console.error("JWT verification failed in isAuthed:", err);
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Failed to verify admin session" });
    }
});

/**
 * MFA Middleware - Strictly enforces AAL2 if MFA is enabled in system settings
 */
const isMfaAuthed = t.middleware(async ({ ctx, next }) => {
  // Fetch system settings for policy enforcement
  let clinical: any = {};
  try {
    const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
    clinical = settings?.clinicalConfig || {};
  } catch (err) {
    console.error("Error fetching system settings in isMfaAuthed:", err);
  }

  // Enforce MFA if enabled globally and user is not AAL2
  // We ALSO allow aal1 if the AMR claim contains 'otp' or 'email' (our custom Email 2FA)
  // Note: Supabase AMR is an array of objects: [{method: 'otp', timestamp: ...}]
  const user = (ctx as any).user;
  const isAal2 = user?.aal === 'aal2';
  const amrArr = Array.isArray(user?.amr) ? user.amr : [];
  
  const hasStrongAuth = isAal2 || amrArr.some((m: any) => 
    m === 'otp' || m === 'email' || m === 'mfa' || 
    (typeof m === 'object' && (m.method === 'otp' || m.method === 'email' || m.method === 'mfa'))
  );

  if (clinical.twoFA === true && !hasStrongAuth) {
    console.warn(`MFA REJECTED: User AAL: ${user?.aal}, AMR: ${JSON.stringify(amrArr)}`);
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "MFA verification required. Please complete 2FA to proceed.",
    });
  }

  return next();
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const mfaProtectedProcedure = t.procedure.use(isAuthed).use(isMfaAuthed);

/**
 * A procedure that limits submissions to 50 per hour per client fingerprint.
 * Distinguishes users by IP + User-Agent + Client-ID.
 */
export const rateLimitedProcedure = t.procedure.use(async (opts) => {
  const { ip, userAgent, clientId } = opts.ctx;
  
  // Create a unique fingerprint for this specific client
  const fingerprint = `${ip}:${userAgent}:${clientId}`;
  
  const isAllowed = checkRateLimit(fingerprint, 50, 3600000); // 50 per hour
  
  if (!isAllowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Submission limit reached. Please try again later.",
    });
  }

  return opts.next();
});
