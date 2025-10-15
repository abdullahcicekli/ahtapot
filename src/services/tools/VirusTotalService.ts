import { BaseToolService, ToolServiceConfig } from '../base/BaseToolService';
import { DetectedIOC, IOCAnalysisResult, IOCType } from '@/types/ioc';
import {
  VTIPAddressResponse,
  VTDomainResponse,
  VTURLResponse,
  VTFileResponse,
  VTErrorResponse,
  AnalysisStats,
} from '@/types/virustotal';

/**
 * VirusTotal Service
 * Integrates with VirusTotal API v3
 * Documentation: https://docs.virustotal.com/reference/overview
 */
export class VirusTotalService extends BaseToolService {
  private readonly baseURL = 'https://www.virustotal.com/api/v3';

  constructor(config: ToolServiceConfig) {
    super(config);
  }

  get name(): string {
    return 'VirusTotal';
  }

  get supportedIOCTypes(): IOCType[] {
    return [
      IOCType.IPV4,
      IOCType.IPV6,
      IOCType.DOMAIN,
      IOCType.URL,
      IOCType.MD5,
      IOCType.SHA1,
      IOCType.SHA256,
    ];
  }

  /**
   * Analyze an IOC using VirusTotal
   */
  async analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    console.log(`[VirusTotal] Analyzing IOC: ${ioc.value} (${ioc.type})`);

    if (!this.isConfigured()) {
      console.log('[VirusTotal] Service not configured - no API key');
      return this.createErrorResult(ioc, 'VirusTotal API key not configured');
    }

    if (!this.supports(ioc.type)) {
      console.log(`[VirusTotal] Unsupported IOC type: ${ioc.type}`);
      return this.createErrorResult(
        ioc,
        `Unsupported IOC type: ${ioc.type}`
      );
    }

    console.log(`[VirusTotal] Starting analysis for ${ioc.type}`);
    try {
      switch (ioc.type) {
        case IOCType.IPV4:
        case IOCType.IPV6:
          return await this.analyzeIP(ioc);
        case IOCType.DOMAIN:
          return await this.analyzeDomain(ioc);
        case IOCType.URL:
          return await this.analyzeURL(ioc);
        case IOCType.MD5:
        case IOCType.SHA1:
        case IOCType.SHA256:
          return await this.analyzeFile(ioc);
        default:
          return this.createErrorResult(ioc, `Unsupported IOC type: ${ioc.type}`);
      }
    } catch (error) {
      return this.createErrorResult(
        ioc,
        error instanceof Error ? error : 'Unknown error occurred'
      );
    }
  }

  /**
   * Analyze IP address
   * Endpoint: GET /ip_addresses/{ip}
   */
  private async analyzeIP(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const endpoint = `${this.baseURL}/ip_addresses/${ioc.value}`;
    console.log(`[VirusTotal] API request to: ${endpoint}`);

    const response = await this.fetchWithTimeout(endpoint, {
      headers: {
        'x-apikey': this.config.apiKey!,
      },
    });

    console.log(`[VirusTotal] API response status: ${response.status}`);

    if (!response.ok) {
      const errorData: VTErrorResponse = await response.json();
      console.log(`[VirusTotal] API error:`, errorData);
      throw new Error(
        `VirusTotal API error: ${errorData.error.message} (${response.status})`
      );
    }

    const data: VTIPAddressResponse = await response.json();
    const attrs = data.data.attributes;
    console.log(`[VirusTotal] API response data received, malicious: ${attrs.last_analysis_stats.malicious}`);

    return {
      ioc,
      source: this.name,
      status: this.determineStatus(
        attrs.last_analysis_stats.malicious,
        attrs.last_analysis_stats.suspicious,
        this.getTotalEngines(attrs.last_analysis_stats)
      ),
      details: {
        malicious: attrs.last_analysis_stats.malicious,
        suspicious: attrs.last_analysis_stats.suspicious,
        harmless: attrs.last_analysis_stats.harmless,
        undetected: attrs.last_analysis_stats.undetected,
        total: this.getTotalEngines(attrs.last_analysis_stats),
        reputation: attrs.reputation,
        country: attrs.country,
        asn: attrs.asn,
        as_owner: attrs.as_owner,
        network: attrs.network,
        continent: attrs.continent,
        regional_internet_registry: attrs.regional_internet_registry,
        total_votes: attrs.total_votes,
        tags: attrs.tags || [],
        last_analysis_date: new Date(attrs.last_analysis_date * 1000).toISOString(),
        last_analysis_results: attrs.last_analysis_results,
        whois: attrs.whois,
        rdap: attrs.rdap ? {
          name: attrs.rdap.name,
          handle: attrs.rdap.handle,
          type: attrs.rdap.type,
          country: attrs.rdap.country,
        } : undefined,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Analyze domain
   * Endpoint: GET /domains/{domain}
   */
  private async analyzeDomain(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const endpoint = `${this.baseURL}/domains/${ioc.value}`;

    const response = await this.fetchWithTimeout(endpoint, {
      headers: {
        'x-apikey': this.config.apiKey!,
      },
    });

    if (!response.ok) {
      const errorData: VTErrorResponse = await response.json();
      throw new Error(
        `VirusTotal API error: ${errorData.error.message} (${response.status})`
      );
    }

    const data: VTDomainResponse = await response.json();
    const attrs = data.data.attributes;

    return {
      ioc,
      source: this.name,
      status: this.determineStatus(
        attrs.last_analysis_stats.malicious,
        attrs.last_analysis_stats.suspicious,
        this.getTotalEngines(attrs.last_analysis_stats)
      ),
      details: {
        malicious: attrs.last_analysis_stats.malicious,
        suspicious: attrs.last_analysis_stats.suspicious,
        harmless: attrs.last_analysis_stats.harmless,
        undetected: attrs.last_analysis_stats.undetected,
        total: this.getTotalEngines(attrs.last_analysis_stats),
        reputation: attrs.reputation,
        total_votes: attrs.total_votes,
        registrar: attrs.registrar,
        creation_date: attrs.creation_date
          ? new Date(attrs.creation_date * 1000).toISOString()
          : undefined,
        tags: attrs.tags || [],
        categories: attrs.categories,
        last_analysis_date: new Date(attrs.last_analysis_date * 1000).toISOString(),
        last_analysis_results: attrs.last_analysis_results,
        whois: attrs.whois,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Analyze URL
   * Endpoint: GET /urls/{id}
   * Note: URL must be base64 encoded (URL-safe, no padding)
   */
  private async analyzeURL(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    // URL-safe base64 encoding without padding
    const urlId = btoa(ioc.value)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const endpoint = `${this.baseURL}/urls/${urlId}`;

    const response = await this.fetchWithTimeout(endpoint, {
      headers: {
        'x-apikey': this.config.apiKey!,
      },
    });

    if (!response.ok) {
      const errorData: VTErrorResponse = await response.json();
      throw new Error(
        `VirusTotal API error: ${errorData.error.message} (${response.status})`
      );
    }

    const data: VTURLResponse = await response.json();
    const attrs = data.data.attributes;

    return {
      ioc,
      source: this.name,
      status: this.determineStatus(
        attrs.last_analysis_stats.malicious,
        attrs.last_analysis_stats.suspicious,
        this.getTotalEngines(attrs.last_analysis_stats)
      ),
      details: {
        malicious: attrs.last_analysis_stats.malicious,
        suspicious: attrs.last_analysis_stats.suspicious,
        harmless: attrs.last_analysis_stats.harmless,
        undetected: attrs.last_analysis_stats.undetected,
        total: this.getTotalEngines(attrs.last_analysis_stats),
        reputation: attrs.reputation,
        total_votes: attrs.total_votes,
        title: attrs.title,
        final_url: attrs.last_final_url,
        http_response_code: attrs.last_http_response_code,
        tags: attrs.tags || [],
        categories: attrs.categories,
        last_analysis_date: new Date(attrs.last_analysis_date * 1000).toISOString(),
        last_analysis_results: attrs.last_analysis_results,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Analyze file hash
   * Endpoint: GET /files/{hash}
   */
  private async analyzeFile(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const endpoint = `${this.baseURL}/files/${ioc.value}`;

    const response = await this.fetchWithTimeout(endpoint, {
      headers: {
        'x-apikey': this.config.apiKey!,
      },
    });

    if (!response.ok) {
      const errorData: VTErrorResponse = await response.json();
      throw new Error(
        `VirusTotal API error: ${errorData.error.message} (${response.status})`
      );
    }

    const data: VTFileResponse = await response.json();
    const attrs = data.data.attributes;

    return {
      ioc,
      source: this.name,
      status: this.determineStatus(
        attrs.last_analysis_stats.malicious,
        attrs.last_analysis_stats.suspicious,
        this.getTotalEngines(attrs.last_analysis_stats)
      ),
      details: {
        malicious: attrs.last_analysis_stats.malicious,
        suspicious: attrs.last_analysis_stats.suspicious,
        harmless: attrs.last_analysis_stats.harmless,
        undetected: attrs.last_analysis_stats.undetected,
        total: this.getTotalEngines(attrs.last_analysis_stats),
        reputation: attrs.reputation,
        total_votes: attrs.total_votes,
        size: attrs.size,
        type_description: attrs.type_description,
        type_tag: attrs.type_tag,
        md5: attrs.md5,
        sha1: attrs.sha1,
        sha256: attrs.sha256,
        meaningful_name: attrs.meaningful_name,
        names: attrs.names,
        tags: attrs.tags || [],
        last_analysis_date: new Date(attrs.last_analysis_date * 1000).toISOString(),
        last_analysis_results: attrs.last_analysis_results,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate total number of engines
   */
  private getTotalEngines(stats: AnalysisStats): number {
    return (
      stats.malicious +
      stats.suspicious +
      stats.undetected +
      stats.harmless +
      stats.timeout
    );
  }
}
