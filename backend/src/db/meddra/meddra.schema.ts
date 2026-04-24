import {
  pgTable,
  text,
  integer,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { dictionaryVersions } from "../shared/dictionary.schema.js";

// 1. Core Terminology Tables

export const meddraSoc = pgTable("meddra_soc", {
  socCode: integer("soc_code").primaryKey(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  socName: text("soc_name").notNull(),
  socAbbrev: text("soc_abbrev"),
  meddraVersion: text("meddra_version"),
}, (table) => [
    index("meddra_soc_name_idx").on(table.socName),
]);

export const meddraHlgt = pgTable("meddra_hlgt", {
  hlgtCode: integer("hlgt_code").primaryKey(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  hlgtName: text("hlgt_name").notNull(),
  meddraVersion: text("meddra_version"),
}, (table) => [
    index("meddra_hlgt_name_idx").on(table.hlgtName),
]);

export const meddraHlt = pgTable("meddra_hlt", {
  hltCode: integer("hlt_code").primaryKey(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  hltName: text("hlt_name").notNull(),
  meddraVersion: text("meddra_version"),
}, (table) => [
    index("meddra_hlt_name_idx").on(table.hltName),
]);

export const meddraPt = pgTable("meddra_pt", {
  ptCode: integer("pt_code").primaryKey(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  ptName: text("pt_name").notNull(),
  ptSocCode: integer("pt_soc_code"), // Primary SOC
  meddraVersion: text("meddra_version"),
}, (table) => [
    index("meddra_pt_name_idx").on(table.ptName),
]);

export const meddraLlt = pgTable("meddra_llt", {
  lltCode: integer("llt_code").primaryKey(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  lltName: text("llt_name").notNull(),
  ptCode: integer("pt_code").notNull(),
  lltCurrency: text("llt_currency"), // Y/N
  meddraVersion: text("meddra_version"),
}, (table) => [
    index("meddra_llt_name_idx").on(table.lltName),
    index("meddra_llt_pt_idx").on(table.ptCode),
]);

// 2. Composition (Link) Tables

export const meddraSocHlgt = pgTable("meddra_soc_hlgt", {
  socCode: integer("soc_code").notNull(),
  hlgtCode: integer("hlgt_code").notNull(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  meddraVersion: text("meddra_version"),
}, (table) => [
    primaryKey({ columns: [table.socCode, table.hlgtCode, table.versionId] }),
]);

export const meddraHlgtHlt = pgTable("meddra_hlgt_hlt", {
  hlgtCode: integer("hlgt_code").notNull(),
  hltCode: integer("hlt_code").notNull(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  meddraVersion: text("meddra_version"),
}, (table) => [
    primaryKey({ columns: [table.hlgtCode, table.hltCode, table.versionId] }),
]);

export const meddraHltPt = pgTable("meddra_hlt_pt", {
  hltCode: integer("hlt_code").notNull(),
  ptCode: integer("pt_code").notNull(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  meddraVersion: text("meddra_version"),
}, (table) => [
    primaryKey({ columns: [table.hltCode, table.ptCode, table.versionId] }),
]);

export const meddraSocIntlOrder = pgTable("meddra_soc_intl_order", {
  socCode: integer("soc_code").notNull(),
  intlOrdCode: integer("intl_ord_code").notNull(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  meddraVersion: text("meddra_version"),
}, (table) => [
    primaryKey({ columns: [table.socCode, table.versionId] }),
]);

// 3. SMQ Tables

export const meddraSmqList = pgTable("meddra_smq_list", {
  smqCode: integer("smq_code").primaryKey(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  smqName: text("smq_name").notNull(),
  smqLevel: integer("smq_level").notNull(),
  smqDescription: text("smq_description"),
  smqSource: text("smq_source"),
  smqNote: text("smq_note"),
  meddraVersion: text("meddra_version"),
  status: text("status"), // A/I
  smqAlgorithm: text("smq_algorithm"),
}, (table) => [
    index("meddra_smq_name_idx").on(table.smqName),
]);

export const meddraSmqContent = pgTable("meddra_smq_content", {
  smqCode: integer("smq_code").notNull(),
  termCode: integer("term_code").notNull(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  termLevel: integer("term_level").notNull(), // 4=PT, 5=LLT, 0=SMQ
  termScope: integer("term_scope"), // 1=Broad, 2=Narrow
  termCategory: text("term_category"),
  termWeight: integer("term_weight"),
  termStatus: text("term_status"), // A/I
  meddraVersion: text("meddra_version"),
}, (table) => [
    primaryKey({ columns: [table.smqCode, table.termCode, table.versionId] }),
]);

// 4. Denormalized Hierarchy Table (for optimized search)

export const meddraMdhier = pgTable("meddra_mdhier", {
  ptCode: integer("pt_code").notNull(),
  hltCode: integer("hlt_code").notNull(),
  hlgtCode: integer("hlgt_code").notNull(),
  socCode: integer("soc_code").notNull(),
  versionId: integer("version_id").references(() => dictionaryVersions.id),
  ptName: text("pt_name").notNull(),
  hltName: text("hlt_name").notNull(),
  hlgtName: text("hlgt_name").notNull(),
  socName: text("soc_name").notNull(),
  socAbbrev: text("soc_abbrev"),
  ptSocCode: integer("pt_soc_code"),
  primarySocFg: text("primary_soc_fg"), // Y/N
  meddraVersion: text("meddra_version"),
}, (table) => [
    primaryKey({ columns: [table.ptCode, table.hltCode, table.hlgtCode, table.socCode, table.versionId] }),
    index("meddra_hier_pt_name_idx").on(table.ptName),
    index("meddra_hier_pt_code_idx").on(table.ptCode),
]);
