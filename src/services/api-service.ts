import { DetectedIOC, IOCAnalysisResult, APIProvider } from '@/types/ioc';
import { ServiceRegistry } from './ServiceRegistry';
import { CacheManager } from '@/utils/cacheManager';

/**
 * API Service Layer
 * Farklı güvenlik araçlarının API'leriyle iletişim kurar
 * Refactored to use modular service architecture with caching support
 */

export class APIService {
  private serviceRegistry: ServiceRegistry;

  constructor(apiKeys: Record<string, string>) {
    this.serviceRegistry = new ServiceRegistry();
    this.serviceRegistry.setAPIKeys(apiKeys);
  }

  /**
   * IOC'yi analiz eder (tüm uygun API'leri kullanır)
   * Cache'den kontrol eder, yoksa API'ye gider ve cache'e kaydeder
   */
  async analyzeIOC(ioc: DetectedIOC): Promise<IOCAnalysisResult[]> {
    const results: IOCAnalysisResult[] = [];

    // Check if cache is enabled
    const cacheSettings = await CacheManager.getSettings();
    const isCacheEnabled = cacheSettings.enabled;

    // IOC tipine göre hangi API'leri kullanacağımızı belirle
    const providers = this.selectAPIsForIOC(ioc);

    // Her API için paralel olarak analiz yap (cache'den veya API'den)
    const promises = providers.map(async (provider) => {
      const service = this.serviceRegistry.getService(provider);
      if (!service) {
        throw new Error(`Service not found: ${provider}`);
      }

      // Try to get from cache first if enabled
      if (isCacheEnabled) {
        const cachedResult = await CacheManager.getResult(
          service.name,
          ioc.type,
          ioc.value
        );

        if (cachedResult) {
          console.log(`[APIService] Cache hit for ${service.name} - ${ioc.type} - ${ioc.value}`);
          return cachedResult;
        }
      }

      // Cache miss or disabled, call API
      console.log(`[APIService] Cache miss for ${service.name} - ${ioc.type} - ${ioc.value}, calling API`);
      const result = await service.analyze(ioc);

      // Store in cache if enabled and successful
      if (isCacheEnabled && result.status !== 'error') {
        await CacheManager.storeResult(result);
        console.log(`[APIService] Cached result for ${service.name} - ${ioc.type} - ${ioc.value}`);
      }

      return result;
    });

    const apiResults = await Promise.allSettled(promises);

    // Sonuçları topla
    apiResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // Error already handled in service, but we can log it
        console.error('Analysis failed:', result.reason);
      }
    });

    return results;
  }

  /**
   * IOC tipine göre kullanılacak API'leri seçer
   */
  private selectAPIsForIOC(ioc: DetectedIOC): APIProvider[] {
    const providers: APIProvider[] = [];

    console.log(`[APIService] Selecting APIs for IOC type: ${ioc.type}`);

    // Get all configured services
    const configuredServices = this.serviceRegistry.getConfiguredServices();
    console.log(`[APIService] Found ${configuredServices.length} configured services`);

    // Filter services that support this IOC type
    configuredServices.forEach((service) => {
      console.log(`[APIService] Checking service ${service.name} for IOC type ${ioc.type}`);
      console.log(`[APIService] Service supports: ${service.supportedIOCTypes.join(', ')}`);
      if (service.supports(ioc.type)) {
        // Find the provider for this service
        const provider = this.findProviderForService(service.name);
        console.log(`[APIService] Service ${service.name} supports ${ioc.type}, provider: ${provider}`);
        if (provider) {
          providers.push(provider);
        }
      }
    });

    console.log(`[APIService] Selected providers:`, providers);
    return providers;
  }

  /**
   * Find provider enum for service name
   */
  private findProviderForService(serviceName: string): APIProvider | null {
    const mapping: Record<string, APIProvider> = {
      'VirusTotal': APIProvider.VIRUSTOTAL,
      'OTX AlienVault': APIProvider.OTX,
    };

    return mapping[serviceName] || null;
  }

  /**
   * Update API keys (useful for runtime configuration changes)
   */
  updateAPIKeys(apiKeys: Record<string, string>): void {
    this.serviceRegistry.setAPIKeys(apiKeys);
  }

  /**
   * Get service registry (for advanced usage)
   */
  getServiceRegistry(): ServiceRegistry {
    return this.serviceRegistry;
  }
}
