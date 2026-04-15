import { validateXML } from 'xmllint-wasm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../../../db/core/index.js';
import { meddraLlt } from "../../../db/meddra/meddra.schema.js";
import { DOMParser } from '@xmldom/xmldom';
import xpath from 'xpath';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let meddraLltCache: Set<string> | null = null;
let cachedSchemas: { fileName: string; contents: string }[] | null = null;

export async function resetMeddraCache() {
  meddraLltCache = null;
}

async function ensureMeddraCache() {
  if (meddraLltCache !== null) return;
  const codes = await db.select({ lltCode: meddraLlt.lltCode }).from(meddraLlt);
  meddraLltCache = new Set(codes.map(c => c.lltCode.toString()));
}

/**
 * E2B(R3) VALIDATION PIPELINE:
 * 1. Pre-load MedDRA LLT cache for O(1) clinical vocabulary checks.
 * 2. Deterministically load XSD schemas from official ICH package.
 * 3. PIVOT: Use DOMParser + XPath to prevent data loss from repeated HL7 sibling nodes.
 * 4. ENFORCE: Verify mandatory E.i (Reaction) and G.k (Suspect Drug) blocks.
 * 5. SANITIZE: Verify 14-digit date hygiene and HL7 v3 Value-Set compliance.
 * 6. XSD CHECK: Perform final structural schema validation via xmllint-wasm.
 */
export async function validateE2BR3(xml: string) {
  let schemasDir = path.resolve(__dirname, '..', 'schemas');
  if (!fs.existsSync(schemasDir)) {
    // Fallback to src directory if running from compiled dist
    const fallbackDir = path.resolve(process.cwd(), 'src/modules/e2b/schemas');
    if (fs.existsSync(fallbackDir)) {
      schemasDir = fallbackDir;
    }
  }
  const errors: any[] = [];

  try {
    await ensureMeddraCache();

    // 1. Recursive Schema Loading for WASM (Cached)
    let schemaFiles: { fileName: string; contents: string }[] = [];
    if (cachedSchemas) {
      schemaFiles = [...cachedSchemas];
    } else {
      const getFilesRecursively = (dir: string) => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          if (fs.statSync(fullPath).isDirectory()) {
            getFilesRecursively(fullPath);
          } else if (item.endsWith('.xsd')) {
            let contents = fs.readFileSync(fullPath, 'utf8');
            // Strip relative paths from schemaLocation to flatten the virtual file system
            contents = contents.replace(/schemaLocation="(?:\.\.\/|\.\/)?(?:coreschemas|messageschemas|multicacheschemas)\/([^"]+)"/g, 'schemaLocation="$1"');
            schemaFiles.push({ fileName: path.basename(item), contents });
          }
        }
      };
      getFilesRecursively(schemasDir);
      cachedSchemas = [...schemaFiles];
    }

    if (schemaFiles.length < 50) {
      return {
        valid: false,
        errors: [{ message: `Incomplete schema load. Only ${schemaFiles.length} schemas detected.`, type: 'config' }]
      };
    }

    // 2. XPath Initialization (Namespace Aware)
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const select = xpath.useNamespaces({ hl7: 'urn:hl7-org:v3' });

    // --- Mandatory Compliance Checks (Node-Length Approach for 100% Safety) ---
    const hasReaction = (select("//hl7:observation[hl7:code/@code='ASSERTION']", doc) as any[]).length > 0;
    const hasSuspectDrug = (select("//hl7:organizer[hl7:code/@code='1' and hl7:component/hl7:substanceAdministration]", doc) as any[]).length > 0;

    if (!hasReaction) errors.push({ message: 'Mandatory section missing: Adverse Reaction (E.i)', type: 'compliance' });
    if (!hasSuspectDrug) errors.push({ message: 'Mandatory section missing: Suspect Drug (G.k category 1)', type: 'compliance' });

    // ── GENDER (D.5) ─────────────────────────────────────────────────────────
    const gender = select("string(//hl7:administrativeGenderCode/@code)", doc) as string;
    if (gender && !['M', 'F', 'UN'].includes(gender)) {
        errors.push({ message: `Invalid gender: ${gender}`, type: 'value-set' });
    }

    // ── REPORTER NAME (C.2.r.2) ──────────────────────────────────────────────
    const reporterGiven = select("string(//hl7:authorOrPerformer//hl7:assignedPerson/hl7:name/hl7:given)", doc) as string;
    const reporterFamily = select("string(//hl7:authorOrPerformer//hl7:assignedPerson/hl7:name/hl7:family)", doc) as string;
    if (!reporterGiven.trim() && !reporterFamily.trim()) {
        errors.push({ message: 'Reporter name is empty (C.2.r.2)', type: 'compliance' });
    }

    // ── CAUSALITY VALUE SET (G.k.9.i) ───────────────────────────────────────
    // Allowed codes: 1 = Certain, 2 = Probable, 3 = Possible, 4 = Unlikely, 5 = Conditional, 6 = Unassessable
    const causalityNodes = select("//hl7:outboundRelationship2[@typeCode='CAUS']//hl7:value/@code", doc) as any[];
    causalityNodes.forEach((node, idx) => {
        const causalityCode = node.nodeValue;
        if (causalityCode && !['1','2','3','4','5','6'].includes(causalityCode)) {
            errors.push({ message: `Invalid causality code: ${causalityCode} at drug[${idx}] (G.k.9.i must be 1-6)`, type: 'value-set' });
        }
    });

    // ── ROUTE CODE (G.k.4) ──────────────────────────────────────────────────
    // NOTE: Full ICH route code list not yet available
    // TODO: Replace format-only check with value-set check when product DB is ready
    const routeNodes = select("//hl7:routeCode/@code", doc) as any[];
    routeNodes.forEach((node, idx) => {
        const routeCode = node.nodeValue;
        if (!routeCode || routeCode.trim() === '') {
            errors.push({ message: `Empty route code at drug[${idx}] (G.k.4.r)`, type: 'value-set' });
        }
        // Format guard only — must be uppercase letters, no spaces or digits
        if (routeCode && !/^[A-Z]+$/.test(routeCode)) {
            errors.push({ message: `Malformed route code: ${routeCode} at drug[${idx}] (G.k.4.r)`, type: 'value-set' });
        }
    });

    // ── DRUG NAME (G.k.2.2) ─────────────────────────────────────────────────
    // NOTE: No product DB yet — can only check presence, not validity
    // TODO: Cross-check against product list when available
    const drugNames = select("//hl7:kindOfMaterialKind/hl7:name", doc) as any[];
    drugNames.forEach((node, idx) => {
        const name = (node as any).textContent?.trim();
        if (!name || name === 'Unknown Drug') {
            errors.push({ message: `Drug[${idx}] product name missing (G.k.2.2)`, type: 'compliance' });
        }
    });

    const dateRegex = /^\d{8}(\d{2}){0,3}$/;
    const checkDate = (xpathQuery: string, label: string) => {
      const nodes = select(xpathQuery, doc) as any[];
      nodes.forEach((node, idx) => {
        // Use nodeValue or value for attribute nodes
        const val = node.nodeValue || node.value || node.textContent;
        if (val && !dateRegex.test(val)) {
            errors.push({ message: `Invalid Date Format in ${label}${nodes.length > 1 ? '['+idx+']' : ''}: ${val}`, type: 'format' });
        }
      });
    };

    checkDate("//hl7:creationTime/@value", "creationTime");
    checkDate("//hl7:birthTime/@value", "birthTime");
    checkDate("//hl7:availabilityTime/@value", "availabilityTime");
    checkDate("//hl7:observation[hl7:code/@code='ASSERTION']/hl7:effectiveTime/hl7:low/@value", "Reaction low date");
    checkDate("//hl7:organizer[hl7:code/@code='1']//hl7:substanceAdministration/hl7:effectiveTime/hl7:low/@value", "Suspect Drug low date");

    // ── WHODrug Discovery (OID: 2.16.840.1.113883.6.294) ────────────────────
    const whodrugNodes = select("//hl7:*[@codeSystem='2.16.840.1.113883.6.294']", doc) as any[];
    whodrugNodes.forEach((node) => {
      const code = node.getAttribute?.('code') || node.nodeValue;
      if (code) {
        // WHODrug Global B3 standard: 8-digit code (DRN 6 + Seq1 2)
        if (!/^\d{8}$/.test(code)) {
          errors.push({ 
            message: `Invalid WHODrug code format: ${code}. Expected 8-digit (DRN + Seq1).`, 
            type: 'whodrug' 
          });
        }

        // Best Practice: If medicinal product is coded, substances (G.k.2.3.r) should be enumerated
        // We look for substanceAdministration/consumable/instanceOfKind/kindOfMaterialKind/ingredient
        const substances = select("ancestor::hl7:kindOfMaterialKind//hl7:ingredient", node) as any[];
        if (substances.length === 0) {
            errors.push({ 
              message: `Coded drug [${code}] is missing substance enumeration (G.k.2.3.r). This is a WHODrug best practice.`, 
              type: 'compliance' 
            });
        }
      }
    });

    // --- MedDRA Discovery (XPath Fix 3: XPath 1.0 compatibility) ---
    const meddraNodes = select("//hl7:*[@codeSystem='2.16.840.1.113883.6.163']", doc) as any[];
    meddraNodes.forEach((node) => {
      const code = node.getAttribute?.('code') || node.nodeValue;
      if (code && meddraLltCache && !meddraLltCache.has(code)) {
        // Try to get a helpful parent name for context
        const parentName = select("string(ancestor::hl7:*[@displayName][1]/@displayName)", node) 
                        || "unknown context";
        errors.push({ message: `Invalid MedDRA code: ${code} at ${parentName}`, type: 'meddra' });
      }
    });

    // 3. Schema Validation (Original XML)
    if (schemaFiles.length === 0) {
      return { 
        valid: false, 
        errors: [{ message: `No XSD schemas found at: ${schemasDir}`, type: 'config' }] 
      };
    }

    // Fix 4: Set the correct entry point instead of passing array to schema
    const rootSchemaName = 'MCCI_IN200100UV01.xsd';
    const rootSchema = schemaFiles.find(f => f.fileName === rootSchemaName) 
                        || schemaFiles.find(f => f.fileName.includes('MCCI_IN200100UV01'));
                        
    if (!rootSchema) {
      return { valid: false, errors: [{ message: `Root schema ${rootSchemaName} not found in the schemas directory.`, type: 'config' }] };
    }

    console.log(`Loaded schemas: ${schemaFiles.length}`);
    console.log(`Sample schemas (1st 10):`, schemaFiles.slice(0, 10).map(f => f.fileName));

    const result = await validateXML({
      xml: xml.replace(/xsi:schemaLocation="[^"]*"/g, '').replace(/xsi:noNamespaceSchemaLocation="[^"]*"/g, ''),
      schema: rootSchema, // The main XML file passed as an object so it retains its directory path
      preload: schemaFiles, // Load the entire directory tree so relative imports work
      extension: 'schema'
    });

    // Fix 5: Ensure 100% visible error messages (Catch and Normalize)
    // CRITICAL: every error object MUST have a non-undefined `message` string.
    const normalizeError = (e: any): { message: string; type: string } => {
      let rawMsg = 'Unknown validation error';

      if (typeof e === 'string' && e.trim()) {
        rawMsg = e;
      } else if (e && typeof e === 'object') {
        rawMsg = (typeof e.message === 'string' && e.message.trim() ? e.message : null) ||
                 (typeof e.text    === 'string' && e.text.trim()    ? e.text    : null) ||
                 (typeof e.toString === 'function' && e.toString() !== '[object Object]' ? e.toString() : null) ||
                 (Object.keys(e).length > 0 ? JSON.stringify(e) : 'Unknown validation error');
      }

      // Humanize XSD Errors
      let readable = rawMsg.replace(/\{urn:hl7-org:v3\}/g, '').replace('Schemas validity error : ', '').trim();
      
      const unexpectedMatch = readable.match(/Element '([^']+)': This element is not expected\. Expected is one of \( ([^)]+) \)/);
      if (unexpectedMatch) {
         readable = `The XML tag <${unexpectedMatch[1]}> is in the wrong order or invalid here. The HL7 schema strictly expects one of: [ ${unexpectedMatch[2].replace(/,/g, ', ')} ]`;
      }
      
      const missingMatch = readable.match(/Element '([^']+)': Missing child element\(s\)\. Expected is one of \( ([^)]+) \)/);
      if (missingMatch) {
         readable = `The XML tag <${missingMatch[1]}> is missing required children. It strictly requires one of these tags inside it: [ ${missingMatch[2].replace(/,/g, ', ')} ]`;
      }

      const formattedMessage = `(Readable) ${readable}\n(Raw Error) ${rawMsg}`;

      return { message: formattedMessage, type: e?.type || 'schema' };
    };

    return {
      valid: result.valid === true && errors.length === 0,
      errors: [
        ...errors,
        ...(result.errors || []).map(normalizeError),
      ],
      rawOutput: result.rawOutput
    };

  } catch (error: any) {
    let message = 'An unexpected XML validation error occurred.';
    
    const formatErrnoDetails = (code: any, originalMsg?: string) => {
      return `XML Schema Access Error (System Code: ${code || 'Unknown'}). The validator's internal file system could not read the required .xsd schema files. Please ensure the schemas are correctly deployed and accessible.${originalMsg ? ` Details: ${originalMsg}` : ''}`;
    };

    if (error instanceof Error) {
      if (error.name === 'ErrnoError') {
        const code = (error as any).F || (error as any).errno;
        message = formatErrnoDetails(code, error.message);
      } else {
        message = error.message;
      }
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      if (error.name === 'ErrnoError') {
        const code = error.F || error.errno;
        message = formatErrnoDetails(code);
      } else {
        message = `Validation Engine Error: ${JSON.stringify(error, null, 2)}`;
      }
    }
    
    return { valid: false, errors: [{ message, type: 'exception' }] };
  }
}
