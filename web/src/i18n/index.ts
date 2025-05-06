import en from './locales/en.json';

// Supported locales
export type Locale = 'en' | 'zh' | 'es';

// Available translations
const translations: Record<Locale, any> = {
  en,
  // Other locales will be loaded dynamically
  zh: {},
  es: {}
};

// Current locale (default to browser language or fall back to English)
let currentLocale: Locale = 'en';

// Try to detect browser language on initialization
const initLocale = (): void => {
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'zh' || browserLang === 'es') {
    currentLocale = browserLang as Locale;
    loadLocale(currentLocale);
  }
};

// Initialize on import
initLocale();

// Load a locale dynamically
const loadLocale = async (locale: Locale): Promise<void> => {
  if (locale === 'en' || Object.keys(translations[locale]).length > 0) {
    return; // English is always loaded or locale already loaded
  }
  
  try {
    const localeData = await import(`./locales/${locale}.json`);
    translations[locale] = localeData.default;
  } catch (error) {
    console.error(`Failed to load locale: ${locale}`, error);
    // Fall back to English
    currentLocale = 'en';
  }
};

// Get current locale
export const getLocale = (): Locale => currentLocale;

// Set locale
export const setLocale = async (locale: Locale): Promise<void> => {
  if (locale !== currentLocale) {
    await loadLocale(locale);
    currentLocale = locale;
  }
};

// Translation function
export const t = (key: string, params: Record<string, string | number> = {}): string => {
  // Get translation string
  let translationString = key.split('.').reduce((obj, k) => obj && obj[k], translations[currentLocale]);
  
  // Fallback to English if not found in current locale
  if (!translationString && currentLocale !== 'en') {
    translationString = key.split('.').reduce((obj, k) => obj && obj[k], translations.en);
  }
  
  // If still not found, return the key itself
  if (!translationString) {
    return key;
  }
  
  // Replace parameters in the string
  return Object.entries(params).reduce(
    (str, [paramKey, paramValue]) => str.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue)),
    translationString
  );
};

export default {
  t,
  getLocale,
  setLocale
}; 