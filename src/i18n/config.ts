import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEN from './locales/en/common.json';
import sidepanelEN from './locales/en/sidepanel.json';
import optionsEN from './locales/en/options.json';
import popupEN from './locales/en/popup.json';
import resultsEN from './locales/en/results.json';
import iocEN from './locales/en/ioc.json';
import errorsEN from './locales/en/errors.json';

import commonTR from './locales/tr/common.json';
import sidepanelTR from './locales/tr/sidepanel.json';
import optionsTR from './locales/tr/options.json';
import popupTR from './locales/tr/popup.json';
import resultsTR from './locales/tr/results.json';
import iocTR from './locales/tr/ioc.json';
import errorsTR from './locales/tr/errors.json';

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  tr: 'Türkçe'
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
export const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

const resources = {
  en: {
    common: commonEN,
    sidepanel: sidepanelEN,
    options: optionsEN,
    popup: popupEN,
    results: resultsEN,
    ioc: iocEN,
    errors: errorsEN
  },
  tr: {
    common: commonTR,
    sidepanel: sidepanelTR,
    options: optionsTR,
    popup: popupTR,
    results: resultsTR,
    ioc: iocTR,
    errors: errorsTR
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: FALLBACK_LANGUAGE,
    defaultNS: 'common',
    ns: ['common', 'sidepanel', 'options', 'popup', 'results', 'ioc', 'errors'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'ahtapot_language'
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
