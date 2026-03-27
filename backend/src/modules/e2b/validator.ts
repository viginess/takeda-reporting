import { validateXML } from 'xmllint-wasm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from "../../db/index.js";
import { meddraLlt } from "../../db/meddra/meddra.schema.js";
import { DOMParser } from '@xmldom/xmldom';
import xpath from 'xpath';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let meddraLltCache: Set<string> | null = null;

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
  const schemasDir = path.resolve(__dirname, 'schemas');
  const errors: any[] = [];

  try {
    await ensureMeddraCache();

    // 1. Recursive Schema Loading for WASM
    const schemaFiles: { fileName: string; contents: string }[] = [];
    const getFilesRecursively = (dir: string, baseDir: string) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        if (fs.statSync(fullPath).isDirectory()) {
          getFilesRecursively(fullPath, baseDir);
        } else if (item.endsWith('.xsd')) {
          schemaFiles.push({ fileName: relPath, contents: fs.readFileSync(fullPath, 'utf8') });
        }
      }
    };
    getFilesRecursively(schemasDir, schemasDir);

    // 2. XPath Initialization (Namespace Agnostic)
    const cleanXml = xml.replace(/\s+xmlns(?::\w+)?\s*=\s*"[^"]*"/g, '');
    const doc = new DOMParser().parseFromString(cleanXml, 'text/xml');
    const select = xpath.useNamespaces({});

    // --- Mandatory Compliance Checks (Node-Length Approach for 100% Safety) ---
    const hasReaction = (select("//observation[code/@code='ASSERTION']", doc) as any[]).length > 0;
    const hasSuspectDrug = (select("//organizer[code/@code='1']", doc) as any[]).length > 0;

    if (!hasReaction) errors.push({ message: 'Mandatory section missing: Adverse Reaction (E.i)', type: 'compliance' });
    if (!hasSuspectDrug) errors.push({ message: 'Mandatory section missing: Suspect Drug (G.k category 1)', type: 'compliance' });

    // ── GENDER (D.5) ─────────────────────────────────────────────────────────
    const gender = select("string(//administrativeGenderCode/@code)", doc) as string;
    if (gender && !['M', 'F', 'UN'].includes(gender)) {
        errors.push({ message: `Invalid gender: ${gender}`, type: 'value-set' });
    }

    // ── REPORTER NAME (C.2.r.2) ──────────────────────────────────────────────
    const reporterGiven = select("string(//authorOrPerformer//assignedPerson/name/given)", doc) as string;
    const reporterFamily = select("string(//authorOrPerformer//assignedPerson/name/family)", doc) as string;
    if (!reporterGiven.trim() && !reporterFamily.trim()) {
        errors.push({ message: 'Reporter name is empty (C.2.r.2)', type: 'compliance' });
    }

    // ── CAUSALITY VALUE SET (G.k.9.i) ───────────────────────────────────────
    // Allowed codes: 1 = Certain, 2 = Probable, 3 = Possible, 4 = Unlikely, 5 = Conditional, 6 = Unassessable
    const causalityNodes = select("//outboundRelationship[@typeCode='CAUS']//value/@code", doc) as any[];
    causalityNodes.forEach((node, idx) => {
        const causalityCode = node.nodeValue;
        if (causalityCode && !['1','2','3','4','5','6'].includes(causalityCode)) {
            errors.push({ message: `Invalid causality code: ${causalityCode} at drug[${idx}] (G.k.9.i must be 1-6)`, type: 'value-set' });
        }
    });

    // ── ROUTE CODE (G.k.4) ──────────────────────────────────────────────────
    // NOTE: Full ICH route code list not yet available
    // TODO: Replace format-only check with value-set check when product DB is ready
    const routeNodes = select("//routeCode/@code", doc) as any[];
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
    const drugNames = select("//kindOfMaterialKind/name", doc) as any[];
    drugNames.forEach((node, idx) => {
        const name = (node as any).textContent?.trim();
        if (!name || name === 'Unknown Drug') {
            errors.push({ message: `Drug[${idx}] product name missing (G.k.2.2)`, type: 'compliance' });
        }
    });

    const dateRegex = /^\d{14}$/;
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

    checkDate("//creationTime/@value", "creationTime");
    checkDate("//birthTime/@value", "birthTime");
    checkDate("//availabilityTime/@value", "availabilityTime");
    checkDate("//observation[code/@code='ASSERTION']/effectiveTime/low/@value", "Reaction low date");
    checkDate("//organizer[code/@code='1']//substanceAdministration/effectiveTime/low/@value", "Suspect Drug low date");

    // --- MedDRA Discovery (XPath Fix 3: XPath 1.0 compatibility) ---
    const meddraNodes = select("//*[@codeSystem='2.16.840.1.113883.6.163']", doc) as any[];
    meddraNodes.forEach((node) => {
      const code = node.getAttribute('code');
      if (code && meddraLltCache && !meddraLltCache.has(code)) {
        // Try to get a helpful parent name for context
        const parentName = select("string(ancestor::*[@displayName][1]/@displayName)", node) 
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

    // Fix 4: Deterministic Sort (a, b)
    const result = await validateXML({
      xml: xml.replace(/xsi:schemaLocation="[^"]*"/g, ''),
      schema: schemaFiles.sort((a, b) => {
        if (a.fileName.includes('MCCI_IN200100UV01')) return -1;
        if (b.fileName.includes('MCCI_IN200100UV01')) return 1;
        return 0;
      }),
      extension: 'schema'
    });

    // Fix 5: Ensure 100% visible error messages (Catch and Normalize)
    // CRITICAL: every error object MUST have a non-undefined `message` string.
    const normalizeError = (e: any): { message: string; type: string } => {
      if (typeof e === 'string' && e.trim()) return { message: e, type: 'schema' };
      if (e && typeof e === 'object') {
        const msg: string =
          (typeof e.message === 'string' && e.message.trim() ? e.message : null) ||
          (typeof e.text    === 'string' && e.text.trim()    ? e.text    : null) ||
          (typeof e.toString === 'function' && e.toString() !== '[object Object]' ? e.toString() : null) ||
          (Object.keys(e).length > 0 ? JSON.stringify(e) : null) ||
          'Unknown schema validation error';
        return { message: msg, type: (e.type as string) || 'schema' };
      }
      return { message: 'Unknown validation error', type: 'schema' };
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
    const message = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : JSON.stringify(error) ?? 'Unknown validation error';
    return { valid: false, errors: [{ message, type: 'exception' }] };
  }
}
