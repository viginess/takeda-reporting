import { TRPCError } from "@trpc/server";
import { t } from "../init.js";

export const requiresRole = (roles: ("super_admin" | "admin" | "viewer")[]) => t.middleware(async ({ ctx, next }) => {
  const user = (ctx as any).user;
  const userRole = user?.role || "admin";
  if (!user || !roles.includes(userRole)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
  }
  return next();
});
