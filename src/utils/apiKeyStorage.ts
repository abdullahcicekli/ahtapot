/**
 * API Key Storage Utilities
 * Handles storage and migration of API keys with timestamps
 */

import { APIProvider } from '@/types/ioc';

export interface APIKeyData {
  key: string;
  addedAt: number; // Unix timestamp
}

export type APIKeysStorage = Record<APIProvider, APIKeyData>;

/**
 * Get all API keys from storage with migration support
 */
export async function getAPIKeys(): Promise<APIKeysStorage> {
  try {
    const result = await chrome.storage.local.get('apiKeys');
    const apiKeys = result.apiKeys || {};

    // Check if migration is needed (old format: string values)
    const needsMigration = Object.values(apiKeys).some((value) => typeof value === 'string');

    if (needsMigration) {
      console.log('Migrating API keys to new format with timestamps...');
      const migratedKeys = await migrateAPIKeys(apiKeys);
      await chrome.storage.local.set({ apiKeys: migratedKeys });
      return migratedKeys;
    }

    return apiKeys as APIKeysStorage;
  } catch (error) {
    console.error('Failed to get API keys:', error);
    return {} as APIKeysStorage;
  }
}

/**
 * Save an API key with timestamp
 */
export async function saveAPIKey(provider: APIProvider, key: string): Promise<void> {
  try {
    const apiKeys = await getAPIKeys();

    apiKeys[provider] = {
      key: key.trim(),
      addedAt: Date.now(),
    };

    await chrome.storage.local.set({ apiKeys });
  } catch (error) {
    console.error('Failed to save API key:', error);
    throw error;
  }
}

/**
 * Remove an API key
 */
export async function removeAPIKey(provider: APIProvider): Promise<void> {
  try {
    const apiKeys = await getAPIKeys();
    delete apiKeys[provider];
    await chrome.storage.local.set({ apiKeys });
  } catch (error) {
    console.error('Failed to remove API key:', error);
    throw error;
  }
}

/**
 * Get configured providers sorted by timestamp (most recent first)
 */
export async function getConfiguredProvidersSorted(): Promise<
  Array<{ provider: APIProvider; addedAt: number }>
> {
  try {
    const apiKeys = await getAPIKeys();
    const configured: Array<{ provider: APIProvider; addedAt: number }> = [];

    Object.entries(apiKeys).forEach(([provider, data]) => {
      if (data && data.key && data.key.trim() !== '') {
        configured.push({
          provider: provider as APIProvider,
          addedAt: data.addedAt,
        });
      }
    });

    // Sort by addedAt (most recent first)
    configured.sort((a, b) => a.addedAt - b.addedAt);

    return configured;
  } catch (error) {
    console.error('Failed to get configured providers:', error);
    return [];
  }
}

/**
 * Migrate old format (string) to new format (object with timestamp)
 */
async function migrateAPIKeys(oldKeys: any): Promise<APIKeysStorage> {
  const migratedKeys: APIKeysStorage = {} as APIKeysStorage;
  const now = Date.now();

  Object.entries(oldKeys).forEach(([provider, value], index) => {
    if (typeof value === 'string' && value.trim() !== '') {
      // Assign timestamps with slight offset to maintain order
      migratedKeys[provider as APIProvider] = {
        key: value.trim(),
        addedAt: now + index * 1000, // 1 second apart
      };
    } else if (typeof value === 'object' && value !== null && 'key' in value) {
      // Already in new format
      migratedKeys[provider as APIProvider] = value as APIKeyData;
    }
  });

  return migratedKeys;
}

/**
 * Check if a provider has an API key configured
 */
export async function hasAPIKey(provider: APIProvider): Promise<boolean> {
  try {
    const apiKeys = await getAPIKeys();
    return !!(apiKeys[provider]?.key && apiKeys[provider].key.trim() !== '');
  } catch (error) {
    console.error('Failed to check API key:', error);
    return false;
  }
}

/**
 * Get a specific API key value
 */
export async function getAPIKeyValue(provider: APIProvider): Promise<string | null> {
  try {
    const apiKeys = await getAPIKeys();
    return apiKeys[provider]?.key || null;
  } catch (error) {
    console.error('Failed to get API key value:', error);
    return null;
  }
}
