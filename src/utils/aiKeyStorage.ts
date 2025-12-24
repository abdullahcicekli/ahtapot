/**
 * AI API Key Storage Utilities
 * Handles storage and retrieval of AI provider API keys
 */

import { AIProvider, AIKeyData } from '@/types/ai';
import { storage } from '@/platform';

export type AIKeysStorage = Record<AIProvider, AIKeyData>;

const AI_KEYS_STORAGE_KEY = 'aiApiKeys';

/**
 * Get all AI API keys from storage
 */
export async function getAIKeys(): Promise<AIKeysStorage> {
  try {
    const result = await storage.local.get(AI_KEYS_STORAGE_KEY);
    return (result[AI_KEYS_STORAGE_KEY] || {}) as AIKeysStorage;
  } catch (error) {
    console.error('Failed to get AI API keys:', error);
    return {} as AIKeysStorage;
  }
}

/**
 * Save an AI API key with timestamp
 */
export async function saveAIKey(provider: AIProvider, key: string): Promise<void> {
  try {
    const aiKeys = await getAIKeys();

    aiKeys[provider] = {
      key: key.trim(),
      addedAt: Date.now(),
    };

    await storage.local.set({ [AI_KEYS_STORAGE_KEY]: aiKeys });
  } catch (error) {
    console.error('Failed to save AI API key:', error);
    throw error;
  }
}

/**
 * Remove an AI API key
 */
export async function removeAIKey(provider: AIProvider): Promise<void> {
  try {
    const aiKeys = await getAIKeys();
    delete aiKeys[provider];
    await storage.local.set({ [AI_KEYS_STORAGE_KEY]: aiKeys });
  } catch (error) {
    console.error('Failed to remove AI API key:', error);
    throw error;
  }
}

/**
 * Get a specific AI API key value
 */
export async function getAIKeyValue(provider: AIProvider): Promise<string | null> {
  try {
    const aiKeys = await getAIKeys();
    return aiKeys[provider]?.key || null;
  } catch (error) {
    console.error('Failed to get AI API key value:', error);
    return null;
  }
}

/**
 * Check if an AI provider has an API key configured
 */
export async function hasAIKey(provider: AIProvider): Promise<boolean> {
  try {
    const aiKeys = await getAIKeys();
    return !!(aiKeys[provider]?.key && aiKeys[provider].key.trim() !== '');
  } catch (error) {
    console.error('Failed to check AI API key:', error);
    return false;
  }
}

/**
 * Get all configured AI providers
 */
export async function getConfiguredAIProviders(): Promise<AIProvider[]> {
  try {
    const aiKeys = await getAIKeys();
    return Object.entries(aiKeys)
      .filter(([_, data]) => data?.key && data.key.trim() !== '')
      .map(([provider]) => provider as AIProvider);
  } catch (error) {
    console.error('Failed to get configured AI providers:', error);
    return [];
  }
}

/**
 * Validate AI API key format (basic validation)
 */
export function validateAIKeyFormat(provider: AIProvider, key: string): { valid: boolean; error?: string } {
  const trimmedKey = key.trim();

  if (!trimmedKey) {
    return { valid: false, error: 'API key is required' };
  }

  if (trimmedKey.length < 10) {
    return { valid: false, error: 'API key is too short' };
  }

  // Provider-specific validation
  switch (provider) {
    case AIProvider.CLAUDE:
      // Anthropic keys typically start with 'sk-ant-'
      if (!trimmedKey.startsWith('sk-ant-')) {
        return { valid: false, error: 'Claude API keys should start with "sk-ant-"' };
      }
      break;

    case AIProvider.OPENAI:
      // OpenAI keys typically start with 'sk-'
      if (!trimmedKey.startsWith('sk-')) {
        return { valid: false, error: 'OpenAI API keys should start with "sk-"' };
      }
      break;

    case AIProvider.GEMINI:
      // Gemini keys are typically alphanumeric
      if (!/^[A-Za-z0-9_-]+$/.test(trimmedKey)) {
        return { valid: false, error: 'Gemini API key contains invalid characters' };
      }
      break;
  }

  return { valid: true };
}

