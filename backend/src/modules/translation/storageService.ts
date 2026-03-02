import { supabaseAdmin } from "../../utils/supabase.js";

const BUCKET_NAME = "locales";

/**
 * Service to handle Supabase Storage bucket operations for JSON locales.
 */
export const storageService = {
  /**
   * Fetches a translation file from Supabase Storage.
   */
  getTranslation: async (languageCode: string): Promise<any | null> => {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(`${languageCode}.json`);

    if (error) {
      if (error.message.includes("Object not found")) return null;
      console.error(`Error downloading translation (${languageCode}):`, error);
      return null;
    }

    const text = await data.text();
    return JSON.parse(text);
  },

  /**
   * Uploads a translation file to Supabase Storage.
   */
  uploadTranslation: async (languageCode: string, content: any): Promise<void> => {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(`${languageCode}.json`, JSON.stringify(content), {
        contentType: "application/json",
        upsert: true,
      });

    if (error) {
      console.error(`Error uploading translation (${languageCode}):`, error);
      throw error;
    }
  },
};
