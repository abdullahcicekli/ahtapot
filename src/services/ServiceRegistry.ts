import { IToolService } from './base/BaseToolService';
import { VirusTotalService } from './tools/VirusTotalService';
import { OTXService } from './tools/OTXService';
import { AbuseIPDBService } from './tools/AbuseIPDBService';
import { MalwareBazaarService } from './tools/MalwareBazaarService';
import { ARINService } from './tools/ARINService';
import { ShodanService } from './tools/ShodanService';
import { GreyNoiseService } from './tools/GreyNoiseService';
import { APIProvider } from '@/types/ioc';
import { APIKeysStorage } from '@/utils/apiKeyStorage';

/**
 * Service Registry
 * Manages all security tool service instances
 */
export class ServiceRegistry {
  private services: Map<APIProvider, IToolService>;
  private apiKeys: Map<APIProvider, string>;

  constructor() {
    this.services = new Map();
    this.apiKeys = new Map();

    // Initialize ARIN service automatically (no API key required)
    this.initializeService(APIProvider.ARIN);
    console.log('[ServiceRegistry] ARIN service auto-initialized (no API key required)');
  }

  /**
   * Set API key for a provider
   * OPTIMIZED: Lazy initialization - service will be initialized only when needed
   */
  setAPIKey(provider: APIProvider, apiKey: string): void {
    this.apiKeys.set(provider, apiKey);

    // OPTIMIZED: Remove existing service to force lazy re-initialization
    // Service will be re-created with new key when getService() is called
    if (this.services.has(provider)) {
      this.services.delete(provider);
    }
  }

  /**
   * Get API key for a provider
   */
  getAPIKey(provider: APIProvider): string | undefined {
    return this.apiKeys.get(provider);
  }

  /**
   * Set multiple API keys at once
   * Supports both old format (Record<string, string>) and new format (APIKeysStorage)
   */
  setAPIKeys(keys: Record<string, string> | APIKeysStorage): void {
    console.log('[ServiceRegistry] Setting API keys:', Object.keys(keys));
    Object.entries(keys).forEach(([providerKey, value]) => {
      // Handle both old format (string) and new format (object with key and addedAt)
      const apiKey = typeof value === 'string' ? value : value?.key;

      // Validate and ensure we have a valid provider
      if (apiKey && apiKey.trim() !== '') {
        console.log(`[ServiceRegistry] Setting key for provider: ${providerKey}`);
        this.setAPIKey(providerKey as APIProvider, apiKey);
      }
    });
    console.log('[ServiceRegistry] Configured providers:', Array.from(this.apiKeys.keys()));
  }

  /**
   * Initialize a service
   */
  private initializeService(provider: APIProvider): void {
    const apiKey = this.apiKeys.get(provider);
    console.log(`[ServiceRegistry] Initializing service for ${provider} with key: ${apiKey ? '***' : 'none'}`);

    switch (provider) {
      case APIProvider.VIRUSTOTAL:
        this.services.set(
          provider,
          new VirusTotalService({
            apiKey,
            timeout: 30000,
          })
        );
        console.log('[ServiceRegistry] VirusTotal service initialized');
        break;

      case APIProvider.OTX:
        this.services.set(
          provider,
          new OTXService({
            apiKey,
            timeout: 30000,
          })
        );
        console.log('[ServiceRegistry] OTX AlienVault service initialized');
        break;

      case APIProvider.ABUSEIPDB:
        this.services.set(
          provider,
          new AbuseIPDBService({
            apiKey,
            timeout: 30000,
          })
        );
        console.log('[ServiceRegistry] AbuseIPDB service initialized');
        break;

      case APIProvider.MALWAREBAZAAR:
        this.services.set(
          provider,
          new MalwareBazaarService({
            apiKey,
            timeout: 30000,
          })
        );
        console.log('[ServiceRegistry] MalwareBazaar service initialized');
        break;

      case APIProvider.ARIN:
        // ARIN doesn't require an API key - always initialize
        this.services.set(
          provider,
          new ARINService({
            timeout: 30000,
          })
        );
        console.log('[ServiceRegistry] ARIN service initialized (no API key required)');
        break;

      case APIProvider.SHODAN:
        this.services.set(
          provider,
          new ShodanService({
            apiKey,
            timeout: 30000,
          })
        );
        console.log('[ServiceRegistry] Shodan service initialized');
        break;

      case APIProvider.GREYNOISE:
        this.services.set(
          provider,
          new GreyNoiseService({
            apiKey,
            timeout: 30000,
          })
        );
        console.log('[ServiceRegistry] GreyNoise service initialized');
        break;

      default:
        console.warn(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Get a service instance
   * OPTIMIZED: Lazy initialization - creates service only when first requested
   */
  getService(provider: APIProvider): IToolService | undefined {
    // Lazy initialization: only create service if not already cached
    if (!this.services.has(provider)) {
      this.initializeService(provider);
    }
    return this.services.get(provider);
  }

  /**
   * Get all configured services
   */
  getConfiguredServices(): IToolService[] {
    const configured: IToolService[] = [];

    console.log('[ServiceRegistry] Getting configured services. Total API keys:', this.apiKeys.size);

    // Check API-key-based services
    this.apiKeys.forEach((_, provider) => {
      console.log(`[ServiceRegistry] Checking provider: ${provider}`);
      const service = this.getService(provider);
      console.log(`[ServiceRegistry] Service for ${provider}:`, service ? 'found' : 'not found');
      if (service) {
        console.log(`[ServiceRegistry] Service ${provider} configured:`, service.isConfigured());
        if (service.isConfigured()) {
          configured.push(service);
        }
      }
    });

    // Always include ARIN service (no API key required, initialized in constructor)
    const arinService = this.getService(APIProvider.ARIN);
    if (arinService && arinService.isConfigured()) {
      console.log('[ServiceRegistry] Including ARIN service (always available, no API key)');
      configured.push(arinService);
    }

    console.log('[ServiceRegistry] Total configured services:', configured.length);
    console.log('[ServiceRegistry] Configured service names:', configured.map(s => s.name).join(', '));
    return configured;
  }

  /**
   * Check if a provider is configured
   */
  isConfigured(provider: APIProvider): boolean {
    const service = this.getService(provider);
    return service?.isConfigured() ?? false;
  }

  /**
   * Remove API key and service
   * Note: ARIN cannot be removed as it requires no API key and is always available
   */
  removeProvider(provider: APIProvider): void {
    // Prevent removing ARIN (it's always available)
    if (provider === APIProvider.ARIN) {
      console.warn('[ServiceRegistry] Cannot remove ARIN service - it requires no API key and is always available');
      return;
    }

    this.apiKeys.delete(provider);
    this.services.delete(provider);
  }

  /**
   * Clear all services and API keys
   * Note: ARIN service is re-initialized as it requires no API key
   */
  clear(): void {
    this.services.clear();
    this.apiKeys.clear();

    // Re-initialize ARIN (always available, no API key needed)
    this.initializeService(APIProvider.ARIN);
    console.log('[ServiceRegistry] ARIN service re-initialized after clear (no API key required)');
  }
}

/**
 * Global service registry instance
 */
export const serviceRegistry = new ServiceRegistry();
