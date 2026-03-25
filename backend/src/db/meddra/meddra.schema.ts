import {
  pgTable,
  text,
  integer,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

// 1. Core Terminology Tables

export const meddraSoc = pgTable("meddra_soc", {
  socCode: integer("soc_code").primaryKey(),
  socName: text("soc_name").notNull(),
  socAbbrev: text("soc_abbrev"),
  meddraVersion: text("meddra_version").notNull(),
}, (table) => {
  return {
    nameIdx: index("meddra_soc_name_idx").on(table.socName),
    versionIdx: index("meddra_soc_version_idx").on(table.meddraVersion),
  };
});

export const meddraHlgt = pgTable("meddra_hlgt", {
  hlgtCode: integer("hlgt_code").primaryKey(),
  hlgtName: text("hlgt_name").notNull(),
  meddraVersion: text("meddra_version").notNull(),
}, (table) => {
  return {
    nameIdx: index("meddra_hlgt_name_idx").on(table.hlgtName),
    versionIdx: index("meddra_hlgt_version_idx").on(table.meddraVersion),
  };
});

export const meddraHlt = pgTable("meddra_hlt", {
  hltCode: integer("hlt_code").primaryKey(),
  hltName: text("hlt_name").notNull(),
  meddraVersion: text("meddra_version").notNull(),
}, (table) => {
  return {
    nameIdx: index("meddra_hlt_name_idx").on(table.hltName),
    versionIdx: index("meddra_hlt_version_idx").on(table.meddraVersion),
  };
});

export const meddraPt = pgTable("meddra_pt", {
  ptCode: integer("pt_code").primaryKey(),
  ptName: text("pt_name").notNull(),
  ptSocCode: integer("pt_soc_code"), // Primary SOC
  meddraVersion: text("meddra_version").notNull(),
}, (table) => {
  return {
    nameIdx: index("meddra_pt_name_idx").on(table.ptName),
    versionIdx: index("meddra_pt_version_idx").on(table.meddraVersion),
  };
});

export const meddraLlt = pgTable("meddra_llt", {
  lltCode: integer("llt_code").primaryKey(),
  lltName: text("llt_name").notNull(),
  ptCode: integer("pt_code").notNull(),
  lltCurrency: text("llt_currency"), // Y/N
  meddraVersion: text("meddra_version").notNull(),
}, (table) => {
  return {
    nameIdx: index("meddra_llt_name_idx").on(table.lltName),
    ptCodeIdx: index("meddra_llt_pt_idx").on(table.ptCode),
    versionIdx: index("meddra_llt_version_idx").on(table.meddraVersion),
  };
});

// 2. Composition (Link) Tables

export const meddraSocHlgt = pgTable("meddra_soc_hlgt", {
  socCode: integer("soc_code").notNull(),
  hlgtCode: integer("hlgt_code").notNull(),
  meddraVersion: text("meddra_version").notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.socCode, table.hlgtCode, table.meddraVersion] }),
  };
});

export const meddraHlgtHlt = pgTable("meddra_hlgt_hlt", {
  hlgtCode: integer("hlgt_code").notNull(),
  hltCode: integer("hlt_code").notNull(),
  meddraVersion: text("meddra_version").notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.hlgtCode, table.hltCode, table.meddraVersion] }),
  };
});

export const meddraHltPt = pgTable("meddra_hlt_pt", {
  hltCode: integer("hlt_code").notNull(),
  ptCode: integer("pt_code").notNull(),
  meddraVersion: text("meddra_version").notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.hltCode, table.ptCode, table.meddraVersion] }),
  };
});

export const meddraSocIntlOrder = pgTable("meddra_soc_intl_order", {
  socCode: integer("soc_code").notNull(),
  intlOrdCode: integer("intl_ord_code").notNull(),
  meddraVersion: text("meddra_version").notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.socCode, table.meddraVersion] }),
  };
});

// 3. SMQ Tables

export const meddraSmqList = pgTable("meddra_smq_list", {
  smqCode: integer("smq_code").primaryKey(),
  smqName: text("smq_name").notNull(),
  smqLevel: integer("smq_level").notNull(),
  smqDescription: text("smq_description"),
  smqSource: text("smq_source"),
  smqNote: text("smq_note"),
  meddraVersion: text("meddra_version").notNull(),
  status: text("status"), // A/I
  smqAlgorithm: text("smq_algorithm"),
}, (table) => {
  return {
    nameIdx: index("meddra_smq_name_idx").on(table.smqName),
  };
});

export const meddraSmqContent = pgTable("meddra_smq_content", {
  smqCode: integer("smq_code").notNull(),
  termCode: integer("term_code").notNull(),
  termLevel: integer("term_level").notNull(), // 4=PT, 5=LLT, 0=SMQ
  termScope: integer("term_scope"), // 1=Broad, 2=Narrow
  termCategory: text("term_category"),
  termWeight: integer("term_weight"),
  termStatus: text("term_status"), // A/I
  meddraVersion: text("meddra_version").notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.smqCode, table.termCode, table.meddraVersion] }),
  };
});

// 4. Denormalized Hierarchy Table (for optimized search)

export const meddraMdhier = pgTable("meddra_mdhier", {
  ptCode: integer("pt_code").notNull(),
  hltCode: integer("hlt_code").notNull(),
  hlgtCode: integer("hlgt_code").notNull(),
  socCode: integer("soc_code").notNull(),
  ptName: text("pt_name").notNull(),
  hltName: text("hlt_name").notNull(),
  hlgtName: text("hlgt_name").notNull(),
  socName: text("soc_name").notNull(),
  socAbbrev: text("soc_abbrev"),
  ptSocCode: integer("pt_soc_code"),
  primarySocFg: text("primary_soc_fg"), // Y/N
  meddraVersion: text("meddra_version").notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.ptCode, table.hltCode, table.hlgtCode, table.socCode, table.meddraVersion] }),
    ptNameIdx: index("meddra_hier_pt_name_idx").on(table.ptName),
    ptCodeIdx: index("meddra_hier_pt_code_idx").on(table.ptCode),
  };
});
