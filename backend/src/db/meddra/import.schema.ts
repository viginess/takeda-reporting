import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const meddraImports = pgTable("meddra_imports", {
  id: serial("id").primaryKey(),
  version: text("version").notNull(),
  fileName: text("file_name").notNull(),
  status: text("status", { enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] }).notNull().default("PENDING"),
  
  // Progress tracking
  totalRows: integer("total_rows").default(0),
  processedRows: integer("processed_rows").default(0),
  
  errorLog: text("error_log"),
  metadata: jsonb("metadata").$type<{
    fileSize: number;
    extractedFiles: string[];
    startedAt: string;
    completedAt?: string;
  }>(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: text("created_by"),
});
