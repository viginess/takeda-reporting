import { z } from "zod";
import { router, publicProcedure } from "../../trpc/init.js";
import { db } from "../../db/index.js";
import { notifications } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

export const notificationsRouter = router({
  getAll: publicProcedure.query(async () => {
    return db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }),

  markAsRead: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, input.id))
        .returning();
      return updated;
    }),

  markAllAsRead: publicProcedure.mutation(async () => {
    await db.update(notifications).set({ read: true });
    return { success: true };
  }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [deleted] = await db
        .delete(notifications)
        .where(eq(notifications.id, input.id))
        .returning();
      return deleted;
    }),

  clearAll: publicProcedure.mutation(async () => {
    await db.delete(notifications);
    return { success: true };
  }),
});
