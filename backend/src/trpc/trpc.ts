import { initTRPC, TRPCError } from "@trpc/server";
import { checkRateLimit } from "./rateLimit.js";

export interface Context {
  ip: string;
  userAgent: string;
  clientId: string | string[];
  token: string | null;
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin token missing" });
  }
  // Basic validation. In production use jwt.verify
  if (ctx.token.length < 10) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin token" });
  }
  return next({
    ctx: {
      user: { id: "admin-user-id", role: "admin" }
    }
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

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
