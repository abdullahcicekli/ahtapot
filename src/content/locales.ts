/**
 * Content Script Localization
 * Browser diline göre çeviri desteği
 */

export type LocaleKey =
  | 'noIOCsFound'
  | 'clickToAnalyze'
  | 'escToClose'
  | 'uniqueIOCs'
  | 'occurrences';

type LocaleMessages = Record<LocaleKey, Record<'en' | 'tr', string>>;

const messages: LocaleMessages = {
  noIOCsFound: {
    en: 'No IOCs detected on this page',
    tr: 'Bu sayfada IOC tespit edilemedi'
  },
  clickToAnalyze: {
    en: 'Click to analyze',
    tr: 'Analiz etmek için tıklayın'
  },
  escToClose: {
    en: 'to close',
    tr: 'kapatmak için'
  },
  uniqueIOCs: {
    en: 'unique IOC',
    tr: 'benzersiz IOC'
  },
  occurrences: {
    en: 'occurrence',
    tr: 'bulgu'
  }
};

/**
 * Get localized message based on browser language
 */
export function t(key: LocaleKey): string {
  const lang = navigator.language.toLowerCase();
  const isTurkish = lang.startsWith('tr');
  const locale = isTurkish ? 'tr' : 'en';

  return messages[key]?.[locale] || messages[key]?.['en'] || key;
}

/**
 * Check if current browser language is Turkish
 */
export function isTurkish(): boolean {
  return navigator.language.toLowerCase().startsWith('tr');
}
