import { z } from "zod";
import { router, publicProcedure } from "../../trpc/init.js";
import { storageService } from "./storageService.js";
import { translateLocale } from "./translationService.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the base English file in the frontend
const EN_JSON_PATH = path.resolve(
  __dirname,
  "../../../../frontend/src/locales/en.json",
);

export const translationRouter = router({
  getLanguage: publicProcedure
    .input(z.object({ languageCode: z.string() }))
    .mutation(async ({ input }) => {
      const { languageCode } = input;

      const enContent = await fs.readFile(EN_JSON_PATH, "utf-8");
      const enJson = JSON.parse(enContent);

      if (languageCode === "en") {
        return enJson;
      }

      // 1. Check cache (Supabase Storage)
      const cached = await storageService.getTranslation(languageCode);
      
      if (cached) {
        // Deep compare and find missing keys
        const missingKeys: Record<string, any> = {};
        let hasMissing = false;

        const findMissing = (en: any, cache: any, target: any) => {
          for (const key in en) {
            if (cache[key] === undefined) {
              target[key] = en[key];
              hasMissing = true;
            } else if (typeof en[key] === "object" && en[key] !== null) {
              if (typeof cache[key] !== "object") {
                target[key] = en[key];
                hasMissing = true;
              } else {
                const subTarget: any = {};
                findMissing(en[key], cache[key], subTarget);
                if (Object.keys(subTarget).length > 0) {
                  target[key] = subTarget;
                }
              }
            }
          }
        };

        findMissing(enJson, cached, missingKeys);

        if (!hasMissing) {
          return cached;
        }

        // Translate only the missing keys
        try {
          const translatedMissing = await translateLocale(missingKeys, languageCode);

          // Deep merge
          const merge = (target: any, source: any) => {
            for (const key in source) {
              if (typeof source[key] === "object" && source[key] !== null) {
                if (!target[key]) target[key] = {};
                merge(target[key], source[key]);
              } else {
                target[key] = source[key];
              }
            }
            return target;
          };

          const updated = merge(JSON.parse(JSON.stringify(cached)), translatedMissing);
          
          // 3. Update cache
          await storageService.uploadTranslation(languageCode, updated);
          return updated;
        } catch (error) {
          console.error(`Partial translation failed for ${languageCode}, returning stale cache:`, error);
          return cached;
        }
      }

      // 2. If completely missing, translate everything
      try {
        const translated = await translateLocale(enJson, languageCode);

        // 3. Save to cache
        await storageService.uploadTranslation(languageCode, translated);

        return translated;
      } catch (error) {
        console.error(`Translation failed for ${languageCode}, falling back to English:`, error);
        return enJson;
      }
    }),
});
