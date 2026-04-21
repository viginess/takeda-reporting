import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * 1. Companies Table
 * Stores verified manufacturer contact information and system registration status.
 */
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  // WHODrug company code (3-digit padding ensures standard matching)
  companyCode: text("company_code").notNull().unique(),
  // Whether the company has explicitly opted into automated notifications
  isRegistered: boolean("is_registered").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("companies_code_idx").on(table.companyCode),
  index("companies_name_idx").on(table.name),
]);

/**
 * 2. Company Notifications Table
 * Tracks the delivery status and audit trail of report emails sent to manufacturers.
 */
export const companyNotifications = pgTable("company_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id").notNull(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Delivery status: pending, sent, failed, bounced
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  
  // Timestamps for delivery milestones
  sentAt: timestamp("sent_at"),
  bouncedAt: timestamp("bounced_at"),
  
  // Stores the specific reason for failure or bounce (e.g., SMTP 550)
  lastError: text("last_error"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("notification_report_idx").on(table.reportId),
  index("notification_company_idx").on(table.companyId),
  index("notification_status_idx").on(table.status),
]);
