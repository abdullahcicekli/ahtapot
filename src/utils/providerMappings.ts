import { APIProvider } from '@/types/ioc';

/**
 * Centralized Provider Mappings
 * DRY: Single source of truth for service name <-> provider enum mapping
 */

/**
 * Map service names to APIProvider enum
 */
export const SERVICE_NAME_TO_PROVIDER: Record<string, APIProvider> = {
  'VirusTotal': APIProvider.VIRUSTOTAL,
  'OTX AlienVault': APIProvider.OTX,
  'AbuseIPDB': APIProvider.ABUSEIPDB,
  'MalwareBazaar': APIProvider.MALWAREBAZAAR,
  'ARIN': APIProvider.ARIN,
  'Shodan': APIProvider.SHODAN,
  'GreyNoise': APIProvider.GREYNOISE,
};

/**
 * Map APIProvider enum to service names
 */
export const PROVIDER_TO_SERVICE_NAME: Record<APIProvider, string> = {
  [APIProvider.VIRUSTOTAL]: 'VirusTotal',
  [APIProvider.OTX]: 'OTX AlienVault',
  [APIProvider.ABUSEIPDB]: 'AbuseIPDB',
  [APIProvider.MALWAREBAZAAR]: 'MalwareBazaar',
  [APIProvider.ARIN]: 'ARIN',
  [APIProvider.SHODAN]: 'Shodan',
  [APIProvider.GREYNOISE]: 'GreyNoise',
};

/**
 * Find APIProvider enum by service name
 * @param serviceName The service name (e.g., 'VirusTotal')
 * @returns APIProvider enum or null if not found
 */
export function findProviderByServiceName(serviceName: string): APIProvider | null {
  return SERVICE_NAME_TO_PROVIDER[serviceName] || null;
}

/**
 * Find service name by APIProvider enum
 * @param provider The APIProvider enum
 * @returns Service name or null if not found
 */
export function findServiceNameByProvider(provider: APIProvider): string | null {
  return PROVIDER_TO_SERVICE_NAME[provider] || null;
}
