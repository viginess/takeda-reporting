import { db } from '../../db/core/index.js';
import { 
  meddraLlt, 
  meddraMdhier 
} from "../../db/meddra/meddra.schema.js";
import { systemSettings } from "../../db/admin/settings.schema.js";
import { dictionaryVersions } from "../../db/shared/dictionary.schema.js";
import { eq, ilike, or, and, sql, desc, asc, SQL } from "drizzle-orm";

/**
 * Service for handling MedDRA terminology operations and imports.
 */
export const meddraService = {
  /**
   * Gets the active MedDRA version ID from system settings.
   */
  async getActiveVersionId(): Promise<number> {
    const settings = await db.select({ activeMeddraVersionId: systemSettings.activeMeddraVersionId })
      .from(systemSettings)
      .where(eq(systemSettings.id, 1))
      .limit(1);
    
    return settings[0]?.activeMeddraVersionId || 1; // Fallback to ID 1
  },

  /**
   * Searches MedDRA LLTs and retrieves their Primary SOC hierarchy.
   */
  async searchMeddra(input: { query: string; limit: number }) {
    const activeVersionId = await this.getActiveVersionId();
    const searchTerm = `%${input.query}%`;

    const results = await db.select({
      lltCode: meddraLlt.lltCode,
      lltName: meddraLlt.lltName,
      ptCode: meddraMdhier.ptCode,
      ptName: meddraMdhier.ptName,
      socCode: meddraMdhier.socCode,
      socName: meddraMdhier.socName,
      primarySocFg: meddraMdhier.primarySocFg
    })
    .from(meddraLlt)
    .leftJoin(
      meddraMdhier, 
      and(
        eq(meddraLlt.ptCode, meddraMdhier.ptCode),
        eq(meddraLlt.versionId, meddraMdhier.versionId),
        eq(meddraMdhier.primarySocFg, 'Y')
      )
    )
    .where(
      and(
        or(
          ilike(meddraLlt.lltName, searchTerm),
          sql`${meddraLlt.lltCode}::text LIKE ${searchTerm}`
        ),
        eq(meddraLlt.versionId, activeVersionId)
      )
    )
    .limit(input.limit)
    .orderBy(
      desc(sql`CASE WHEN ${meddraLlt.lltName} ILIKE ${input.query + '%'} THEN 1 ELSE 0 END`),
      asc(meddraLlt.lltName)
    );

    return results.map((r: any) => ({
      code: r.lltCode.toString(),
      term: r.lltName,
      type: "LLT",
      lltCode: r.lltCode.toString(),
      lltName: r.lltName,
      ptCode: r.ptCode?.toString() || r.lltCode.toString(),
      ptName: r.ptName || r.lltName,
      socName: r.socName,
      socCode: r.socCode?.toString(),
    }));
  },

  /**
   * Gets a specific MedDRA term by its 8-digit code.
   */
  async getTermByCode(codeString: string) {
    const activeVersionId = await this.getActiveVersionId();
    const code = parseInt(codeString);

    const result = await db.select({
      lltCode: meddraLlt.lltCode,
      lltName: meddraLlt.lltName,
      ptCode: meddraMdhier.ptCode,
      ptName: meddraMdhier.ptName,
      socCode: meddraMdhier.socCode,
      socName: meddraMdhier.socName
    })
    .from(meddraLlt)
    .leftJoin(
      meddraMdhier, 
      and(
        eq(meddraLlt.ptCode, meddraMdhier.ptCode),
        eq(meddraLlt.versionId, meddraMdhier.versionId),
        eq(meddraMdhier.primarySocFg, 'Y')
      )
    )
    .where(
      and(
        eq(meddraLlt.lltCode, code),
        eq(meddraLlt.versionId, activeVersionId)
      )
    )
    .limit(1);

    if (result.length === 0) return null;
    const r = result[0];

    return {
      code: r.lltCode.toString(),
      term: r.lltName,
      type: "LLT",
      lltCode: r.lltCode.toString(),
      lltName: r.lltName,
      ptCode: r.ptCode?.toString() || r.lltCode.toString(),
      ptName: r.ptName || r.lltName,
      socName: r.socName,
      socCode: r.socCode?.toString(),
    };
  },

  /**
   * Retrieves a paginated list of MedDRA terms (LLTs) with searching and sorting.
   */
  async getPaginatedList(input: {
    page: number;
    pageSize: number;
    search?: string;
    versionId?: number;
    version?: string;
    sortBy: "lltCode" | "lltName";
    sortOrder: "asc" | "desc";
  }) {
    const activeVersionId = input.versionId || await this.getActiveVersionId();
    const offset = (input.page - 1) * input.pageSize;
    
    let whereClause: SQL | undefined = eq(meddraLlt.versionId, activeVersionId);
    if (input.search) {
      const searchTerm = `%${input.search}%`;
      whereClause = and(
        whereClause,
        or(
          ilike(meddraLlt.lltName, searchTerm),
          sql`${meddraLlt.lltCode}::text LIKE ${searchTerm}`
        )
      );
    }

    const sortColumn = (input.sortBy === "lltCode" ? meddraLlt.lltCode : meddraLlt.lltName);
    const orderBy = input.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

    const [items, total] = await Promise.all([
      db.select({
        lltCode: meddraLlt.lltCode,
        lltName: meddraLlt.lltName,
        ptCode: meddraLlt.ptCode,
        meddraVersion: dictionaryVersions.name,
      })
      .from(meddraLlt)
      .innerJoin(dictionaryVersions, eq(meddraLlt.versionId, dictionaryVersions.id))
      .where(whereClause ?? sql`TRUE`)
      .limit(input.pageSize)
      .offset(offset)
      .orderBy(orderBy),
      
      db.select({ count: sql<number>`count(*)` })
      .from(meddraLlt)
      .where(whereClause ?? sql`TRUE`)
      .then((res: any) => Number(res[0].count))
    ]);

    return { items, total, page: input.page, pageSize: input.pageSize };
  },

  /**
   * Retrieves a list of all unique MedDRA versions from the lookup table.
   */
  async getVersions() {
    const versions = await db.select({ name: dictionaryVersions.name })
      .from(dictionaryVersions)
      .where(eq(dictionaryVersions.type, 'meddra'));
    return versions.map(v => v.name);
  }
};
