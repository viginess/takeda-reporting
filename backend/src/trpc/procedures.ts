import { t, publicProcedure } from "./init.js";
import { isAuthed } from "./middleware/auth.js";
import { isMfaAuthed } from "./middleware/mfa.js";
import { requiresRole } from "./middleware/rbac.js";
import { rateLimitedProcedure } from "./middleware/rateLimit.js";

export { publicProcedure, rateLimitedProcedure };

/**
 * Standard authenticated procedure (Base security)
 */
export const protectedProcedure = t.procedure.use(isAuthed);

/**
 * Enhanced security procedure requiring MFA/2FA
 */
export const mfaProtectedProcedure = t.procedure.use(isAuthed).use(isMfaAuthed);

/**
 * Role-specific procedures
 */
export const superAdminProcedure = mfaProtectedProcedure.use(requiresRole(["super_admin"]));
export const adminProcedure = mfaProtectedProcedure.use(requiresRole(["super_admin", "admin"]));
export const viewerProcedure = mfaProtectedProcedure.use(requiresRole(["super_admin", "admin", "viewer"]));
