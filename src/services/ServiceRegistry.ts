import { IToolService } from './base/BaseToolService';
import { VirusTotalService } from './tools/VirusTotalService';
import { OTXService } from './tools/OTXService';
import { AbuseIPDBService } from './tools/AbuseIPDBService';
import { MalwareBazaarService } from './tools/MalwareBazaarService';
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
  }

  /**
   * Set API key for a provider
   */
  setAPIKey(provider: APIProvider, apiKey: string): void {
    this.apiKeys.set(provider, apiKey);

    // Re-initialize service if it exists
    if (this.services.has(provider)) {
      this.initializeService(provider);
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

      default:
        console.warn(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Get a service instance
   */
  getService(provider: APIProvider): IToolService | undefined {
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

    console.log('[ServiceRegistry] Total configured services:', configured.length);
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
   */
  removeProvider(provider: APIProvider): void {
    this.apiKeys.delete(provider);
    this.services.delete(provider);
  }

  /**
   * Clear all services and API keys
   */
  clear(): void {
    this.services.clear();
    this.apiKeys.clear();
  }
}

/**
 * Global service registry instance
 */
export const serviceRegistry = new ServiceRegistry();
