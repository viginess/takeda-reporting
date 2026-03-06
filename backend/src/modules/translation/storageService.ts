import { getSupabaseAdmin } from "../../utils/supabase.js";

const BUCKET_NAME = "locales";

/**
 * Service to handle Supabase Storage bucket operations for JSON locales.
 */
export const storageService = {
  /**
   * Fetches a translation file from Supabase Storage.
   */
  getTranslation: async (languageCode: string): Promise<any | null> => {
    const { data, error } = await getSupabaseAdmin().storage
      .from(BUCKET_NAME)
      .download(`${languageCode}.json`);

    if (error) {
      if (error.message.includes("Object not found")) return null;
      console.error(`[StorageService] Error downloading ${languageCode}.json:`, {
        message: error.message,
        name: error.name,
        status: (error as any).status,
        statusCode: (error as any).statusCode
      });
      return null;
    }

    const text = await data.text();
    return JSON.parse(text);
  },

  /**
   * Uploads a translation file to Supabase Storage.
   */
  uploadTranslation: async (languageCode: string, content: any): Promise<void> => {
    const { error } = await getSupabaseAdmin().storage
      .from(BUCKET_NAME)
      .upload(`${languageCode}.json`, JSON.stringify(content), {
        contentType: "application/json",
        upsert: true,
      });

    if (error) {
      throw error;
    }
  },
};
