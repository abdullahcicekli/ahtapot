/**
 * Provider Order Storage Utilities
 * Handles storage and retrieval of custom provider display order
 */

import { APIProvider } from '@/types/ioc';
import { PROVIDER_TO_SERVICE_NAME } from './providerMappings';

const STORAGE_KEY = 'providerOrder';

/**
 * Get all providers in their default order (alphabetical by service name)
 */
export function getDefaultProviderOrder(): APIProvider[] {
  return Object.values(APIProvider).sort((a, b) => {
    const nameA = PROVIDER_TO_SERVICE_NAME[a] || a;
    const nameB = PROVIDER_TO_SERVICE_NAME[b] || b;
    return nameA.localeCompare(nameB);
  });
}

/**
 * Get custom provider order from storage
 * If no custom order exists, returns default order
 */
export async function getProviderOrder(): Promise<APIProvider[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);

    if (result[STORAGE_KEY] && Array.isArray(result[STORAGE_KEY])) {
      const storedOrder = result[STORAGE_KEY] as APIProvider[];

      // Ensure all providers are included (in case new providers were added)
      const allProviders = Object.values(APIProvider);
      const missingProviders = allProviders.filter(p => !storedOrder.includes(p));

      // Add any missing providers at the end
      return [...storedOrder, ...missingProviders];
    }

    return getDefaultProviderOrder();
  } catch (error) {
    console.error('Failed to get provider order:', error);
    return getDefaultProviderOrder();
  }
}

/**
 * Save custom provider order to storage
 */
export async function saveProviderOrder(order: APIProvider[]): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: order });
  } catch (error) {
    console.error('Failed to save provider order:', error);
    throw error;
  }
}

/**
 * Reset provider order to default
 */
export async function resetProviderOrder(): Promise<void> {
  try {
    await chrome.storage.local.remove(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset provider order:', error);
    throw error;
  }
}

/**
 * Sort results according to custom provider order
 */
export function sortResultsByProviderOrder<T extends { source: string }>(
  results: T[],
  providerOrder: APIProvider[]
): T[] {
  // Create a copy to avoid mutating the original array
  const resultsCopy = [...results];

  return resultsCopy.sort((a, b) => {
    // Find the provider enum for each result
    const providerA = Object.entries(PROVIDER_TO_SERVICE_NAME).find(
      ([_, name]) => name === a.source
    )?.[0] as APIProvider | undefined;

    const providerB = Object.entries(PROVIDER_TO_SERVICE_NAME).find(
      ([_, name]) => name === b.source
    )?.[0] as APIProvider | undefined;

    // If either provider is not found, maintain current order
    if (!providerA || !providerB) return 0;

    const indexA = providerOrder.indexOf(providerA);
    const indexB = providerOrder.indexOf(providerB);

    // If either index is not found, maintain current order
    if (indexA === -1 || indexB === -1) return 0;

    return indexA - indexB;
  });
}
