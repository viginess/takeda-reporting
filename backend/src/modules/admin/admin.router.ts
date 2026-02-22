import { z } from "zod";
import { router, publicProcedure } from "../../trpc/trpc.js";
import { db } from "../../db/index.js";
import { admins } from "../../db/schema.js";

export const adminRouter = router({
  syncProfile: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      // Use onConflictDoNothing to avoid errors if the record already exists
      const [row] = await db
        .insert(admins)
        .values({
          id: input.id,
          email: input.email,
        })
        .onConflictDoNothing()
        .returning();

      return { success: true, data: row };
    }),
});
