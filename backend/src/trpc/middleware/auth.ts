import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { t } from "../init.js";
import { db } from "../../db/index.js";
import { systemSettings } from "../../db/admin/settings.schema.js";
import { admins } from "../../db/admin/admin.schema.js";
import { eq } from "drizzle-orm";

const jwtSecret = process.env.JWT_SECRET;

export const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin token missing" });
  }

  if (!jwtSecret) {
    console.error("JWT_SECRET is not configured");
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Auth not configured correctly on server",
    });
  }

  // Fetch system settings for policy enforcement
  let clinical: any = {};
  try {
    const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
    clinical = settings?.clinicalConfig || {};
  } catch (err) {
    console.error("Error fetching system settings in isAuthed:", err);
  }

  // 1. Enforce Maintenance Mode
  if (clinical.maintenanceMode) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "System is in maintenance mode. Admin operations are temporarily disabled.",
    });
  }

  // 2. Verify JWT
  try {
    let payload: any;
    try {
      // DEBUG LOGS FOR USER - WARNING: EXPOSING FULL SECRET IN LOGS
      console.log(`[AUTH DEBUG] Server JWT_SECRET: ${jwtSecret}`);
      console.log(`[AUTH DEBUG] Secret Length: ${jwtSecret?.length}`);
      console.log(`[AUTH DEBUG] Token Length: ${ctx.token?.length}`);

      // Decode header to see Key ID (kid)
      try {
        const [headerB64] = ctx.token.split(".");
        const header = JSON.parse(Buffer.from(headerB64, "base64").toString("utf8"));
        console.log(`[AUTH DEBUG] Token Header (kid): ${header.kid || "NONE"}`);
      } catch (e) {
        console.warn("[AUTH DEBUG] Failed to decode header:", e);
      }

      payload = jwt.verify(ctx.token, jwtSecret) as any;
      console.log("[AUTH DEBUG] JWT verified successfully");
    } catch (e: any) {
      console.error("[AUTH DEBUG] JWT Verification Failed:", e.message);
      
      if (process.env.NODE_ENV === "production") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `Invalid or tampered token signature. Access denied. (Debug: ${e.message})`,
        });
      }
      const [, body] = ctx.token.split(".");
      payload = JSON.parse(Buffer.from(body, "base64").toString("utf8"));
    }

    const userId = payload.sub;
    if (!userId) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin token payload" });
    }

    const [admin] = await db.select().from(admins).where(eq(admins.id, userId));

    // 3. Enforce Session Timeout
    const iatTimeMs = payload.iat ? payload.iat * 1000 : 0;
    const isBrandNewToken = Date.now() - iatTimeMs < 5 * 60 * 1000;

    if (!isBrandNewToken && clinical.sessionTimeout && clinical.sessionTimeout !== "Never") {
      const timeoutMinutes = parseInt(clinical.sessionTimeout);
      if (!isNaN(timeoutMinutes) && admin?.lastActiveAt) {
        const lastActive = new Date(admin.lastActiveAt).getTime();
        const inactiveMs = Date.now() - lastActive;
        if (inactiveMs > timeoutMinutes * 60 * 1000) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Session expired due to inactivity. Please log in again.",
          });
        }
      }
    }

    // 4. Update Heartbeat
    if (userId) {
      db.update(admins).set({ lastActiveAt: new Date() }).where(eq(admins.id, userId)).catch(() => {});
    }

    // 5. Enforce Password Expiry
    if (clinical.passwordExpiry && clinical.passwordExpiry !== "Never" && admin?.passwordChangedAt) {
      const expiryDays = parseInt(clinical.passwordExpiry);
      if (!isNaN(expiryDays)) {
        const daysSinceChange = (Date.now() - new Date(admin.passwordChangedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceChange > expiryDays) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Password expired. Please reset your password." });
        }
      }
    }

    return next({
      ctx: {
        user: { id: userId, role: admin?.role ?? "user", aal: payload.aal || "aal1", amr: payload.amr || [] },
      },
    });
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Failed to verify admin session" });
  }
});
