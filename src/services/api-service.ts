import { DetectedIOC, IOCAnalysisResult, APIProvider } from '@/types/ioc';
import { ServiceRegistry } from './ServiceRegistry';

/**
 * API Service Layer
 * Farklı güvenlik araçlarının API'leriyle iletişim kurar
 * Refactored to use modular service architecture
 */

export class APIService {
  private serviceRegistry: ServiceRegistry;

  constructor(apiKeys: Record<string, string>) {
    this.serviceRegistry = new ServiceRegistry();
    this.serviceRegistry.setAPIKeys(apiKeys);
  }

  /**
   * IOC'yi analiz eder (tüm uygun API'leri kullanır)
   */
  async analyzeIOC(ioc: DetectedIOC): Promise<IOCAnalysisResult[]> {
    const results: IOCAnalysisResult[] = [];

    // IOC tipine göre hangi API'leri kullanacağımızı belirle
    const providers = this.selectAPIsForIOC(ioc);

    // Her API için paralel olarak analiz yap
    const promises = providers.map((provider) => {
      const service = this.serviceRegistry.getService(provider);
      if (!service) {
        return Promise.reject(new Error(`Service not found: ${provider}`));
      }
      return service.analyze(ioc);
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
      'Shodan': APIProvider.SHODAN,
      'AbuseIPDB': APIProvider.ABUSEIPDB,
      'URLScan.io': APIProvider.URLSCAN,
      'Have I Been Pwned': APIProvider.HIBP,
      'Blockchain.info': APIProvider.BLOCKCHAIN,
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
