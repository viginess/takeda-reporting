import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY;
const TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION;
const TRANSLATOR_ENDPOINT = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0';

export interface TranslationResult {
  translatedText: string;
  detectedLanguage: string;
}

// In-memory cache to prevent redundant API calls for identical texts during a session
const translationCache = new Map<string, TranslationResult>();

/**
 * Translates text into English using Azure AI Translator.
 * This is crucial for ICH E2B(R3) compliance where global narratives (H.1) 
 * should ideally be in English.
 */
export async function translateToEnglish(text: string): Promise<TranslationResult> {
  console.log('[TRANS] translateToEnglish called for text length:', text?.length);
  if (!text || text.trim().length === 0) {
    return { translatedText: '', detectedLanguage: 'unknown' };
  }

  // Check Cache
  const cacheKey = text.trim();
  if (translationCache.has(cacheKey)) {
    console.log('[TRANS] Returning cached translation');
    return translationCache.get(cacheKey)!;
  }

  if (!TRANSLATOR_KEY || !TRANSLATOR_REGION) {
    console.warn('Azure Translator credentials missing. Returning original text.');
    return { translatedText: text, detectedLanguage: 'unknown' };
  }

  try {
    const response = await axios({
      url: TRANSLATOR_ENDPOINT,
      method: 'post',
      params: {
        'to': 'en'
      },
      headers: {
        'Ocp-Apim-Subscription-Key': TRANSLATOR_KEY,
        'Ocp-Apim-Subscription-Region': TRANSLATOR_REGION,
        'Content-type': 'application/json'
      },
      data: [{
        'text': text
      }],
      responseType: 'json'
    });

    const data = response.data[0];
    const result = {
      translatedText: data.translations[0].text,
      detectedLanguage: data.detectedLanguage?.language || 'unknown'
    };
    
    // Save to cache
    translationCache.set(cacheKey, result);
    return result;
  } catch (error: any) {
    console.error('Azure Translation Error:', error.response?.data || error.message);
    return { translatedText: text, detectedLanguage: 'unknown' };
  }
}
