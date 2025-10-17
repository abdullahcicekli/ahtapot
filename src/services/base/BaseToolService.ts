import { DetectedIOC, IOCAnalysisResult, IOCType } from '@/types/ioc';

/**
 * Base interface for all security tool services
 * This ensures consistency across different tool integrations
 */
export interface IToolService {
  /**
   * Service name (e.g., 'VirusTotal', 'Shodan')
   */
  readonly name: string;

  /**
   * Supported IOC types by this service
   */
  readonly supportedIOCTypes: IOCType[];

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean;

  /**
   * Check if this service supports the given IOC type
   */
  supports(iocType: IOCType): boolean;

  /**
   * Analyze a single IOC
   */
  analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult>;

  /**
   * Batch analyze multiple IOCs (optional optimization)
   */
  analyzeBatch?(iocs: DetectedIOC[]): Promise<IOCAnalysisResult[]>;
}

/**
 * Configuration for tool services
 */
export interface ToolServiceConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  rateLimit?: {
    maxRequests: number;
    perMilliseconds: number;
  };
}

/**
 * Abstract base class for tool services
 * Provides common functionality and structure
 */
export abstract class BaseToolService implements IToolService {
  protected config: ToolServiceConfig;

  constructor(config: ToolServiceConfig) {
    this.config = {
      timeout: 30000, // 30 seconds default
      ...config,
    };
  }

  abstract get name(): string;
  abstract get supportedIOCTypes(): IOCType[];

  /**
   * Default implementation checks for API key
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Check if IOC type is supported
   */
  supports(iocType: IOCType): boolean {
    return this.supportedIOCTypes.includes(iocType);
  }

  /**
   * Must be implemented by each service
   */
  abstract analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult>;

  /**
   * Default batch implementation (can be overridden for optimization)
   */
  async analyzeBatch(iocs: DetectedIOC[]): Promise<IOCAnalysisResult[]> {
    return Promise.all(iocs.map((ioc) => this.analyze(ioc)));
  }

  /**
   * Helper method for HTTP requests with error handling
   */
  protected async fetchWithTimeout(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Helper to create error result
   */
  protected createErrorResult(
    ioc: DetectedIOC,
    error: Error | string
  ): IOCAnalysisResult {
    return {
      ioc,
      source: this.name,
      status: 'error',
      error: error instanceof Error ? error.message : error,
      timestamp: Date.now(),
    };
  }

  /**
   * Helper to create unsupported IOC type result
   */
  protected createUnsupportedResult(ioc: DetectedIOC): IOCAnalysisResult {
    return {
      ioc,
      source: this.name,
      status: 'error',
      error: `This IOC type is not supported by ${this.name}`,
      unsupportedReason: `${this.name} does not support ${ioc.type} analysis`,
      supportedTypes: this.supportedIOCTypes,
      timestamp: Date.now(),
    };
  }

  /**
   * Helper to determine status based on malicious/suspicious counts
   */
  protected determineStatus(
    malicious: number,
    suspicious: number,
    total: number
  ): IOCAnalysisResult['status'] {
    if (total === 0) return 'unknown';
    if (malicious > 5) return 'malicious';
    if (malicious > 0 || suspicious > 0) return 'suspicious';
    return 'safe';
  }
}
