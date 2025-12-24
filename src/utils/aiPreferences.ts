/**
 * AI Preferences Storage
 * Stores and retrieves user's AI provider/model/mode preferences
 */

import { AIProvider, AIAnalysisMode, AI_PROVIDER_CONFIGS } from '@/types/ai';
import { storage } from '@/platform';

const STORAGE_KEY = 'aiPreferences';

export interface AIPreferences {
  provider: AIProvider;
  model: string;
  mode: AIAnalysisMode;
}

const DEFAULT_PREFERENCES: AIPreferences = {
  provider: AIProvider.GEMINI,
  model: 'gemini-2.0-flash',
  mode: AIAnalysisMode.SUMMARY,
};

/**
 * Get stored AI preferences
 */
export async function getAIPreferences(): Promise<AIPreferences> {
  try {
    const result = await storage.local.get(STORAGE_KEY);
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
    await storage.local.set({ [STORAGE_KEY]: updated });
  } catch (error) {
    console.error('Error saving AI preferences:', error);
  }
}

/**
 * Get default model for a provider
 */
export function getDefaultModelForProvider(provider: AIProvider): string {
  const config = AI_PROVIDER_CONFIGS[provider];
  return config.models[0]?.id || config.modelName;
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

