import { APIProvider } from '@/types/ioc';

/**
 * Provider Display Configuration
 * Defines the default order in which providers are displayed
 */

/**
 * Default provider display order
 * This is used when user hasn't customized the order
 */
export const DEFAULT_PROVIDER_ORDER: APIProvider[] = [
  APIProvider.VIRUSTOTAL,
  APIProvider.URLHAUS,
  APIProvider.ABUSEIPDB,
  APIProvider.PULSEDIVE,
  APIProvider.OTX,
  APIProvider.SCAMALYTICS,
  APIProvider.GREYNOISE,
  APIProvider.SHODAN,
  APIProvider.MALWAREBAZAAR,
  APIProvider.ARIN,
];

/**
 * Storage key for user's custom provider order
 */
export const PROVIDER_ORDER_STORAGE_KEY = 'ahtapot_provider_order';

/**
 * Get provider display order from storage or use default
 */
export async function getProviderDisplayOrder(): Promise<APIProvider[]> {
  try {
    const result = await chrome.storage.local.get(PROVIDER_ORDER_STORAGE_KEY);
    const customOrder = result[PROVIDER_ORDER_STORAGE_KEY];

    if (customOrder && Array.isArray(customOrder) && customOrder.length > 0) {
      // Return custom order, but ensure all providers are included
      // Add any new providers that aren't in the custom order
      const allProviders = Object.values(APIProvider);
      const missingProviders = allProviders.filter(p => !customOrder.includes(p));
      return [...customOrder, ...missingProviders];
    }

    return [...DEFAULT_PROVIDER_ORDER];
  } catch (error) {
    console.error('Failed to get provider display order:', error);
    return [...DEFAULT_PROVIDER_ORDER];
  }
}

/**
 * Save custom provider display order
 */
export async function saveProviderDisplayOrder(order: APIProvider[]): Promise<void> {
  try {
    await chrome.storage.local.set({
      [PROVIDER_ORDER_STORAGE_KEY]: order,
    });
  } catch (error) {
    console.error('Failed to save provider display order:', error);
    throw error;
  }
}

/**
 * Reset provider display order to default
 */
export async function resetProviderDisplayOrder(): Promise<void> {
  try {
    await chrome.storage.local.remove(PROVIDER_ORDER_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset provider display order:', error);
    throw error;
  }
}

/**
 * Sort providers according to display order
 */
export function sortProvidersByDisplayOrder(
  providers: string[],
  displayOrder: APIProvider[]
): string[] {
  return providers.sort((a, b) => {
    const indexA = displayOrder.indexOf(a as APIProvider);
    const indexB = displayOrder.indexOf(b as APIProvider);

    // If provider not in order list, put it at the end
    const orderA = indexA === -1 ? Number.MAX_VALUE : indexA;
    const orderB = indexB === -1 ? Number.MAX_VALUE : indexB;

    return orderA - orderB;
  });
}
