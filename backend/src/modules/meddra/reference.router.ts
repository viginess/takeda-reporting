import { z } from "zod";
import { router, publicProcedure } from "../../trpc/init.js";
import fs from 'fs';
import path from 'path';

// Define the absolute path to the parsed JSON
const TERMS_FILE = path.resolve(process.cwd(), 'src/modules/meddra/meddra_dictionary.json');

let termsRaw = '[]';
try {
  termsRaw = fs.readFileSync(TERMS_FILE, 'utf8');
} catch (e) {
  console.error('Failed to read meddra_dictionary.json:', e);
}

let terms: Array<{ code: string; term: string; type: string; description?: string }> = [];
try {
  terms = JSON.parse(termsRaw);
} catch (e) {
  console.error('Failed to parse meddra_dictionary.json:', e);
}

function getMedDRATerms() {
  return terms;
}

export const referenceRouter = router({
  /**
   * Searches the Patient-Friendly MedDRA terms.
   */
  searchMeddra: publicProcedure
    .input(z.object({
      query: z.string().min(2),
      limit: z.number().max(50).default(10)
    }))
    .query(({ input }) => {
      const terms = getMedDRATerms();
      if (!terms || terms.length === 0) return [];

      const query = input.query.toLowerCase();
      
      // 1. Direct matches with codes
      const directMatches = terms.filter(t => 
        (t.code && (
          t.term.toLowerCase().includes(query) || 
          (t.description && t.description.toLowerCase().includes(query)) ||
          t.code.includes(query)
        ))
      );

      // 2. Resolve synonyms (terms without codes that point to coded terms)
      // e.g. "AIDS" might have code: null but description: "Acquired immune deficiency syndrome"
      const synonyms = terms.filter(t => 
        !t.code && t.term.toLowerCase().includes(query)
      );

      const resolvedSynonyms: any[] = [];
      synonyms.forEach(syn => {
        let target = syn.description || syn.term;
        // Clean "Acronym: SHORT. FULL" pattern
        if (target.includes('. ')) {
          const parts = target.split('. ');
          target = parts[parts.length - 1]; // Take the last part (usually the full term)
        }
        target = target.replace(/Acronym: /gi, '').trim();

        // Find matches that are coded and have significant word overlap
        const targetWords = target.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        
        const matches = terms.filter(t => {
          const tTerm = t.term.toLowerCase();
          const tDesc = (t.description || '').toLowerCase();
          
          // 1. Exact included match (very strong)
          if (tTerm.includes(target.toLowerCase()) || target.toLowerCase().includes(tTerm)) return true;
          
          // 2. Word overlap (strong)
          if (targetWords.length > 0) {
            const overlap = targetWords.filter(w => tTerm.includes(w) || tDesc.includes(w));
            return overlap.length >= Math.min(targetWords.length, 2);
          }
          
          return false;
        });
        
        if (matches.length > 0) {
          resolvedSynonyms.push(...matches);
        } else {
          // Fallback: If no coded/uncoded matches found in full dictionary, just return the synonym itself
          resolvedSynonyms.push(syn);
        }
      });

      // Combine and remove duplicates based on code or term
      const results = [...directMatches, ...resolvedSynonyms];
      const uniqueResults = Array.from(new Map(results.map(item => [item.code || item.term, item])).values());
      
      // Sort priority:
      // 1. Term starts with query
      // 2. Term contains query
      // 3. Description starts with query
      // 4. Everything else
      // Sort and slice
      uniqueResults.sort((a, b) => {
        const aTerm = a.term.toLowerCase();
        const bTerm = b.term.toLowerCase();
        const aDesc = a.description?.toLowerCase() || '';
        const bDesc = b.description?.toLowerCase() || '';

        const aStarts = aTerm.startsWith(query);
        const bStarts = bTerm.startsWith(query);
        
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        if (aStarts && bStarts) return aTerm.length - bTerm.length;

        const aContains = aTerm.includes(query);
        const bContains = bTerm.includes(query);
        if (aContains && !bContains) return -1;
        if (!aContains && bContains) return 1;

        const aDescStarts = aDesc.startsWith(query);
        const bDescStarts = bDesc.startsWith(query);
        if (aDescStarts && !bDescStarts) return -1;
        if (!aDescStarts && bDescStarts) return 1;

        return aTerm.length - bTerm.length;
      });

      return uniqueResults.slice(0, input.limit);
    }),

  /**
   * Gets a specific MedDRA term by its 8-digit code.
   */
  getTermByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(({ input }) => {
      const terms = getMedDRATerms();
      return terms.find(t => t.code === input.code) || null;
    }),
});
