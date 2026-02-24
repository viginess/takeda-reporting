import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  entity: text("entity").notNull(), // 'report', 'system_settings', etc.
  entityId: text("entity_id").notNull(),
  reportId: text("report_id"), // Kept for backward compatibility
  changedBy: text("changed_by").notNull(),
  action: text("action").notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});
