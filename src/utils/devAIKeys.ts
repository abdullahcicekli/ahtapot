/**
 * Development AI API Keys Auto-loader
 * Automatically loads AI API keys from .env file in development mode
 */

import { AIProvider } from '@/types/ai';
import { saveAIKey, hasAIKey } from '@/utils/aiKeyStorage';

/**
 * Environment variable mapping to AIProvider
 */
const ENV_AI_KEY_MAPPING: Record<string, AIProvider> = {
  VITE_CLAUDE_API_KEY: AIProvider.CLAUDE,
  VITE_GEMINI_API_KEY: AIProvider.GEMINI,
  VITE_OPENAI_API_KEY: AIProvider.OPENAI,
};

/**
 * Initialize development AI API keys from environment variables
 * Only runs in development mode and only sets keys that don't already exist
 */
export async function initializeDevelopmentAIKeys(): Promise<void> {
  // Only run in development mode
  if (!import.meta.env.DEV) {
    return;
  }

  console.log('[DEV] Checking for environment AI API keys...');

  try {
    for (const [envKey, provider] of Object.entries(ENV_AI_KEY_MAPPING)) {
      // Get the AI API key from environment
      const apiKey = import.meta.env[envKey];

      // Skip if no key in environment
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
        continue;
      }

      // Check if key already exists in storage
      const existingKey = await hasAIKey(provider);

      if (!existingKey) {
        // Save the key from environment
        await saveAIKey(provider, apiKey);
        console.log(`[DEV] Auto-loaded AI API key for ${provider} from environment`);
      } else {
        console.log(`[DEV] AI API key for ${provider} already exists, skipping`);
      }
    }

    console.log('[DEV] Development AI API keys initialization complete');
  } catch (error) {
    console.error('[DEV] Failed to initialize development AI API keys:', error);
  }
}

