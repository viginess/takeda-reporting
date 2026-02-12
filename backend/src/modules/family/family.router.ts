import { z } from "zod";
import { router, publicProcedure } from "../../trpc/trpc.js";

export const familyRouter = router({
  create: publicProcedure
    .input(z.any())
    .mutation(({ input: _input }) => {
      // TODO: Implement logic
      return { success: true };
    }),
});
