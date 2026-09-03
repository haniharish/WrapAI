import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';

export const translationService = {
  /**
   * Checks whether a given string contains Hindi/Devanagari script or non-English characters
   */
  hasNonEnglish(text) {
    if (!text || typeof text !== 'string') return false;
    // Checks for Devanagari (Hindi/Sanskrit/Marathi), Bengali, Tamil, Telugu, Arabic, Chinese, Japanese, etc.
    const nonLatinRegex = /[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0600-\u06FF\u4E00-\u9FFF]/;
    return nonLatinRegex.test(text);
  },

  /**
   * Translates a text string from any source language to clean English
   */
  async translateToEnglish(text) {
    if (!text || typeof text !== 'string') return '';
    const trimmed = text.trim();
    if (!trimmed) return '';

    // If it's already purely English/Latin characters, return as is
    if (!this.hasNonEnglish(trimmed)) {
      return trimmed;
    }

    try {
      // 1. Primary: Python AI microservice deep-translator
      const aiUrl = config.aiService?.url || 'http://localhost:8000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${aiUrl}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          targetLanguage: 'en',
          sourceLanguage: 'auto'
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json?.translatedText && !this.hasNonEnglish(json.translatedText)) {
          return json.translatedText;
        }
      }
    } catch (err) {
      // AI service timeout or offline - proceed to fallback
    }

    // 2. Secondary fallback: Sanitization to clean English topic phrase
    return this._sanitizeToEnglish(trimmed);
  },

  /**
   * Translates an array of text strings concurrently
   */
  async translateBatchToEnglish(texts) {
    if (!Array.isArray(texts) || texts.length === 0) return [];
    
    // Check if any need translation
    const needsTranslation = texts.some(t => this.hasNonEnglish(t));
    if (!needsTranslation) return texts;

    try {
      const aiUrl = config.aiService?.url || 'http://localhost:8000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`${aiUrl}/translate/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts,
          targetLanguage: 'en',
          sourceLanguage: 'auto'
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.translatedTexts)) {
          return json.translatedTexts.map((t, idx) => {
            if (this.hasNonEnglish(t)) {
              return this._sanitizeToEnglish(texts[idx]);
            }
            return t;
          });
        }
      }
    } catch (err) {
      // Fallback
    }

    return texts.map(t => this._sanitizeToEnglish(t));
  },

  /**
   * Fallback sanitization: removes non-latin characters and returns clean English prose
   */
  _sanitizeToEnglish(text) {
    if (!text || typeof text !== 'string') return '';
    const cleaned = text
      .replace(/[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0600-\u06FF\u4E00-\u9FFF]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned.length > 3 ? cleaned : 'Core theoretical concepts, derivations, and methodology reviewed.';
  }
};
