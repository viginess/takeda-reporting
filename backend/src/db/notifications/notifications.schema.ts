import { pgTable, serial, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(), // urgent, info, approved, system, warning
  title: text("title").notNull(),
  desc: text("desc").notNull(),
  time: varchar("time", { length: 50 }).notNull(), // e.g., "2 min ago"
  date: varchar("date", { length: 50 }).notNull(), // e.g., "Today", "Yesterday"
  read: boolean("read").default(false).notNull(),
  reportId: varchar("report_id", { length: 50 }),
  classificationReason: varchar("classification_reason", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
