import {
  pgTable,
  integer,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const systemSettings = pgTable("system_settings", {
  id: integer("id").primaryKey().default(1), // Singleton: Always 1
  defaultLanguage: text("default_language").notNull().default("English (US)"),
  
  // Storing granular settings in JSONB fields as requested/planned
  notificationThresholds: jsonb("notification_thresholds").$type<{
    urgentAlerts: boolean;
    alertThreshold: string;
    notifyOnApproval: boolean;
    emailDigest: boolean;
    digestFrequency: string;
    smsAlerts: boolean;
  }>().notNull().default({
    urgentAlerts: true,
    alertThreshold: "Critical & High",
    notifyOnApproval: true,
    emailDigest: true,
    digestFrequency: "Daily",
    smsAlerts: false,
  }),
  
  clinicalConfig: jsonb("clinical_config").$type<{
    adminEmail: string;
    timezone: string;
    retention: string;
    maintenanceMode: boolean;
    twoFA: boolean;
    sessionTimeout: string;
    maxLoginAttempts: string;
    passwordExpiry: string;
  }>().notNull().default({
    adminEmail: "admin@pharma.com",
    timezone: "UTC+05:30 (IST)",
    retention: "24 months",
    maintenanceMode: false,
    twoFA: false,
    sessionTimeout: "60 min",
    maxLoginAttempts: "5",
    passwordExpiry: "90 days",
  }),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by"),
});
