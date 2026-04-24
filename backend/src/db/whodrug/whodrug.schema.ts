import {
  pgTable,
  text,
  integer,
  index,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";
import { dictionaryVersions } from "../shared/dictionary.schema.js";

// 1. Core Drug Dictionary (DD)
export const whodrugDd = pgTable("whodrug_dd", {
  rid: text("rid").primaryKey(), // Internal Unique ID
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  drugRecordNumber: text("drug_record_number").notNull(),
  seq1: text("seq1").notNull(),
  seq2: text("seq2").notNull(),
  tradeName: text("trade_name").notNull(),
  companyCode: text("company_code"),
  countryCode: text("country_code"),
  sourceCode: text("source_code"),
  whodrugVersion: text("whodrug_version"), // Marked optional before physical drop or for transitional support if needed
}, (table) => [
    unique().on(table.drugRecordNumber, table.seq1, table.seq2, table.versionId),
    index("whodrug_dd_name_idx").on(table.tradeName),
    index("whodrug_dd_drn_seq_idx").on(table.drugRecordNumber, table.seq1),
]);

// 2. Ingredients (ING) - Master List & Mapping
export const whodrugIng = pgTable("whodrug_ing", {
  id: text("id").primaryKey(), 
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  drugRecordNumber: text("drug_record_number").notNull(),
  seq1: text("seq1").notNull(),
  ingredientCode: text("ingredient_code").notNull(),
  ingredientName: text("ingredient_name"), 
  whodrugVersion: text("whodrug_version"),
}, (table) => [
    unique().on(table.drugRecordNumber, table.seq1, table.ingredientCode, table.versionId),
    index("whodrug_ing_drn_seq_idx").on(table.drugRecordNumber, table.seq1),
    index("whodrug_ing_code_idx").on(table.ingredientCode),
]);

// 3. Drug-ATC Assignment (DDA)
export const whodrugDda = pgTable("whodrug_dda", {
  id: text("id").primaryKey(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  drugRecordNumber: text("drug_record_number").notNull(),
  seq1: text("seq1").notNull(),
  atcCode: text("atc_code").notNull(),
  whodrugVersion: text("whodrug_version"),
}, (table) => [
    unique().on(table.drugRecordNumber, table.seq1, table.atcCode, table.versionId),
    index("whodrug_dda_drn_seq_idx").on(table.drugRecordNumber, table.seq1),
    index("whodrug_dda_atc_idx").on(table.atcCode),
]);

// 4. ATC Classification (INA)
export const whodrugIna = pgTable("whodrug_ina", {
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  atcCode: text("atc_code").notNull(),
  description: text("description").notNull(),
  level: integer("level").notNull(),
  whodrugVersion: text("whodrug_version"),
}, (table) => [
    primaryKey({ columns: [table.atcCode, table.versionId] }),
    index("whodrug_ina_atc_idx").on(table.atcCode),
]);

// 5. Brand Name Alias (BNA)
export const whodrugBna = pgTable("whodrug_bna", {
  id: text("id").primaryKey(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  drugRecordNumber: text("drug_record_number").notNull(),
  aliasName: text("alias_name").notNull(),
  whodrugVersion: text("whodrug_version"),
}, (table) => [
    unique().on(table.drugRecordNumber, table.aliasName, table.versionId),
    index("whodrug_bna_drn_idx").on(table.drugRecordNumber),
    index("whodrug_bna_name_idx").on(table.aliasName),
]);

// 6. Manufacturers (MAN)
export const whodrugMan = pgTable("whodrug_man", {
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  companyCode: text("company_code").notNull(),
  companyName: text("company_name").notNull(),
  whodrugVersion: text("whodrug_version"),
}, (table) => [
    primaryKey({ columns: [table.companyCode, table.versionId] }),
]);

// 7. Country Codes (CCODE)
export const whodrugCcode = pgTable("whodrug_ccode", {
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  countryCode: text("country_code").notNull(),
  countryName: text("country_name").notNull(),
  whodrugVersion: text("whodrug_version"),
}, (table) => [
    primaryKey({ columns: [table.countryCode, table.versionId] }),
]);

// 8. Data Source Registry (DDSOURCE)
export const whodrugSource = pgTable("whodrug_source", {
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  sourceCode: text("source_code").notNull(),
  sourceName: text("source_name").notNull(),
  whodrugVersion: text("whodrug_version"),
}, (table) => [
    primaryKey({ columns: [table.sourceCode, table.versionId] }),
]);
