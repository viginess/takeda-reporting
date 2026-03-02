import { TranslationServiceClient } from "@google-cloud/translate";

// This service handles interaction with the Google Cloud Translation API.
// It assumes that GOOGLE_APPLICATION_CREDENTIALS or other authentication methods are configured.

const projectId = process.env.GOOGLE_PROJECT_ID;
const location = "global";

const translationClient = new TranslationServiceClient();

export const translateText = async (
  text: string[],
  targetLanguage: string,
): Promise<string[]> => {
  if (!projectId) {
    console.error("GOOGLE_PROJECT_ID is not configured.");
    throw new Error("Translation service configuration missing.");
  }

  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: text,
    mimeType: "text/plain",
    sourceLanguageCode: "en",
    targetLanguageCode: targetLanguage,
  };

  try {
    const [response] = await translationClient.translateText(request);
    return response.translations?.map((t) => t.translatedText ?? "") ?? [];
  } catch (error) {
    console.error("Error during translation:", error);
    throw error;
  }
};

/**
 * Translates a JSON object (locale file) recursively.
 * Keeps keys intact and translates only the string values.
 */
export const translateLocale = async (
  obj: any,
  targetLanguage: string,
): Promise<any> => {
  const keys: string[] = [];
  const values: string[] = [];

  // Helper to extract values
  const extract = (current: any, prefix = "") => {
    for (const key in current) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof current[key] === "string") {
        keys.push(fullKey);
        values.push(current[key]);
      } else if (typeof current[key] === "object") {
        extract(current[key], fullKey);
      }
    }
  };

  extract(obj);

  if (values.length === 0) return obj;

  const translatedValues = await translateText(values, targetLanguage);

  // Helper to reconstruct object
  const result = JSON.parse(JSON.stringify(obj));
  const setDeep = (current: any, path: string[], value: string) => {
    const key = path[0];
    if (path.length === 1) {
      current[key] = value;
    } else {
      setDeep(current[key], path.slice(1), value);
    }
  };

  keys.forEach((key, index) => {
    setDeep(result, key.split("."), translatedValues[index]);
  });

  return result;
};
