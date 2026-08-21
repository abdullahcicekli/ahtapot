/**
 * AI Preferences Storage
 * Stores and retrieves user's AI provider/model/mode preferences
 */

import { AIProvider, AIAnalysisMode, AI_PROVIDER_CONFIGS } from '@/types/ai';

const STORAGE_KEY = 'aiPreferences';

export interface AIPreferences {
  provider: AIProvider;
  model: string;
  mode: AIAnalysisMode;
  /* Per-provider model choice, made in settings; `model` mirrors the active
     provider's choice for backwards compatibility. */
  modelByProvider?: Partial<Record<AIProvider, string>>;
}

const DEFAULT_PREFERENCES: AIPreferences = {
  provider: AIProvider.GEMINI,
  model: 'gemini-3.7-flash',
  mode: AIAnalysisMode.SUMMARY,
};

/**
 * Get stored AI preferences
 */
export async function getAIPreferences(): Promise<AIPreferences> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    if (result[STORAGE_KEY]) {
      return { ...DEFAULT_PREFERENCES, ...result[STORAGE_KEY] };
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error getting AI preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save AI preferences
 */
export async function saveAIPreferences(preferences: Partial<AIPreferences>): Promise<void> {
  try {
    const current = await getAIPreferences();
    const updated = { ...current, ...preferences };
    await chrome.storage.local.set({ [STORAGE_KEY]: updated });
  } catch (error) {
    console.error('Error saving AI preferences:', error);
  }
}

/**
 * Get default model for a provider (the recommended mid tier)
 */
export function getDefaultModelForProvider(provider: AIProvider): string {
  const config = AI_PROVIDER_CONFIGS[provider];
  return (
    config.models.find((m) => m.recommended)?.id ||
    config.models[0]?.id ||
    config.modelName
  );
}

/**
 * Get the model chosen in settings for a provider, falling back to the
 * recommended default when nothing (or a stale id) is stored.
 */
export async function getModelForProvider(provider: AIProvider): Promise<string> {
  const preferences = await getAIPreferences();
  const stored = preferences.modelByProvider?.[provider];
  if (stored && AI_PROVIDER_CONFIGS[provider].models.some((m) => m.id === stored)) {
    return stored;
  }
  return getDefaultModelForProvider(provider);
}

/**
 * Persist the model chosen in settings for a provider.
 */
export async function saveModelForProvider(provider: AIProvider, model: string): Promise<void> {
  const preferences = await getAIPreferences();
  await saveAIPreferences({
    modelByProvider: { ...preferences.modelByProvider, [provider]: model },
    // keep the flat field in sync when the active provider's model changes
    ...(preferences.provider === provider ? { model } : {}),
  });
}

/**
 * Validate and get model for provider
 * Returns default if saved model is not valid for the provider
 */
export function getValidModelForProvider(provider: AIProvider, savedModel: string): string {
  const config = AI_PROVIDER_CONFIGS[provider];
  const isValid = config.models.some(m => m.id === savedModel);
  return isValid ? savedModel : getDefaultModelForProvider(provider);
}

