import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

/**
 * Lookup table to store distinct versions of dictionaries (MedDRA, WHODrug, etc.)
 * This allows us to use small integer IDs in the main data tables instead of
 * repeating the same version strings millions of times.
 */
export const dictionaryVersions = pgTable("dictionary_versions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g. "GLOBALB3Mar25", "29.0"
  type: text("type").notNull(), // e.g. "whodrug", "meddra"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
