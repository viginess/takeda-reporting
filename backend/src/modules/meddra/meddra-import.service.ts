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
import { dictionaryVersions } from "../../db/shared/dictionary.schema.js";
import { eq, and } from "drizzle-orm";
import AdmZip from "adm-zip";

/**
 * Service for handling MedDRA dictionary imports.
 */
export const meddraImportService = {
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
    
    // Resolve or create versionId in lookup table
    let versionEntry = await db.select()
      .from(dictionaryVersions)
      .where(and(
        eq(dictionaryVersions.name, meddraVersionString),
        eq(dictionaryVersions.type, 'meddra')
      ))
      .limit(1);
    
    let versionId: number;
    if (versionEntry.length === 0) {
      const inserted = await db.insert(dictionaryVersions)
        .values({ name: meddraVersionString, type: 'meddra' })
        .returning({ id: dictionaryVersions.id });
      versionId = inserted[0].id;
    } else {
      versionId = versionEntry[0].id;
    }

    try {
      const zipBuffer = Buffer.from(zipBase64, 'base64');
      const zip = new AdmZip(zipBuffer);
      const entries = zip.getEntries();
      
      const getFileContent = (name: string) => {
        const entry = entries.find(e => e.entryName.toLowerCase().endsWith(name.toLowerCase()) && !e.isDirectory);
        if (!entry) {
          console.warn(`[MedDRA] Warning: File ${name} not found in the ZIP package.`);
        }
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
          versionId: versionId
        }));
        if (socs.length) await tx.insert(meddraSoc).values(socs).onConflictDoNothing();

        // 2. HLGT
        const hlgts = parse(getFileContent('hlgt.asc')).map(p => ({
          hlgtCode: parseInt(p[0]),
          hlgtName: p[1] || "",
          versionId: versionId
        }));
        if (hlgts.length) await tx.insert(meddraHlgt).values(hlgts).onConflictDoNothing();

        // 3. HLT
        const hlts = parse(getFileContent('hlt.asc')).map(p => ({
          hltCode: parseInt(p[0]),
          hltName: p[1] || "",
          versionId: versionId
        }));
        if (hlts.length) await tx.insert(meddraHlt).values(hlts).onConflictDoNothing();

        // 4. PT
        const pts = parse(getFileContent('pt.asc')).map(p => ({
          ptCode: parseInt(p[0]),
          ptName: p[1] || "",
          ptSocCode: p[2] ? parseInt(p[2]) : null,
          versionId: versionId
        }));
        if (pts.length) await tx.insert(meddraPt).values(pts).onConflictDoNothing();

        // 5. LLT
        const llts = parse(getFileContent('llt.asc')).map(p => ({
          lltCode: parseInt(p[0]),
          lltName: p[1] || "",
          ptCode: parseInt(p[2]),
          lltCurrency: p[3] || "",
          versionId: versionId
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
          versionId: versionId
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
