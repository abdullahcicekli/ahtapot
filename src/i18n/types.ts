export type TranslationNamespace =
  | 'common'
  | 'sidepanel'
  | 'options'
  | 'popup'
  | 'results'
  | 'ioc'
  | 'errors';

export type TranslationKey<T extends TranslationNamespace = TranslationNamespace> = T extends string ? string : string;

export interface TranslationOptions {
  count?: number;
  context?: string;
  defaultValue?: string;
  [key: string]: any;
}
