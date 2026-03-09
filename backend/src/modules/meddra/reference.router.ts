import { z } from "zod";
import { router, publicProcedure } from "../../trpc/init.js";
import fs from 'fs';
import path from 'path';

// Define the absolute path to the parsed JSON
const TERMS_FILE = path.resolve(process.cwd(), 'src/modules/meddra/patient_friendly_terms.json');



function getMedDRATerms() {
  if (fs.existsSync(TERMS_FILE)) {
    try {
      const data = fs.readFileSync(TERMS_FILE, 'utf-8');
      return JSON.parse(data) as Array<{ code: string; term: string; type: string; description?: string }>;
    } catch (e) {
      console.error('Failed to parse patient_friendly_terms.json:', e);
      return [];
    }
  }
  return [];
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
      
      // Filter by term or description matching the query
      const results = terms.filter(t => 
        t.term.toLowerCase().includes(query) || 
        (t.description && t.description.toLowerCase().includes(query))
      );
      
      // Sort priority:
      // 1. Term starts with query
      // 2. Term contains query
      // 3. Description starts with query
      // 4. Everything else
      results.sort((a, b) => {
        const aTerm = a.term.toLowerCase();
        const bTerm = b.term.toLowerCase();
        const aDesc = a.description?.toLowerCase() || '';
        const bDesc = b.description?.toLowerCase() || '';

        const aStarts = aTerm.startsWith(query);
        const bStarts = bTerm.startsWith(query);
        
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // If both start with query, shorter term is usually better (more general)
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

      return results.slice(0, input.limit);
    }),
});
