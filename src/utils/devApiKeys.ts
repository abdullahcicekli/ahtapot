/**
 * Development API Keys Auto-loader
 * Automatically loads API keys from .env file in development mode
 */

import { APIProvider } from '@/types/ioc';
import { saveAPIKey, hasAPIKey } from '@/utils/apiKeyStorage';

/**
 * Environment variable mapping to APIProvider
 */
const ENV_KEY_MAPPING: Record<string, APIProvider> = {
  VITE_VIRUSTOTAL_API_KEY: APIProvider.VIRUSTOTAL,
  VITE_URLHAUS_API_KEY: APIProvider.URLHAUS,
  VITE_PULSEDIVE_API_KEY: APIProvider.PULSEDIVE,
  VITE_SCAMALYTICS_API_KEY: APIProvider.SCAMALYTICS,
  VITE_OTX_API_KEY: APIProvider.OTX,
  VITE_ABUSEIPDB_API_KEY: APIProvider.ABUSEIPDB,
  VITE_SHODAN_API_KEY: APIProvider.SHODAN,
  VITE_GREYNOISE_API_KEY: APIProvider.GREYNOISE,
  VITE_MALWAREBAZAAR_API_KEY: APIProvider.MALWAREBAZAAR,
};

/**
 * Initialize development API keys from environment variables
 * Only runs in development mode and only sets keys that don't already exist
 */
export async function initializeDevelopmentAPIKeys(): Promise<void> {
  // Only run in development mode
  if (!import.meta.env.DEV) {
    return;
  }

  console.log('[DEV] Checking for environment API keys...');

  try {
    for (const [envKey, provider] of Object.entries(ENV_KEY_MAPPING)) {
      // Get the API key from environment
      const apiKey = import.meta.env[envKey];

      // Skip if no key in environment
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
        continue;
      }

      // Check if key already exists in storage
      const existingKey = await hasAPIKey(provider);

      if (!existingKey) {
        // Save the key from environment
        await saveAPIKey(provider, apiKey);
        console.log(`[DEV] Auto-loaded API key for ${provider} from environment`);
      } else {
        console.log(`[DEV] API key for ${provider} already exists, skipping`);
      }
    }

    console.log('[DEV] Development API keys initialization complete');
  } catch (error) {
    console.error('[DEV] Failed to initialize development API keys:', error);
  }
}
