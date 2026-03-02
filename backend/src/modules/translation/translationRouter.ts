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

      if (languageCode === "en") {
        const enContent = await fs.readFile(EN_JSON_PATH, "utf-8");
        return JSON.parse(enContent);
      }

      // 1. Check cache (Supabase Storage)
      const cached = await storageService.getTranslation(languageCode);
      if (cached) return cached;

      // 2. If missing, translate from English base
      const enContent = await fs.readFile(EN_JSON_PATH, "utf-8");
      const enJson = JSON.parse(enContent);

      const translated = await translateLocale(enJson, languageCode);

      // 3. Save to cache
      await storageService.uploadTranslation(languageCode, translated);

      return translated;
    }),
});
