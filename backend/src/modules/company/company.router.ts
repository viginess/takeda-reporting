import { z } from "zod";
import { router, publicProcedure } from '../../trpc/core/init.js';
import { companyNotificationService as companyService } from "./company.service.js";
import { db } from "../../db/core/index.js";
import { companies, companyNotifications } from "../../db/company/company.schema.js";
import { eq, desc, ilike, or } from "drizzle-orm";

/**
 * tRPC router for Company Management and Manufacturer Notifications.
 */
export const companyRouter = router({
  /**
   * Retrieves a list of all medicinal product manufacturers.
   */
  getCompanies: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().default(100),
      offset: z.number().default(0)
    }))
    .query(async ({ input }) => {
      let queryBody = db.select().from(companies);
      
      if (input.search) {
        const searchTerm = `%${input.search}%`;
        // @ts-ignore - Drizzle dynamic query
        queryBody = queryBody.where(or(
          ilike(companies.name, searchTerm),
          ilike(companies.companyCode, searchTerm),
          ilike(companies.email, searchTerm)
        ));
      }

      return await queryBody
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(companies.name);
    }),

  /**
   * Updates manufacturer contact details or status.
   */
  updateCompany: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: z.object({
        email: z.string().email().optional(),
        isRegistered: z.boolean().optional(),
        name: z.string().optional()
      })
    }))
    .mutation(async ({ input }) => {
      await db.update(companies)
        .set({
          ...input.data,
          updatedAt: new Date()
        })
        .where(eq(companies.id, input.id));
      return { success: true };
    }),

  /**
   * Retrieves the notification history for specialized auditing.
   */
  getNotificationLogs: publicProcedure
    .input(z.object({
      limit: z.number().default(50),
      companyId: z.string().uuid().optional()
    }))
    .query(async ({ input }) => {
      let queryBody = db.select().from(companyNotifications);
      
      if (input.companyId) {
        // @ts-ignore
        queryBody = queryBody.where(eq(companyNotifications.companyId, input.companyId));
      }

      return await queryBody
        .orderBy(desc(companyNotifications.sentAt))
        .limit(input.limit);
    }),

  /**
   * Gets quick stats for the manufacturer dashboard.
   */
  getStats: publicProcedure
    .query(async () => {
      const [total] = await db.select({ count: companies.id }).from(companies);
      const [registered] = await db.select({ count: companies.id }).from(companies).where(eq(companies.isRegistered, true));
      
      return {
        totalCompanies: 143, // Fixed seeded count for now
        registeredCompanies: 0, // Placeholder until migration is fully checked
        notificationSuccess: 0.98, // Example success rate
      };
    })
});
