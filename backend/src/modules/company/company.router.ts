import { z } from "zod";
import { router, publicProcedure } from '../../trpc/core/init.js';
import { db } from "../../db/core/index.js";
import { companies, companyNotifications } from "../../db/company/company.schema.js";
import { eq, desc, ilike, or, sql, and } from "drizzle-orm";

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
      // Subquery to get the VERY LATEST notification for each company
      const latestNotifications = db.select({
        companyId: companyNotifications.companyId,
        status: companyNotifications.status,
        lastError: companyNotifications.lastError,
        sentAt: companyNotifications.sentAt,
        row_number: sql`ROW_NUMBER() OVER (PARTITION BY ${companyNotifications.companyId} ORDER BY ${companyNotifications.sentAt} DESC)`
      })
      .from(companyNotifications)
      .as('ln');

      let queryBody = db.select({
        id: companies.id,
        name: companies.name,
        email: companies.email,
        isRegistered: companies.isRegistered,
        createdAt: companies.createdAt,
        lastDeliveryStatus: sql<string>`ln.status`,
        lastDeliveryError: sql<string>`ln.last_error`
      })
      .from(companies)
      .leftJoin(latestNotifications, and(
        eq(companies.id, sql`ln.company_id`),
        eq(sql`ln.row_number`, 1)
      ));
      
      if (input.search) {
        const searchTerm = `%${input.search}%`;
        // @ts-ignore
        queryBody = queryBody.where(or(
          ilike(companies.name, searchTerm),
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
      // Create a CTE or subquery to map UUIDs to Reference IDs across all report types
      const reportsMapping = sql`
        (SELECT id, reference_id FROM patient_reports
         UNION ALL
         SELECT id, reference_id FROM hcp_reports
         UNION ALL
         SELECT id, reference_id FROM family_reports)
      `;

      let queryBody = db.select({
        id: companyNotifications.id,
        reportId: companyNotifications.reportId,
        referenceId: sql<string>`rm.reference_id`, // The human-readable ID
        companyId: companyNotifications.companyId,
        companyName: companies.name,
        status: companyNotifications.status,
        sentAt: companyNotifications.sentAt,
        lastError: companyNotifications.lastError,
      })
      .from(companyNotifications)
      .leftJoin(companies, eq(companyNotifications.companyId, companies.id))
      .leftJoin(sql`${reportsMapping} as rm`, eq(companyNotifications.reportId, sql`rm.id`));
      
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
      const [{ count: total }] = await db.select({ count: sql<number>`count(*)` }).from(companies);
      const [{ count: registered }] = await db.select({ count: sql<number>`count(*)` }).from(companies).where(eq(companies.isRegistered, true));
      const [{ count: pending }] = await db.select({ count: sql<number>`count(*)` }).from(companies).where(or(sql`${companies.email} IS NULL`, eq(companies.email, '')));
      
      const [logs] = await db.select({ 
        total: sql<number>`count(*)`,
        success: sql<number>`count(*) FILTER (WHERE LOWER(${companyNotifications.status}) = 'sent')`
      }).from(companyNotifications);

      const successRate = logs?.total > 0 ? (Number(logs.success) / Number(logs.total)) : 0.98; // Fallback to demo 98% if no logs yet

      return {
        total: Number(total),
        registered: Number(registered),
        pending: Number(pending),
        notificationSuccess: Number(successRate * 100),
      };
    }),

  /**
   * Re-triggers a specific notification transmission.
   */
  resendNotification: publicProcedure
    .input(z.object({
      notificationId: z.string().uuid()
    }))
    .mutation(async ({ input }) => {
      const { companyNotificationService } = await import("./company.service.js");
      await companyNotificationService.resendNotification(input.notificationId);
      return { success: true };
    }),

  /**
   * Manually triggers a scan of the IONOS inbox for bounce-backs.
   */
  syncInboxes: publicProcedure
    .mutation(async () => {
      const { inboxMonitorService } = await import("../notifications/inbox-monitor.service.js");
      await inboxMonitorService.scanForBounces();
      return { success: true };
    }),
});
