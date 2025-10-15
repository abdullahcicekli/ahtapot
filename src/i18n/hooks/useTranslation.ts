import { useTranslation as useI18nextTranslation } from 'react-i18next';
import type { TranslationNamespace, TranslationOptions } from '../types';

export function useTranslation(namespace?: TranslationNamespace) {
  const { t, i18n, ready } = useI18nextTranslation(namespace);

  const translate = (
    key: string,
    options?: TranslationOptions
  ): string => {
    return t(key, options);
  };

  return {
    t: translate,
    i18n,
    ready,
    language: i18n.language,
    changeLanguage: i18n.changeLanguage
  };
}
