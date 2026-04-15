import { z } from "zod";
import { router, publicProcedure } from '../../trpc/core/init.js';
import { whodrugService } from "./whodrug.service.js";

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
      limit: z.number().max(50).default(20)
    }))
    .query(async ({ input }) => {
      return await whodrugService.searchDrugs(input);
    }),

  /**
   * Retrieves full details for a drug by its 8-digit regulatory code (DRN+Seq1).
   */
  getDrugDetails: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      return await whodrugService.getDrugDetails(input.code);
    }),

  /**
   * Retrieves summary statistics for the WHODrug dictionary.
   */
  getDictionaryStats: publicProcedure
    .query(async () => {
      return await whodrugService.getDictionaryStats();
    }),
});
