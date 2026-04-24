import {
  pgTable,
  integer,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { dictionaryVersions } from "../shared/dictionary.schema.js";

export const systemSettings = pgTable("system_settings", {
  id: integer("id").primaryKey().default(1), // Singleton: Always 1
  activeMeddraVersionId: integer("active_meddra_version_id").references(() => dictionaryVersions.id),
  activeWhodrugVersionId: integer("active_whodrug_version_id").references(() => dictionaryVersions.id),
  
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
    alertThreshold: "All Severities",
    notifyOnApproval: true,
    emailDigest: true,
    digestFrequency: "Daily",
    smsAlerts: false,
  }),
  
  clinicalConfig: jsonb("clinical_config").$type<{
    timezone: string;
    retention: string;
    twoFA?: boolean;
    sessionTimeout: string;
    maxLoginAttempts: string;
    passwordExpiry: string;
    senderId: string;
    receiverId: string;
    meddraVersion: string;
    whodrugVersion: string;
    lockoutCooldown: string;
    
    // SMTP Configuration
    smtpHost?: string;
    smtpPort?: string;
    smtpUser?: string;
    smtpPass?: string;
    smtpFrom?: string;
  }>().notNull().default({
    timezone: "UTC+05:30 (IST)",
    retention: "24 months",

    twoFA: false,
    sessionTimeout: "60 min",
    maxLoginAttempts: "5",
    passwordExpiry: "90 days",
    senderId: "CLINSOLUTION-DEFAULT",
    receiverId: "EVHUMAN",
    meddraVersion: "29.0",
    whodrugVersion: "Global B3 March 2025",
    lockoutCooldown: "30 min",

    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPass: "",
    smtpFrom: "info@viginess.com",
  }),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by"),
});
