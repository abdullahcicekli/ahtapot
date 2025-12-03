import { APIProvider } from '@/types/ioc';

/**
 * Provider Display Configuration
 * Defines which providers are enabled and their display order
 */

/**
 * Provider enabled/disabled status
 * Set to false to completely hide a provider from the UI and skip API calls
 * This is useful for temporarily disabling providers that are not working
 */
export const PROVIDER_ENABLED_STATUS: Record<APIProvider, boolean> = {
  [APIProvider.VIRUSTOTAL]: true,
  [APIProvider.URLHAUS]: true,
  [APIProvider.ABUSEIPDB]: true,
  [APIProvider.PULSEDIVE]: true,
  [APIProvider.OTX]: true,
  [APIProvider.SCAMALYTICS]: false,  // Disabled - API integration pending
  [APIProvider.GREYNOISE]: true,
  [APIProvider.SHODAN]: true,
  [APIProvider.MALWAREBAZAAR]: true,
  [APIProvider.ARIN]: true,
};

/**
 * Check if a provider is enabled
 */
export function isProviderEnabled(provider: APIProvider): boolean {
  return PROVIDER_ENABLED_STATUS[provider] ?? true;
}

/**
 * Get list of enabled providers
 */
export function getEnabledProviders(): APIProvider[] {
  return Object.entries(PROVIDER_ENABLED_STATUS)
    .filter(([_, enabled]) => enabled)
    .map(([provider]) => provider as APIProvider);
}

/**
 * Get list of disabled providers
 */
export function getDisabledProviders(): APIProvider[] {
  return Object.entries(PROVIDER_ENABLED_STATUS)
    .filter(([_, enabled]) => !enabled)
    .map(([provider]) => provider as APIProvider);
}

/**
 * Default provider display order
 * This is used when user hasn't customized the order
 * Only includes enabled providers
 */
export const DEFAULT_PROVIDER_ORDER: APIProvider[] = [
  APIProvider.VIRUSTOTAL,
  APIProvider.URLHAUS,
  APIProvider.ABUSEIPDB,
  APIProvider.PULSEDIVE,
  APIProvider.OTX,
  // APIProvider.SCAMALYTICS, // Disabled
  APIProvider.GREYNOISE,
  APIProvider.SHODAN,
  APIProvider.MALWAREBAZAAR,
  APIProvider.ARIN,
].filter(isProviderEnabled);

/**
 * Storage key for user's custom provider order
 */
export const PROVIDER_ORDER_STORAGE_KEY = 'ahtapot_provider_order';

/**
 * Get provider display order from storage or use default
 * Filters out disabled providers
 */
export async function getProviderDisplayOrder(): Promise<APIProvider[]> {
  try {
    const result = await chrome.storage.local.get(PROVIDER_ORDER_STORAGE_KEY);
    const customOrder = result[PROVIDER_ORDER_STORAGE_KEY];

    if (customOrder && Array.isArray(customOrder) && customOrder.length > 0) {
      // Filter out disabled providers from custom order
      const enabledCustomOrder = customOrder.filter(p => isProviderEnabled(p as APIProvider));
      
      // Add any new enabled providers that aren't in the custom order
      const enabledProviders = getEnabledProviders();
      const missingProviders = enabledProviders.filter(p => !enabledCustomOrder.includes(p));
      return [...enabledCustomOrder, ...missingProviders];
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
 * Filters out disabled providers
 */
export function sortProvidersByDisplayOrder(
  providers: string[],
  displayOrder: APIProvider[]
): string[] {
  // Filter out disabled providers
  const enabledProviders = providers.filter(p => isProviderEnabled(p as APIProvider));
  
  return enabledProviders.sort((a, b) => {
    const indexA = displayOrder.indexOf(a as APIProvider);
    const indexB = displayOrder.indexOf(b as APIProvider);

    // If provider not in order list, put it at the end
    const orderA = indexA === -1 ? Number.MAX_VALUE : indexA;
    const orderB = indexB === -1 ? Number.MAX_VALUE : indexB;

    return orderA - orderB;
  });
}
