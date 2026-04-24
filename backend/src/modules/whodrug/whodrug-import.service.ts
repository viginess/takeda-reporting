import { db } from '../../db/core/index.js';
import { 
  whodrugDd, 
  whodrugIng, 
  whodrugDda, 
  whodrugIna,
  whodrugMan
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
        // 1. MAN.txt (Manufacturers)
        console.log("[WHODrug] Importing Manufacturers...");
        const mans = parse(getFileContent('man.txt')).map(p => ({
          companyCode: p[0],
          companyName: p[1] || "Unknown",
          versionId: versionId
        }));
        if (mans.length) await tx.insert(whodrugMan).values(mans).onConflictDoNothing();

        // 2. INA.txt (ATC Classifications)
        console.log("[WHODrug] Importing ATC Classifications...");
        const inas = parse(getFileContent('ina.txt')).map(p => ({
          atcCode: p[0],
          description: p[1] || "",
          level: parseInt(p[2]) || 0,
          versionId: versionId
        }));
        if (inas.length) await tx.insert(whodrugIna).values(inas).onConflictDoNothing();

        // 3. DD.txt (Core Medicinal Products) - CHUNKED
        console.log("[WHODrug] Importing Medicinal Products (DD)...");
        const ddLines = parse(getFileContent('dd.txt'));
        const dds = ddLines.map(p => ({
          rid: `${p[0]}${p[1]}${p[2]}${versionId}`, // Generate a unique RID for this version
          drugRecordNumber: p[0],
          seq1: p[1],
          seq2: p[2],
          tradeName: p[3] || "N/A",
          companyCode: p[4] || null,
          countryCode: p[5] || null,
          sourceCode: p[6] || null,
          versionId: versionId
        }));
        
        for (let i = 0; i < dds.length; i += 1000) {
          await tx.insert(whodrugDd).values(dds.slice(i, i + 1000)).onConflictDoNothing();
          await db.update(whodrugImports).set({ processedRows: i + dds.length / 10 }).where(eq(whodrugImports.id, jobId));
        }

        // 4. ING.txt (Ingredient Mapping) - CHUNKED
        console.log("[WHODrug] Importing Ingredient Mapping (ING)...");
        const ingLines = parse(getFileContent('ing.txt'));
        const ings = ingLines.map(p => ({
          id: `${p[0]}${p[1]}${p[2]}${versionId}`,
          drugRecordNumber: p[0],
          seq1: p[1],
          ingredientCode: p[2],
          ingredientName: p[3] || null,
          versionId: versionId
        }));

        for (let i = 0; i < ings.length; i += 1000) {
          await tx.insert(whodrugIng).values(ings.slice(i, i + 1000)).onConflictDoNothing();
        }

        // 5. DDA.txt (ATC Mapping) - CHUNKED
        console.log("[WHODrug] Importing ATC Mapping (DDA)...");
        const ddaLines = parse(getFileContent('dda.txt'));
        const ddas = ddaLines.map(p => ({
          id: `${p[0]}${p[1]}${p[2]}${versionId}`,
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
