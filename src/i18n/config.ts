import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English
import commonEN from './locales/en/common.json';
import sidepanelEN from './locales/en/sidepanel.json';
import optionsEN from './locales/en/options.json';
import popupEN from './locales/en/popup.json';
import resultsEN from './locales/en/results.json';
import iocEN from './locales/en/ioc.json';
import errorsEN from './locales/en/errors.json';

// Turkish
import commonTR from './locales/tr/common.json';
import sidepanelTR from './locales/tr/sidepanel.json';
import optionsTR from './locales/tr/options.json';
import popupTR from './locales/tr/popup.json';
import resultsTR from './locales/tr/results.json';
import iocTR from './locales/tr/ioc.json';
import errorsTR from './locales/tr/errors.json';

// Spanish
import commonES from './locales/es/common.json';
import sidepanelES from './locales/es/sidepanel.json';
import optionsES from './locales/es/options.json';
import popupES from './locales/es/popup.json';
import resultsES from './locales/es/results.json';
import iocES from './locales/es/ioc.json';
import errorsES from './locales/es/errors.json';

// Chinese Simplified
import commonZHCN from './locales/zh-CN/common.json';
import sidepanelZHCN from './locales/zh-CN/sidepanel.json';
import optionsZHCN from './locales/zh-CN/options.json';
import popupZHCN from './locales/zh-CN/popup.json';
import resultsZHCN from './locales/zh-CN/results.json';
import iocZHCN from './locales/zh-CN/ioc.json';
import errorsZHCN from './locales/zh-CN/errors.json';

// Italian
import commonIT from './locales/it/common.json';
import sidepanelIT from './locales/it/sidepanel.json';
import optionsIT from './locales/it/options.json';
import popupIT from './locales/it/popup.json';
import resultsIT from './locales/it/results.json';
import iocIT from './locales/it/ioc.json';
import errorsIT from './locales/it/errors.json';

// Hindi
import commonHI from './locales/hi/common.json';
import sidepanelHI from './locales/hi/sidepanel.json';
import optionsHI from './locales/hi/options.json';
import popupHI from './locales/hi/popup.json';
import resultsHI from './locales/hi/results.json';
import iocHI from './locales/hi/ioc.json';
import errorsHI from './locales/hi/errors.json';

// Japanese
import commonJA from './locales/ja/common.json';
import sidepanelJA from './locales/ja/sidepanel.json';
import optionsJA from './locales/ja/options.json';
import popupJA from './locales/ja/popup.json';
import resultsJA from './locales/ja/results.json';
import iocJA from './locales/ja/ioc.json';
import errorsJA from './locales/ja/errors.json';

// Portuguese (Brazil)
import commonPTBR from './locales/pt-BR/common.json';
import sidepanelPTBR from './locales/pt-BR/sidepanel.json';
import optionsPTBR from './locales/pt-BR/options.json';
import popupPTBR from './locales/pt-BR/popup.json';
import resultsPTBR from './locales/pt-BR/results.json';
import iocPTBR from './locales/pt-BR/ioc.json';
import errorsPTBR from './locales/pt-BR/errors.json';

// Russian
import commonRU from './locales/ru/common.json';
import sidepanelRU from './locales/ru/sidepanel.json';
import optionsRU from './locales/ru/options.json';
import popupRU from './locales/ru/popup.json';
import resultsRU from './locales/ru/results.json';
import iocRU from './locales/ru/ioc.json';
import errorsRU from './locales/ru/errors.json';

// French
import commonFR from './locales/fr/common.json';
import sidepanelFR from './locales/fr/sidepanel.json';
import optionsFR from './locales/fr/options.json';
import popupFR from './locales/fr/popup.json';
import resultsFR from './locales/fr/results.json';
import iocFR from './locales/fr/ioc.json';
import errorsFR from './locales/fr/errors.json';

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  tr: 'Türkçe',
  es: 'Español',
  'zh-CN': '简体中文',
  it: 'Italiano',
  hi: 'हिन्दी',
  ja: '日本語',
  'pt-BR': 'Português (Brasil)',
  ru: 'Русский',
  fr: 'Français'
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
  },
  es: {
    common: commonES,
    sidepanel: sidepanelES,
    options: optionsES,
    popup: popupES,
    results: resultsES,
    ioc: iocES,
    errors: errorsES
  },
  'zh-CN': {
    common: commonZHCN,
    sidepanel: sidepanelZHCN,
    options: optionsZHCN,
    popup: popupZHCN,
    results: resultsZHCN,
    ioc: iocZHCN,
    errors: errorsZHCN
  },
  it: {
    common: commonIT,
    sidepanel: sidepanelIT,
    options: optionsIT,
    popup: popupIT,
    results: resultsIT,
    ioc: iocIT,
    errors: errorsIT
  },
  hi: {
    common: commonHI,
    sidepanel: sidepanelHI,
    options: optionsHI,
    popup: popupHI,
    results: resultsHI,
    ioc: iocHI,
    errors: errorsHI
  },
  ja: {
    common: commonJA,
    sidepanel: sidepanelJA,
    options: optionsJA,
    popup: popupJA,
    results: resultsJA,
    ioc: iocJA,
    errors: errorsJA
  },
  'pt-BR': {
    common: commonPTBR,
    sidepanel: sidepanelPTBR,
    options: optionsPTBR,
    popup: popupPTBR,
    results: resultsPTBR,
    ioc: iocPTBR,
    errors: errorsPTBR
  },
  ru: {
    common: commonRU,
    sidepanel: sidepanelRU,
    options: optionsRU,
    popup: popupRU,
    results: resultsRU,
    ioc: iocRU,
    errors: errorsRU
  },
  fr: {
    common: commonFR,
    sidepanel: sidepanelFR,
    options: optionsFR,
    popup: popupFR,
    results: resultsFR,
    ioc: iocFR,
    errors: errorsFR
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
