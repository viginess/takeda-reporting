import { z } from "zod";
import { router } from '../../trpc/core/init.js';
import { viewerProcedure, adminProcedure } from '../../trpc/core/procedures.js';
import { notificationsService } from "./notifications.service.js";

export const notificationsRouter = router({
  getAll: viewerProcedure.query(async () => {
    return notificationsService.getAll();
  }),

  markAsRead: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return notificationsService.markAsRead(input.id);
    }),

  markAllAsRead: adminProcedure.mutation(async () => {
    return notificationsService.markAllAsRead();
  }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return notificationsService.delete(input.id);
    }),

  clearAll: adminProcedure.mutation(async () => {
    return notificationsService.clearAll();
  }),
});
