import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "../db/index.js";
import { systemSettings } from "../db/admin/settings.schema.js";

/**
 * Checks if the system is currently in maintenance mode.
 * Throws a TRPCError if maintenance mode is enabled.
 */
export async function assertNoMaintenance() {
  const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
  
  if (settings?.clinicalConfig?.maintenanceMode) {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "The system is currently undergoing maintenance. Please try again later.",
    });
  }
}
