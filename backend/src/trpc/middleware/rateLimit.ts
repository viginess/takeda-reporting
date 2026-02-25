import { TRPCError } from "@trpc/server";
import { t } from "../init.js";

// In-memory store for rate limiting
const rateLimits = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter helper
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const state = rateLimits.get(key);

  if (!state || now > state.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (state.count >= limit) {
    return false;
  }

  state.count++;
  return true;
}

/**
 * A procedure that limits submissions to 50 per hour per client fingerprint.
 */
export const rateLimitedProcedure = t.procedure.use(async (opts) => {
  const { ip, userAgent, clientId } = opts.ctx;
  const fingerprint = `${ip}:${userAgent}:${clientId}`;
  
  if (!checkRateLimit(fingerprint, 50, 3600000)) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Submission limit reached. Please try again later.",
    });
  }

  return opts.next();
});
