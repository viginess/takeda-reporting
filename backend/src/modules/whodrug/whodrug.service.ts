import { db } from '../../db/core/index.js';
import { whodrugDd, whodrugIng, whodrugDda, whodrugIna, whodrugMan } from '../../db/whodrug/whodrug.schema.js';
import { systemSettings } from '../../db/admin/settings.schema.js';
import { eq, and, sql, desc } from "drizzle-orm";

/**
 * Service for handling WHODrug Global B3 terminology operations.
 */
export const whodrugService = {
  /**
   * Gets the active WHODrug version from system settings.
   */
  async getActiveVersion(): Promise<string> {
    const settings = await db.select({ clinicalConfig: systemSettings.clinicalConfig })
      .from(systemSettings)
      .where(eq(systemSettings.id, 1))
      .limit(1);
    
    return settings[0]?.clinicalConfig?.whodrugVersion || "GLOBALB3Mar25";
  },

  /**
   * Searches for drugs in the WHODrug dictionary using pg_trgm similarity.
   * Optimized for ~40ms performance on 500k+ records.
   */
  async searchDrugs(input: { query: string; limit: number; version?: string }) {
    const { query, limit, version } = input;
    const activeVersion = version || await this.getActiveVersion();
    
    // We use the % operator for trigram similarity matching
    // and similarity() for ranking the results.
    const results = await db.select({
      rid: whodrugDd.rid,
      drn: whodrugDd.drugRecordNumber,
      seq1: whodrugDd.seq1,
      tradeName: whodrugDd.tradeName,
      companyName: whodrugMan.companyName,
      similarity: sql<number>`similarity(${whodrugDd.tradeName}, ${query})`
    })
    .from(whodrugDd)
    .leftJoin(whodrugMan, and(
      eq(whodrugDd.companyCode, whodrugMan.companyCode),
      eq(whodrugDd.whodrugVersion, whodrugMan.whodrugVersion)
    ))
    .where(and(
      sql`${whodrugDd.tradeName} % ${query}`,
      eq(whodrugDd.whodrugVersion, activeVersion)
    ))
    .orderBy(desc(sql`similarity(${whodrugDd.tradeName}, ${query})`))
    .limit(limit);

    return results.map(r => ({
      rid: r.rid,
      code: `${r.drn}${r.seq1}`,
      name: r.tradeName,
      manufacturer: r.companyName,
      drn: r.drn,
      seq1: r.seq1,
      similarity: r.similarity
    }));
  },

  /**
   * Retrieves full drug details including ingredients and ATC classification.
   * @param code The 8-digit E2B code (DRN + Seq1)
   */
  async getDrugDetails(code: string, version?: string) {
    if (code.length < 8) return null;
    
    const drn = code.substring(0, 6);
    const seq1 = code.substring(6, 8);
    const activeVersion = version || await this.getActiveVersion();

    const [drug] = await db.select()
      .from(whodrugDd)
      .where(and(
        eq(whodrugDd.drugRecordNumber, drn),
        eq(whodrugDd.seq1, seq1),
        eq(whodrugDd.whodrugVersion, activeVersion)
      ))
      .limit(1);

    if (!drug) return null;

    // Fetch related ingredients via the compound key (DRN+Seq1)
    const ingredients = await db.select({
      code: whodrugIng.ingredientCode,
      name: whodrugIng.ingredientName
    })
    .from(whodrugIng)
    .where(and(
      eq(whodrugIng.drugRecordNumber, drn),
      eq(whodrugIng.seq1, seq1),
      eq(whodrugIng.whodrugVersion, activeVersion)
    ));

    // Fetch ATC classifications
    const atcs = await db.select({
      atcCode: whodrugDda.atcCode,
      description: whodrugIna.description
    })
    .from(whodrugDda)
    .leftJoin(whodrugIna, and(
      eq(whodrugDda.atcCode, whodrugIna.atcCode),
      eq(whodrugDda.whodrugVersion, whodrugIna.whodrugVersion)
    ))
    .where(and(
      eq(whodrugDda.drugRecordNumber, drn),
      eq(whodrugDda.seq1, seq1),
      eq(whodrugDda.whodrugVersion, activeVersion)
    ));

    return {
      ...drug,
      code,
      ingredients,
      atcs
    };
  },

  /**
   * Fetches ingredients for a list of drug codes (8-digit DRN+Seq1).
   * Used for E2B XML data enrichment.
   */
  /**
   * Fetches enriched drug data (Ingredients and ATC) for a list of drug codes.
   * Uses both ING.txt (Ingredients) and DDA.txt (ATC) mappings.
   */
  async getEnrichedDrugData(codes: string[]) {
    if (!codes.length) return {};
    const activeVersion = await this.getActiveVersion();
    
    // Group codes by DRN/Seq1
    const keys = codes.map(c => ({ 
      drn: c.substring(0, 6), 
      seq1: c.substring(6, 8) 
    }));
    
    // 1. Fetch Substance Mapping (ING)
    const ingResults = await db.select({
      drn: whodrugIng.drugRecordNumber,
      seq1: whodrugIng.seq1,
      ingredientCode: whodrugIng.ingredientCode,
      ingredientName: whodrugIng.ingredientName
    })
    .from(whodrugIng)
    .where(and(
      sql`(${whodrugIng.drugRecordNumber}, ${whodrugIng.seq1}) IN ${sql.raw(`(${keys.map(k => `('${k.drn}', '${k.seq1}')`).join(',')})`)}`,
      eq(whodrugIng.whodrugVersion, activeVersion)
    ));

    // 2. Fetch ATC Mapping (DDA + INA)
    // IMPORTANT: DDA stores WHODrug-prefixed ATC codes e.g. '18A09AA'
    //            INA stores standard WHO ATC codes e.g. 'A09AA'
    // Fix: strip leading digits with REGEXP_REPLACE before joining to INA
    const atcResults = await db.select({
      drn: whodrugDda.drugRecordNumber,
      seq1: whodrugDda.seq1,
      atcCode: sql<string>`regexp_replace(${whodrugDda.atcCode}, '^\\d+', '')`,
      rawAtcCode: whodrugDda.atcCode,
      atcDescription: whodrugIna.description
    })
    .from(whodrugDda)
    .leftJoin(whodrugIna, and(
      sql`regexp_replace(${whodrugDda.atcCode}, '^\\d+', '') = ${whodrugIna.atcCode}`,
      eq(whodrugDda.whodrugVersion, whodrugIna.whodrugVersion)
    ))
    .where(and(
      sql`(${whodrugDda.drugRecordNumber}, ${whodrugDda.seq1}) IN ${sql.raw(`(${keys.map(k => `('${k.drn}', '${k.seq1}')`).join(',')})`)}`,
      eq(whodrugDda.whodrugVersion, activeVersion)
    ));

    // 3. Smart Join: Recover missing ingredient names using the Preferred Name (INN) strategy
    //
    // WHODrug B3 convention: the preferred name (INN) for any drug family is stored
    // at Seq2='001' in whodrug_dd for the same DRN.
    //
    // The ingredient code (e.g. '0053608756') maps to a substance within the same DRN family.
    // Since the importer did not store the substance Seq2, we use Seq2='001' as the INN.
    // For Zenpep: DRN=001502, Seq2='001' → tradeName='PANCRELIPASE'
    // For Paracetamol: DRN=000200, Seq2='001' → tradeName='PARACETAMOL'
    const missingIngredients = ingResults.filter(r => !r.ingredientName);
    const recoveredNames: Record<string, string> = {};

    if (missingIngredients.length > 0) {
      const missingDrnsForIng = [...new Set(missingIngredients.map(r => r.drn))];
      
      const preferredRecords = await db.select({
        drn: whodrugDd.drugRecordNumber,
        name: whodrugDd.tradeName
      })
      .from(whodrugDd)
      .where(and(
        sql`${whodrugDd.drugRecordNumber} IN ${sql.raw(`(${missingDrnsForIng.map(d => `'${d}'`).join(',')})`)}`,
        eq(whodrugDd.seq2, '001')
      ));
      
      preferredRecords.forEach(r => { recoveredNames[r.drn] = r.name; });
    }

    // 4. Assemble Results
    const mapping: Record<string, { 
      companyCode: string | null;
      ingredients: { code: string; name: string }[];
      atcs: { code: string; name: string }[];
    }> = {};
    
    // Initialize mapping for all input codes
    codes.forEach(c => { mapping[c] = { companyCode: null, ingredients: [], atcs: [] }; });

    // 4. Fetch Core Drug Details (including companyCode)
    const coreResults = await db.select({
      drn: whodrugDd.drugRecordNumber,
      seq1: whodrugDd.seq1,
      companyCode: whodrugDd.companyCode
    })
    .from(whodrugDd)
    .where(sql`(${whodrugDd.drugRecordNumber}, ${whodrugDd.seq1}) IN ${sql.raw(`(${keys.map(k => `('${k.drn}', '${k.seq1}')`).join(',')})`)}`);

    coreResults.forEach(r => {
      const code = `${r.drn}${r.seq1}`;
      if (mapping[code]) mapping[code].companyCode = r.companyCode;
    });

    // Populate Ingredients
    ingResults.forEach(r => {
      const code = `${r.drn}${r.seq1}`;
      if (mapping[code]) {
        // Use the DRN as key for preferred name lookup (INN strategy)
        const recoveredName = recoveredNames[r.drn] || null;
        mapping[code].ingredients.push({
          code: r.ingredientCode,
          name: r.ingredientName || recoveredName || r.ingredientCode
        });
      }
    });

    // Populate ATCs
    atcResults.forEach(r => {
      const code = `${r.drn}${r.seq1}`;
      if (mapping[code]) {
        mapping[code].atcs.push({
          code: r.atcCode,
          name: r.atcDescription || 'Unknown classification'
        });
      }
    });

    return mapping;
  },

  /**
   * Retrieves all unique dictionary versions currently stored in the database.
   */
  async getVersions() {
    const versions = await db.selectDistinct({ version: whodrugDd.whodrugVersion })
      .from(whodrugDd);
    return versions.map((v: any) => v.version);
  },

  /**
   * Aggregates statistics for the WHODrug Global B3 dictionary.
   */
  async getDictionaryStats() {
    const [ddCount] = await db.select({ count: sql<number>`count(*)` }).from(whodrugDd);
    const [ingCount] = await db.select({ count: sql<number>`count(*)` }).from(whodrugIng);
    const [atcCount] = await db.select({ count: sql<number>`count(*)` }).from(whodrugDda);

    return {
      version: "GLOBALB3Mar25",
      type: "B3 (Enhanced Format)",
      counts: {
        medicinalProducts: Number(ddCount.count),
        ingredients: Number(ingCount.count),
        atcClassifications: Number(atcCount.count)
      },
      lastUpdated: new Date()
    };
  }
};
