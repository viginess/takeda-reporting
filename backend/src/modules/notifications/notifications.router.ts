import { z } from "zod";
import { router, publicProcedure } from '../../trpc/core/init.js';
import { notificationsService } from "./notifications.service.js";

export const notificationsRouter = router({
  getAll: publicProcedure.query(async () => {
    return notificationsService.getAll();
  }),

  markAsRead: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return notificationsService.markAsRead(input.id);
    }),

  markAllAsRead: publicProcedure.mutation(async () => {
    return notificationsService.markAllAsRead();
  }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return notificationsService.delete(input.id);
    }),

  clearAll: publicProcedure.mutation(async () => {
    return notificationsService.clearAll();
  }),
});
