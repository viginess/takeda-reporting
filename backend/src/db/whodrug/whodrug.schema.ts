import {
  pgTable,
  text,
  integer,
  index,
  primaryKey,
  unique,
  serial,
} from "drizzle-orm/pg-core";
import { dictionaryVersions } from "../shared/dictionary.schema.js";

// 1. Core Drug Dictionary (DD)
export const whodrugDd = pgTable("whodrug_dd", {
  rid: serial("rid").primaryKey(), // Internal Unique ID
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  drugRecordNumber: text("drug_record_number").notNull(),
  seq1: text("seq1").notNull(),
  seq2: text("seq2").notNull(),
  tradeName: text("trade_name").notNull(),
  companyId: integer("company_id"),
  countryId: integer("country_id"),
  sourceId: integer("source_id"),
}, (table) => [
    unique().on(table.drugRecordNumber, table.seq1, table.seq2, table.versionId),
    index("whodrug_dd_name_idx").on(table.tradeName),
    index("whodrug_dd_drn_seq_idx").on(table.drugRecordNumber, table.seq1),
    index("whodrug_dd_company_idx").on(table.companyId),
    index("whodrug_dd_country_idx").on(table.countryId),
    index("whodrug_dd_source_idx").on(table.sourceId),
]);

// 2. Ingredients (ING) - Master List & Mapping
export const whodrugIng = pgTable("whodrug_ing", {
  id: serial("id").primaryKey(), 
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  drugRecordNumber: text("drug_record_number").notNull(),
  seq1: text("seq1").notNull(),
  ingredientCode: text("ingredient_code").notNull(),
}, (table) => [
    unique().on(table.drugRecordNumber, table.seq1, table.ingredientCode, table.versionId),
    index("whodrug_ing_drn_seq_idx").on(table.drugRecordNumber, table.seq1),
    index("whodrug_ing_code_idx").on(table.ingredientCode),
]);

// 3. Drug-ATC Assignment (DDA)
export const whodrugDda = pgTable("whodrug_dda", {
  id: serial("id").primaryKey(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  drugRecordNumber: text("drug_record_number").notNull(),
  seq1: text("seq1").notNull(),
  atcCode: text("atc_code").notNull(),
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
}, (table) => [
    primaryKey({ columns: [table.atcCode, table.versionId] }),
    index("whodrug_ina_atc_idx").on(table.atcCode),
]);

// 5. Brand Name Alias (BNA)
export const whodrugBna = pgTable("whodrug_bna", {
  id: serial("id").primaryKey(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  drugRecordNumber: text("drug_record_number").notNull(),
  aliasName: text("alias_name").notNull(),
}, (table) => [
    unique().on(table.drugRecordNumber, table.aliasName, table.versionId),
    index("whodrug_bna_drn_idx").on(table.drugRecordNumber),
    index("whodrug_bna_name_idx").on(table.aliasName),
]);

// 6. Manufacturers (MAN)
export const whodrugMan = pgTable("whodrug_man", {
  id: serial("id").primaryKey(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  companyCode: text("company_code").notNull(),
  companyName: text("company_name").notNull(),
}, (table) => [
    unique("whodrug_man_unq").on(table.companyCode, table.versionId),
]);

// 7. Country Codes (CCODE)
export const whodrugCcode = pgTable("whodrug_ccode", {
  id: serial("id").primaryKey(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  countryCode: text("country_code").notNull(),
  countryName: text("country_name").notNull(),
}, (table) => [
    unique("whodrug_ccode_unq").on(table.countryCode, table.versionId),
]);

// 8. Data Source Registry (DDSOURCE)
export const whodrugSource = pgTable("whodrug_source", {
  id: serial("id").primaryKey(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  sourceCode: text("source_code").notNull(),
  sourceName: text("source_name").notNull(),
}, (table) => [
    unique("whodrug_source_unq").on(table.sourceCode, table.versionId),
]);
