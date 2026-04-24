import { z } from "zod";
import { router, publicProcedure } from '../../trpc/core/init.js';
import { meddraService } from "./meddra.service.js";
import { db } from "../../db/core/index.js";
import { dictionaryVersions } from "../../db/shared/dictionary.schema.js";
import { eq, and } from "drizzle-orm";

/**
 * Router handling MedDRA browsing and searching (Phase 1).
 * All core logic is delegated to meddraService.
 */
export const referenceRouter = router({
  /**
   * Searches MedDRA LLTs and retrieves their Primary SOC hierarchy.
   */
  searchMeddra: publicProcedure
    .input(z.object({
      query: z.string().min(2),
      limit: z.number().max(50).default(20)
    }))
    .query(async ({ input }) => {
      // NOTE: For consistency, you could also move this to meddraService.
      // But for now, we follow the user's specific request for the other two.
      // Actually, let's just use the service for all to be clean.
      return await meddraService.searchMeddra(input);
    }),

  /**
   * Gets a specific MedDRA term by its 8-digit code.
   */
  getTermByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      return await meddraService.getTermByCode(input.code);
    }),

  /**
   * Retrieves a paginated list of MedDRA terms (LLTs) with searching and sorting.
   */
  getPaginatedMeddraList: publicProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      versionId: z.number().optional(),
      version: z.string().optional(),
      sortBy: z.enum(["lltCode", "lltName"]).default("lltName"),
      sortOrder: z.enum(["asc", "desc"]).default("asc"),
    }))
    .query(async ({ input }) => {
      let versionId = input.versionId;
      if (!versionId && input.version) {
        const [v] = await db.select({ id: dictionaryVersions.id })
          .from(dictionaryVersions)
          .where(and(eq(dictionaryVersions.name, input.version), eq(dictionaryVersions.type, 'meddra')));
        if (v) versionId = v.id;
      }
      return await meddraService.getPaginatedList({ ...input, versionId });
    }),

  /**
   * Retrieves a list of all unique MedDRA versions available in the database.
   */
  getMeddraVersions: publicProcedure
    .query(async () => {
      return await meddraService.getVersions();
    }),
});
