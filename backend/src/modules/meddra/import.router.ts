import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from '../../trpc/core/init.js';
import { adminProcedure } from '../../trpc/core/procedures.js';
import { db } from '../../db/core/index.js';
import { meddraImports } from "../../db/meddra/import.schema.js";
import { desc, eq } from "drizzle-orm";
import { meddraService } from "./meddra.service.js";

/**
 * Router handling MedDRA ZIP imports and job tracking 
 */
export const importRouter = router({
  /**
   * Retrieves the history of MedDRA imports.
   */
  getImportHistory: adminProcedure
    .query(async () => {
      return await db.select()
        .from(meddraImports)
        .orderBy(desc(meddraImports.createdAt))
        .limit(10);
    }),

  /**
   * Retrieves the status of a specific MedDRA import job.
   */
  getMeddraImportStatus: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [job] = await db.select()
        .from(meddraImports)
        .where(eq(meddraImports.id, input.id))
        .limit(1);
      return job;
    }),

  /**
   * Imports MedDRA data from a ZIP file containing ASCII files (.asc).
   */
  importMeddraFromZip: adminProcedure
    .input(z.object({
      version: z.string().optional(),
      zipBase64: z.string().min(1),
      fileName: z.string().optional().default("meddra_upload.zip"),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Detect version from filename if not provided
      let detectedVersion = input.version;
      if (!detectedVersion) {
        const match = input.fileName.match(/v?(\d+\.\d+)/i) || input.fileName.match(/v?(\d+)/i);
        detectedVersion = match ? match[1] : "Unknown";
      }

      // 2. Prevent duplicate imports if version already exists
      const [existing] = await db.select()
        .from(meddraImports)
        .where(eq(meddraImports.version, detectedVersion))
        .limit(1);

      if (existing && existing.status === "COMPLETED") {
        throw new TRPCError({ 
          code: "CONFLICT", 
          message: `MedDRA Version ${detectedVersion} is already imported and available.` 
        });
      }

      if (existing && existing.status === "PROCESSING") {
        throw new TRPCError({ 
          code: "CONFLICT", 
          message: `MedDRA Version ${detectedVersion} is currently being processed.` 
        });
      }

      const [importJob] = await db.insert(meddraImports).values({
        version: detectedVersion,
        fileName: input.fileName,
        status: "PROCESSING",
        createdBy: ctx.user?.email || "Admin",
      }).returning();

      if (!importJob) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create import job" });
      }

      // Background processing via Service
      meddraService.processMeddraImport(importJob.id, input.zipBase64).catch(err => {
        console.error("Background MedDRA Import failed early:", err);
      });

      return { id: importJob.id, status: "PROCESSING" };
    }),
});
