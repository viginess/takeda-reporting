import { db } from '../../db/core/index.js';
import { 
  whodrugDd, 
  whodrugIng, 
  whodrugDda, 
  whodrugIna,
  whodrugMan,
  whodrugCcode,
  whodrugSource
} from "../../db/whodrug/whodrug.schema.js";
import { whodrugImports } from "../../db/whodrug/whodrug-import.schema.js";
import { dictionaryVersions } from "../../db/shared/dictionary.schema.js";
import { eq, and } from "drizzle-orm";
import AdmZip from "adm-zip";

/**
 * Service for handling WHODrug dictionary imports.
 * Optimized for high-volume B3 format files.
 */
export const whodrugImportService = {
  /**
   * Processes a WHODrug ZIP import in the background.
   * Expects standard WHODrug B3 text files inside the zip.
   */
  async processImport(jobId: number, zipBase64: string) {
    const [importJob] = await db.select()
      .from(whodrugImports)
      .where(eq(whodrugImports.id, jobId))
      .limit(1);

    if (!importJob) return;

    const versionOrName = importJob.version;
    
    // Resolve or create versionId in lookup table
    let versionEntry = await db.select()
      .from(dictionaryVersions)
      .where(and(
        eq(dictionaryVersions.name, versionOrName),
        eq(dictionaryVersions.type, 'whodrug')
      ))
      .limit(1);
    
    let versionId: number;
    if (versionEntry.length === 0) {
      const inserted = await db.insert(dictionaryVersions)
        .values({ name: versionOrName, type: 'whodrug' })
        .returning({ id: dictionaryVersions.id });
      versionId = inserted[0].id;
    } else {
      versionId = versionEntry[0].id;
    }

    try {
      console.log(`[WHODrug] Starting import for version: ${versionOrName}`);
      const zipBuffer = Buffer.from(zipBase64, 'base64');
      const zip = new AdmZip(zipBuffer);
      const entries = zip.getEntries();
      
      const getFileContent = (name: string) => {
        const entry = entries.find(e => e.entryName.toLowerCase().endsWith(name.toLowerCase()) && !e.isDirectory);
        if (!entry) {
            console.warn(`[WHODrug] Warning: File ${name} not found in the ZIP package.`);
        }
        return entry ? entry.getData().toString('utf8') : null;
      };

      /**
       * Parser for WHODrug B3/B2 files.
       * Supports both delimited (|) and simple tab/comma imports.
       */
      const parse = (content: string | null, delimiter: string = '|') => {
        if (!content) return [];
        return content.split(/\r?\n/)
          .filter(line => line.trim())
          .map(line => line.split(delimiter).map(s => s.trim()));
      };

      await db.transaction(async (tx) => {
        // 1. CCODE.txt (Countries)
        console.log("[WHODrug] Importing Country Codes...");
        const ccodes = parse(getFileContent('ccode.txt')).map(p => ({
          countryCode: p[0],
          countryName: p[1] || "Unknown",
          versionId: versionId
        }));
        if (ccodes.length) await tx.insert(whodrugCcode).values(ccodes).onConflictDoNothing();

        // 2. DDSOURCE.txt (Sources)
        console.log("[WHODrug] Importing Data Sources...");
        const sources = parse(getFileContent('ddsource.txt')).map(p => ({
          sourceCode: p[0],
          sourceName: p[1] || "Unknown",
          versionId: versionId
        }));
        if (sources.length) await tx.insert(whodrugSource).values(sources).onConflictDoNothing();

        // 3. MAN.txt (Manufacturers)
        console.log("[WHODrug] Importing Manufacturers...");
        const mans = parse(getFileContent('man.txt')).map(p => ({
          companyCode: p[0],
          companyName: p[1] || "Unknown",
          versionId: versionId
        }));
        if (mans.length) await tx.insert(whodrugMan).values(mans).onConflictDoNothing();

        // 4. Build Lookup Maps for IDs
        const [ccRes, srcRes, manRes] = await Promise.all([
          tx.select({ id: whodrugCcode.id, code: whodrugCcode.countryCode }).from(whodrugCcode).where(eq(whodrugCcode.versionId, versionId)),
          tx.select({ id: whodrugSource.id, code: whodrugSource.sourceCode }).from(whodrugSource).where(eq(whodrugSource.versionId, versionId)),
          tx.select({ id: whodrugMan.id, code: whodrugMan.companyCode }).from(whodrugMan).where(eq(whodrugMan.versionId, versionId))
        ]);

        const countryMap = new Map(ccRes.map(r => [r.code, r.id]));
        const sourceMap = new Map(srcRes.map(r => [r.code, r.id]));
        const companyMap = new Map(manRes.map(r => [r.code, r.id]));

        // 5. INA.txt (ATC Classifications)
        console.log("[WHODrug] Importing ATC Classifications...");
        const inas = parse(getFileContent('ina.txt')).map(p => ({
          atcCode: p[0],
          description: p[1] || "",
          level: parseInt(p[2]) || 0,
          versionId: versionId
        }));
        if (inas.length) await tx.insert(whodrugIna).values(inas).onConflictDoNothing();

        // 6. DD.txt (Core Medicinal Products) - CHUNKED
        console.log("[WHODrug] Importing Medicinal Products (DD)...");
        const ddLines = parse(getFileContent('dd.txt'));
        const dds = ddLines.map(p => ({
          drugRecordNumber: p[0],
          seq1: p[1],
          seq2: p[2],
          tradeName: p[3] || "N/A",
          companyId: companyMap.get(p[4]) || null,
          countryId: countryMap.get(p[5]) || null,
          sourceId: sourceMap.get(p[6]) || null,
          versionId: versionId
        }));
        
        for (let i = 0; i < dds.length; i += 1000) {
          await tx.insert(whodrugDd).values(dds.slice(i, i + 1000)).onConflictDoNothing();
          if (i % 10000 === 0) {
            await db.update(whodrugImports).set({ processedRows: i }).where(eq(whodrugImports.id, jobId));
          }
        }

        // 7. ING.txt (Ingredient Mapping) - CHUNKED
        console.log("[WHODrug] Importing Ingredient Mapping (ING)...");
        const ingLines = parse(getFileContent('ing.txt'));
        const ings = ingLines.map(p => ({
          drugRecordNumber: p[0],
          seq1: p[1],
          ingredientCode: p[2],
          versionId: versionId
        }));

        for (let i = 0; i < ings.length; i += 1000) {
          await tx.insert(whodrugIng).values(ings.slice(i, i + 1000)).onConflictDoNothing();
        }

        // 8. DDA.txt (ATC Mapping) - CHUNKED
        console.log("[WHODrug] Importing ATC Mapping (DDA)...");
        const ddaLines = parse(getFileContent('dda.txt'));
        const ddas = ddaLines.map(p => ({
          drugRecordNumber: p[0],
          seq1: p[1],
          atcCode: p[2],
          versionId: versionId
        }));

        for (let i = 0; i < ddas.length; i += 1000) {
          await tx.insert(whodrugDda).values(ddas.slice(i, i + 1000)).onConflictDoNothing();
        }
      });

      console.log(`[WHODrug] Import COMPLETED for version: ${versionOrName}`);
      await db.update(whodrugImports)
        .set({ status: 'COMPLETED', updatedAt: new Date() })
        .where(eq(whodrugImports.id, jobId));

    } catch (error: any) {
      console.error("[WHODrug] Import Failed:", error);
      await db.update(whodrugImports)
        .set({ 
          status: 'FAILED', 
          errorLog: error.message,
          updatedAt: new Date() 
        })
        .where(eq(whodrugImports.id, jobId));
    }
  }
};
