import { router, publicProcedure } from "../trpc.js";
import { z } from "zod";

export const appRouter = router({
  health: publicProcedure.query(() => {
    return { status: "ok", timestamp: new Date() };
  }),
  greeting: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => {
      const name = input.name || "World";
      return { text: `Hello ${name}` };
    }),
});

export type AppRouter = typeof appRouter;
