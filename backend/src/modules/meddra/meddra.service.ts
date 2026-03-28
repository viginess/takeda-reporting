import { db } from '../../db/core/index.js';
import { 
  meddraLlt, 
  meddraSoc, 
  meddraHlgt, 
  meddraHlt, 
  meddraPt, 
  meddraMdhier 
} from "../../db/meddra/meddra.schema.js";
import { meddraImports } from "../../db/meddra/import.schema.js";
import { systemSettings } from "../../db/admin/settings.schema.js";
import { eq, ilike, or, and, sql, desc, asc, SQL } from "drizzle-orm";
import AdmZip from "adm-zip";

/**
 * Service for handling MedDRA terminology operations and imports.
 */
export const meddraService = {
  /**
   * Gets the active MedDRA version from system settings.
   */
  async getActiveVersion(): Promise<string> {
    const settings = await db.select({ clinicalConfig: systemSettings.clinicalConfig })
      .from(systemSettings)
      .where(eq(systemSettings.id, 1))
      .limit(1);
    
    return settings[0]?.clinicalConfig?.meddraVersion || "29.0";
  },

  /**
   * Searches MedDRA LLTs and retrieves their Primary SOC hierarchy.
   */
  async searchMeddra(input: { query: string; limit: number }) {
    const activeVersion = await this.getActiveVersion();
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
        eq(meddraLlt.meddraVersion, meddraMdhier.meddraVersion),
        eq(meddraMdhier.primarySocFg, 'Y')
      )
    )
    .where(
      and(
        or(
          ilike(meddraLlt.lltName, searchTerm),
          sql`${meddraLlt.lltCode}::text LIKE ${searchTerm}`
        ),
        eq(meddraLlt.meddraVersion, activeVersion)
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
    const activeVersion = await this.getActiveVersion();
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
        eq(meddraLlt.meddraVersion, meddraMdhier.meddraVersion),
        eq(meddraMdhier.primarySocFg, 'Y')
      )
    )
    .where(
      and(
        eq(meddraLlt.lltCode, code),
        eq(meddraLlt.meddraVersion, activeVersion)
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
    version?: string;
    sortBy: "lltCode" | "lltName";
    sortOrder: "asc" | "desc";
  }) {
    const activeVersion = input.version || await this.getActiveVersion();
    const offset = (input.page - 1) * input.pageSize;
    
    let whereClause: SQL | undefined = eq(meddraLlt.meddraVersion, activeVersion);
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
        meddraVersion: meddraLlt.meddraVersion,
      })
      .from(meddraLlt)
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
   * Retrieves a list of all unique MedDRA versions available in the database.
   */
  async getVersions() {
    const versions = await db.selectDistinct({ version: meddraLlt.meddraVersion })
      .from(meddraLlt);
    return versions.map((v: any) => v.version);
  },

  /**
   * Processes a MedDRA ZIP import in the background.
   */
  async processMeddraImport(jobId: number, zipBase64: string) {
    const [importJob] = await db.select()
      .from(meddraImports)
      .where(eq(meddraImports.id, jobId))
      .limit(1);

    if (!importJob) return;

    const meddraVersionString = importJob.version;

    try {
      const zipBuffer = Buffer.from(zipBase64, 'base64');
      const zip = new AdmZip(zipBuffer);
      const entries = zip.getEntries();
      
      const getFileContent = (name: string) => {
        const entry = entries.find(e => e.entryName.toLowerCase() === name.toLowerCase());
        return entry ? entry.getData().toString('utf8') : null;
      };

      const parse = (content: string | null) => {
        if (!content) return [];
        return content.split(/\r?\n/)
          .filter(line => line.trim())
          .map(line => line.split('$|').map(s => s.trim()));
      };

      await db.transaction(async (tx) => {
        // 1. SOC
        const socs = parse(getFileContent('soc.asc')).map(p => ({
          socCode: parseInt(p[0]),
          socName: p[1] || "",
          socAbbrev: p[2] || "",
          meddraVersion: meddraVersionString
        }));
        if (socs.length) await tx.insert(meddraSoc).values(socs).onConflictDoNothing();

        // 2. HLGT
        const hlgts = parse(getFileContent('hlgt.asc')).map(p => ({
          hlgtCode: parseInt(p[0]),
          hlgtName: p[1] || "",
          meddraVersion: meddraVersionString
        }));
        if (hlgts.length) await tx.insert(meddraHlgt).values(hlgts).onConflictDoNothing();

        // 3. HLT
        const hlts = parse(getFileContent('hlt.asc')).map(p => ({
          hltCode: parseInt(p[0]),
          hltName: p[1] || "",
          meddraVersion: meddraVersionString
        }));
        if (hlts.length) await tx.insert(meddraHlt).values(hlts).onConflictDoNothing();

        // 4. PT
        const pts = parse(getFileContent('pt.asc')).map(p => ({
          ptCode: parseInt(p[0]),
          ptName: p[1] || "",
          ptSocCode: p[2] ? parseInt(p[2]) : null,
          meddraVersion: meddraVersionString
        }));
        if (pts.length) await tx.insert(meddraPt).values(pts).onConflictDoNothing();

        // 5. LLT
        const llts = parse(getFileContent('llt.asc')).map(p => ({
          lltCode: parseInt(p[0]),
          lltName: p[1] || "",
          ptCode: parseInt(p[2]),
          lltCurrency: p[3] || "",
          meddraVersion: meddraVersionString
        }));
        if (llts.length) {
          for (let i = 0; i < llts.length; i += 1000) {
            await tx.insert(meddraLlt).values(llts.slice(i, i + 1000)).onConflictDoNothing();
          }
        }

        // 6. Hierarchy (mdhier)
        const hiers = parse(getFileContent('mdhier.asc')).map(p => ({
          ptCode: parseInt(p[0]),
          hltCode: parseInt(p[1]),
          hlgtCode: parseInt(p[2]),
          socCode: parseInt(p[3]),
          ptName: p[4] || "",
          hltName: p[5] || "",
          hlgtName: p[6] || "",
          socName: p[7] || "",
          socAbbrev: p[8] || "",
          ptSocCode: p[9] ? parseInt(p[9]) : null,
          primarySocFg: p[10] || "",
          meddraVersion: meddraVersionString
        }));
        if (hiers.length) {
          for (let i = 0; i < hiers.length; i += 1000) {
            await tx.insert(meddraMdhier).values(hiers.slice(i, i + 1000)).onConflictDoNothing();
          }
        }
      });

      await db.update(meddraImports)
        .set({ status: 'COMPLETED', updatedAt: new Date() })
        .where(eq(meddraImports.id, jobId));

    } catch (error: any) {
      console.error("MedDRA Import Failed:", error);
      await db.update(meddraImports)
        .set({ 
          status: 'FAILED', 
          errorLog: error.message,
          updatedAt: new Date() 
        })
        .where(eq(meddraImports.id, jobId));
    }
  }
};
