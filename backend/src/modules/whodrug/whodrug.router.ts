import { z } from "zod";
import { router, publicProcedure } from '../../trpc/core/init.js';
import { whodrugService } from "./whodrug.service.js";
import { whodrugImportService } from "./whodrug-import.service.js";
import { db } from "../../db/core/index.js";
import { whodrugImports } from "../../db/whodrug/whodrug-import.schema.js";
import { systemSettings } from "../../db/admin/settings.schema.js";
import {
  whodrugDd,
  whodrugIng,
  whodrugDda,
  whodrugIna,
  whodrugMan
} from "../../db/whodrug/whodrug.schema.js";
import { eq, desc, and } from "drizzle-orm";
import { dictionaryVersions } from "../../db/shared/dictionary.schema.js";

/**
 * tRPC router for WHODrug Global B3 terminology operations.
 */
export const whodrugRouter = router({
  /**
   * High-performance drug search using trigram similarity.
   */
  searchDrugs: publicProcedure
    .input(z.object({
      query: z.string().min(2),
      limit: z.number().max(50).default(20),
      versionId: z.number().optional(),
      version: z.string().optional() // Keep for backward compatibility
    }))
    .query(async ({ input }) => {
      let versionId = input.versionId;
      if (!versionId && input.version) {
        // Resolve string to ID
        const [v] = await db.select({ id: dictionaryVersions.id })
          .from(dictionaryVersions)
          .where(and(eq(dictionaryVersions.name, input.version), eq(dictionaryVersions.type, 'whodrug')));
        if (v) versionId = v.id;
      }
      return await whodrugService.searchDrugs({ ...input, versionId });
    }),

  /**
   * Retrieves full details for a drug by its 8-digit regulatory code (DRN+Seq1).
   */
  getDrugDetails: publicProcedure
    .input(z.object({ 
      code: z.string(),
      versionId: z.number().optional(),
      version: z.string().optional()
    }))
    .query(async ({ input }) => {
      let versionId = input.versionId;
      if (!versionId && input.version) {
        const [v] = await db.select({ id: dictionaryVersions.id })
          .from(dictionaryVersions)
          .where(and(eq(dictionaryVersions.name, input.version), eq(dictionaryVersions.type, 'whodrug')));
        if (v) versionId = v.id;
      }
      return await whodrugService.getDrugDetails(input.code, versionId);
    }),

  /**
   * Retrieves summary statistics for the WHODrug dictionary.
   */
  getDictionaryStats: publicProcedure
    .query(async () => {
      return await whodrugService.getDictionaryStats();
    }),

  /**
   * Retrieves all dictionary versions successfully imported into the system.
   */
  getVersions: publicProcedure
    .query(async () => {
      return await whodrugService.getVersions();
    }),

  /**
   * Switches the globally active WHODrug dictionary version.
   */
  updateActiveVersion: publicProcedure
    .input(z.object({ version: z.string(), versionId: z.number().optional() }))
    .mutation(async ({ input }) => {
      const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
      if (!settings) throw new Error("System settings not found");

      let vId = input.versionId;
      if (!vId) {
        const [v] = await db.select({ id: dictionaryVersions.id })
          .from(dictionaryVersions)
          .where(and(eq(dictionaryVersions.name, input.version), eq(dictionaryVersions.type, 'whodrug')));
        vId = v?.id;
      }

      await db.update(systemSettings)
        .set({
          activeWhodrugVersionId: vId,
          clinicalConfig: {
            ...settings.clinicalConfig,
            whodrugVersion: input.version
          },
          updatedAt: new Date()
        })
        .where(eq(systemSettings.id, 1));
      
      return { success: true };
    }),

  /**
   * Initiates a background dictionary import process.
   */
  startImport: publicProcedure
    .input(z.object({ 
      version: z.string().optional(), 
      zipBase64: z.string(),
      fileName: z.string()
    }))
    .mutation(async ({ input }) => {
      // 1. Detect version from filename if not provided
      let detectedVersion = input.version;
      if (!detectedVersion) {
        // e.g., "whodrug_global_b3_mar_1_2025.zip" -> "Whodrug Global B3 Mar 1 2025"
        detectedVersion = input.fileName
          .replace(/\.zip$/i, '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, char => char.toUpperCase());
      }

      // Prevent duplicate imports if version already exists
      const [existing] = await db.select()
        .from(whodrugImports)
        .where(eq(whodrugImports.version, detectedVersion))
        .limit(1);

      if (existing && existing.status === 'COMPLETED') {
        throw new Error(`WHODrug Version ${detectedVersion} is already imported and available.`);
      }

      if (existing && existing.status === 'PROCESSING') {
        throw new Error(`WHODrug Version ${detectedVersion} is currently being processed.`);
      }

      const [job] = await db.insert(whodrugImports).values({
        version: detectedVersion,
        fileName: input.fileName,
        status: 'PROCESSING',
      }).returning();

      // Launch background process (non-blocking)
      whodrugImportService.processImport(job.id, input.zipBase64);

      return { jobId: job.id };
    }),

  /**
   * Checks the progress of an ongoing dictionary import.
   */
  getImportStatus: publicProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      const [job] = await db.select()
        .from(whodrugImports)
        .where(eq(whodrugImports.id, input.jobId))
        .limit(1);
      return job;
    }),

  /**
   * Lists the most recent import jobs.
   */
  getImportHistory: publicProcedure
    .query(async () => {
      return await db.select()
        .from(whodrugImports)
        .orderBy(desc(whodrugImports.createdAt))
        .limit(10);
    }),

  /**
   * Permanently deletes a dictionary version and all of its associated data.
   */
  deleteVersion: publicProcedure
    .input(z.object({ version: z.string() }))
    .mutation(async ({ input }) => {
      const { version } = input;
      
      const [v] = await db.select({ id: dictionaryVersions.id })
        .from(dictionaryVersions)
        .where(and(eq(dictionaryVersions.name, version), eq(dictionaryVersions.type, 'whodrug')));
      
      if (!v) return { success: false, error: "Version not found" };

      await db.transaction(async (tx) => {
        // Delete all terms associated with this versionId
        await tx.delete(whodrugDd).where(eq(whodrugDd.versionId, v.id));
        await tx.delete(whodrugIng).where(eq(whodrugIng.versionId, v.id));
        await tx.delete(whodrugDda).where(eq(whodrugDda.versionId, v.id));
        await tx.delete(whodrugIna).where(eq(whodrugIna.versionId, v.id));
        await tx.delete(whodrugMan).where(eq(whodrugMan.versionId, v.id));
        
        // Remove from lookup table and job history
        await tx.delete(dictionaryVersions).where(eq(dictionaryVersions.id, v.id));
        await tx.delete(whodrugImports).where(eq(whodrugImports.version, version));
      });
      
      return { success: true };
    }),
});
