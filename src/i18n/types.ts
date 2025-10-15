export type TranslationNamespace =
  | 'common'
  | 'sidepanel'
  | 'options'
  | 'popup'
  | 'results'
  | 'ioc'
  | 'errors';

export type TranslationKey<T extends TranslationNamespace> = string;

export interface TranslationOptions {
  count?: number;
  context?: string;
  defaultValue?: string;
  [key: string]: any;
}
