import {
  pgTable,
  text,
  integer,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

// 1. Core Drug Dictionary (DD)
export const whodrugDd = pgTable("whodrug_dd", {
  rid: text("rid").primaryKey(), // Internal Unique ID
  drugRecordNumber: text("drug_record_number").notNull(),
  seq1: text("seq1").notNull(),
  seq2: text("seq2").notNull(),
  tradeName: text("trade_name").notNull(),
  companyCode: text("company_code"),
  countryCode: text("country_code"),
  sourceCode: text("source_code"),
  whodrugVersion: text("whodrug_version").notNull(),
}, (table) => {
  return {
    nameIdx: index("whodrug_dd_name_idx").on(table.tradeName),
    drnSeqIdx: index("whodrug_dd_drn_seq_idx").on(table.drugRecordNumber, table.seq1),
    versionIdx: index("whodrug_dd_version_idx").on(table.whodrugVersion),
  };
});

// 2. Ingredients (ING) - Master List & Mapping
// According to B3 diagram, ING links to DD via DRN + Seq1
export const whodrugIng = pgTable("whodrug_ing", {
  id: text("id").primaryKey(), // Compound key or serial
  drugRecordNumber: text("drug_record_number").notNull(),
  seq1: text("seq1").notNull(),
  ingredientCode: text("ingredient_code").notNull(),
  ingredientName: text("ingredient_name"), // May be populated from external or first occurrence
  whodrugVersion: text("whodrug_version").notNull(),
}, (table) => {
  return {
    drnSeqIdx: index("whodrug_ing_drn_seq_idx").on(table.drugRecordNumber, table.seq1),
    ingCodeIdx: index("whodrug_ing_code_idx").on(table.ingredientCode),
  };
});

// 3. Drug-ATC Assignment (DDA)
export const whodrugDda = pgTable("whodrug_dda", {
  id: text("id").primaryKey(),
  drugRecordNumber: text("drug_record_number").notNull(),
  seq1: text("seq1").notNull(),
  atcCode: text("atc_code").notNull(),
  whodrugVersion: text("whodrug_version").notNull(),
}, (table) => {
  return {
    drnSeqIdx: index("whodrug_dda_drn_seq_idx").on(table.drugRecordNumber, table.seq1),
    atcIdx: index("whodrug_dda_atc_idx").on(table.atcCode),
  };
});

// 4. ATC Classification (INA)
export const whodrugIna = pgTable("whodrug_ina", {
  atcCode: text("atc_code").notNull(),
  description: text("description").notNull(),
  level: integer("level").notNull(),
  whodrugVersion: text("whodrug_version").notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.atcCode, table.whodrugVersion] }),
    atcIdx: index("whodrug_ina_atc_idx").on(table.atcCode),
  };
});

// 5. Brand Name Alias (BNA)
export const whodrugBna = pgTable("whodrug_bna", {
  id: text("id").primaryKey(),
  drugRecordNumber: text("drug_record_number").notNull(),
  aliasName: text("alias_name").notNull(),
  whodrugVersion: text("whodrug_version").notNull(),
}, (table) => {
  return {
    drnIdx: index("whodrug_bna_drn_idx").on(table.drugRecordNumber),
    nameIdx: index("whodrug_bna_name_idx").on(table.aliasName),
  };
});

// 6. Manufacturers (MAN)
export const whodrugMan = pgTable("whodrug_man", {
  companyCode: text("company_code").notNull(),
  companyName: text("company_name").notNull(),
  whodrugVersion: text("whodrug_version").notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.companyCode, table.whodrugVersion] }),
  };
});

// 7. Country Codes (CCODE)
export const whodrugCcode = pgTable("whodrug_ccode", {
  countryCode: text("country_code").notNull(),
  countryName: text("country_name").notNull(),
  whodrugVersion: text("whodrug_version").notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.countryCode, table.whodrugVersion] }),
  };
});

// 8. Data Source Registry (DDSOURCE)
export const whodrugSource = pgTable("whodrug_source", {
  sourceCode: text("source_code").notNull(),
  sourceName: text("source_name").notNull(),
  whodrugVersion: text("whodrug_version").notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.sourceCode, table.whodrugVersion] }),
  };
});
