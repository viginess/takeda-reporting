import { z } from "zod";
import { router, publicProcedure } from "../../trpc/trpc.js";

export const hcpRouter = router({
  create: publicProcedure
    .input(z.any())
    .mutation(({ input: _input }) => {
      // TODO: Implement logic
      return { success: true };
    }),
});
