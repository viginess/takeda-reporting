import {
  pgTable,
  uuid,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const archivedReports = pgTable("archived_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  referenceId: text("reference_id").notNull(),
  reporterType: text("reporter_type").notNull(), // 'Patient', 'HCP', 'Family'
  storagePath: text("storage_path").notNull(),
  archivedAt: timestamp("archived_at").defaultNow().notNull(),
});
