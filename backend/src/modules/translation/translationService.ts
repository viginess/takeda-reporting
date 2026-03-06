import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// This service handles interaction with the Microsoft Azure Translator API.
const apiKey = process.env.AZURE_TRANSLATOR_KEY;
const region = process.env.AZURE_TRANSLATOR_REGION;
const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT || "https://api.cognitive.microsofttranslator.com";

export const translateText = async (
  text: string[],
  targetLanguage: string,
): Promise<string[]> => {
  if (!apiKey || !region) {
    throw new Error("AZURE_TRANSLATOR_KEY or AZURE_TRANSLATOR_REGION is not configured.");
  }

  // Azure handles arrays differently; we pass an array of objects
  const body = text.map((t) => ({ text: t }));

  try {
    const response = await axios({
      baseURL: endpoint,
      url: "/translate",
      method: "post",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Ocp-Apim-Subscription-Region": region,
        "Content-type": "application/json",
      },
      params: {
        "api-version": "3.0",
        from: "en",
        to: targetLanguage,
      },
      data: body,
      responseType: "json",
    });

    if (response.status !== 200) {
      throw new Error(`Azure translation error: ${response.data}`);
    }

    // Azure returns an array mapping exactly to our input array
    const translatedResults = response.data.map((item: any) => {
      // It returns an array of translations per input string, we only asked for 1
      return item.translations[0].text;
    });

    return translatedResults;
  } catch (error) {
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
