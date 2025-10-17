import { BaseToolService, ToolServiceConfig } from '../base/BaseToolService';
import { DetectedIOC, IOCAnalysisResult, IOCType } from '@/types/ioc';
import {
  OTXGeneralResponse,
  OTXErrorResponse,
  OTXAnalysisStats,
} from '@/types/otx';

/**
 * OTX AlienVault Service
 * Integrates with OTX AlienVault API
 * Documentation: https://otx.alienvault.com/api
 */
export class OTXService extends BaseToolService {
  private readonly baseURL = 'https://otx.alienvault.com/api/v1';

  constructor(config: ToolServiceConfig) {
    super(config);
  }

  get name(): string {
    return 'OTX AlienVault';
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
      IOCType.CVE,
    ];
  }

  /**
   * Analyze an IOC using OTX AlienVault
   */
  async analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    console.log(`[OTX] Analyzing IOC: ${ioc.value} (${ioc.type})`);

    if (!this.isConfigured()) {
      console.log('[OTX] Service not configured - no API key');
      return this.createErrorResult(ioc, 'OTX API key not configured');
    }

    if (!this.supports(ioc.type)) {
      console.log(`[OTX] Unsupported IOC type: ${ioc.type}`);
      return this.createUnsupportedResult(ioc);
    }

    console.log(`[OTX] Starting analysis for ${ioc.type}`);
    try {
      switch (ioc.type) {
        case IOCType.IPV4:
          return await this.analyzeIPv4(ioc);
        case IOCType.IPV6:
          return await this.analyzeIPv6(ioc);
        case IOCType.DOMAIN:
          return await this.analyzeDomain(ioc);
        case IOCType.URL:
          return await this.analyzeURL(ioc);
        case IOCType.MD5:
        case IOCType.SHA1:
        case IOCType.SHA256:
          return await this.analyzeFileHash(ioc);
        case IOCType.CVE:
          return await this.analyzeCVE(ioc);
        default:
          return this.createUnsupportedResult(ioc);
      }
    } catch (error) {
      return this.createErrorResult(
        ioc,
        error instanceof Error ? error : 'Unknown error occurred'
      );
    }
  }

  /**
   * Analyze IPv4 address
   * Endpoint: GET /indicators/IPv4/{ip}/general
   */
  private async analyzeIPv4(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const endpoint = `${this.baseURL}/indicators/IPv4/${ioc.value}/general`;
    console.log(`[OTX] API request to: ${endpoint}`);

    const response = await this.fetchWithTimeout(endpoint, {
      headers: {
        'X-OTX-API-KEY': this.config.apiKey!,
        'Accept': 'application/json',
      },
    });

    console.log(`[OTX] API response status: ${response.status}`);

    if (!response.ok) {
      const errorData: OTXErrorResponse = await response.json();
      console.log(`[OTX] API error:`, errorData);
      throw new Error(
        `OTX API error: ${errorData.detail || errorData.error || errorData.message || 'Unknown error'} (${response.status})`
      );
    }

    const data: OTXGeneralResponse = await response.json();
    const stats = this.calculateStats(data);
    console.log(`[OTX] API response data received, pulse count: ${stats.pulseCount}`);

    return {
      ioc,
      source: this.name,
      status: this.determineStatusFromStats(stats),
      details: {
        pulseCount: stats.pulseCount,
        malicious: stats.malicious,
        suspicious: stats.suspicious,
        harmless: stats.harmless,
        reputation: data.reputation,
        validation: data.validation,
        pulses: data.pulse_info?.pulses.slice(0, 10).map(pulse => ({
          id: pulse.id,
          name: pulse.name,
          description: pulse.description,
          author: pulse.author_name,
          created: pulse.created,
          tags: pulse.tags,
          malware_families: pulse.malware_families,
          targeted_countries: pulse.targeted_countries,
        })),
        related: data.pulse_info?.related,
        references: data.pulse_info?.references,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Analyze IPv6 address
   * Endpoint: GET /indicators/IPv6/{ip}/general
   */
  private async analyzeIPv6(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const endpoint = `${this.baseURL}/indicators/IPv6/${ioc.value}/general`;

    const response = await this.fetchWithTimeout(endpoint, {
      headers: {
        'X-OTX-API-KEY': this.config.apiKey!,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: OTXErrorResponse = await response.json();
      throw new Error(
        `OTX API error: ${errorData.detail || errorData.error || errorData.message || 'Unknown error'} (${response.status})`
      );
    }

    const data: OTXGeneralResponse = await response.json();
    const stats = this.calculateStats(data);

    return {
      ioc,
      source: this.name,
      status: this.determineStatusFromStats(stats),
      details: {
        pulseCount: stats.pulseCount,
        malicious: stats.malicious,
        suspicious: stats.suspicious,
        harmless: stats.harmless,
        reputation: data.reputation,
        validation: data.validation,
        pulses: data.pulse_info?.pulses.slice(0, 10).map(pulse => ({
          id: pulse.id,
          name: pulse.name,
          description: pulse.description,
          author: pulse.author_name,
          created: pulse.created,
          tags: pulse.tags,
        })),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Analyze domain
   * Endpoint: GET /indicators/domain/{domain}/general
   */
  private async analyzeDomain(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const endpoint = `${this.baseURL}/indicators/domain/${ioc.value}/general`;

    const response = await this.fetchWithTimeout(endpoint, {
      headers: {
        'X-OTX-API-KEY': this.config.apiKey!,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: OTXErrorResponse = await response.json();
      throw new Error(
        `OTX API error: ${errorData.detail || errorData.error || errorData.message || 'Unknown error'} (${response.status})`
      );
    }

    const data: OTXGeneralResponse = await response.json();
    const stats = this.calculateStats(data);

    return {
      ioc,
      source: this.name,
      status: this.determineStatusFromStats(stats),
      details: {
        pulseCount: stats.pulseCount,
        malicious: stats.malicious,
        suspicious: stats.suspicious,
        harmless: stats.harmless,
        validation: data.validation,
        pulses: data.pulse_info?.pulses.slice(0, 10).map(pulse => ({
          id: pulse.id,
          name: pulse.name,
          description: pulse.description,
          author: pulse.author_name,
          created: pulse.created,
          tags: pulse.tags,
        })),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Analyze URL
   * Endpoint: GET /indicators/url/{url}/general
   * Note: URL must be base64 encoded
   */
  private async analyzeURL(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    // URL-safe base64 encoding
    const urlEncoded = btoa(ioc.value)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const endpoint = `${this.baseURL}/indicators/url/${urlEncoded}/general`;

    const response = await this.fetchWithTimeout(endpoint, {
      headers: {
        'X-OTX-API-KEY': this.config.apiKey!,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: OTXErrorResponse = await response.json();
      throw new Error(
        `OTX API error: ${errorData.detail || errorData.error || errorData.message || 'Unknown error'} (${response.status})`
      );
    }

    const data: OTXGeneralResponse = await response.json();
    const stats = this.calculateStats(data);

    return {
      ioc,
      source: this.name,
      status: this.determineStatusFromStats(stats),
      details: {
        pulseCount: stats.pulseCount,
        malicious: stats.malicious,
        suspicious: stats.suspicious,
        harmless: stats.harmless,
        validation: data.validation,
        pulses: data.pulse_info?.pulses.slice(0, 10).map(pulse => ({
          id: pulse.id,
          name: pulse.name,
          description: pulse.description,
          author: pulse.author_name,
          created: pulse.created,
          tags: pulse.tags,
        })),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Analyze file hash
   * Endpoint: GET /indicators/file/{hash}/general
   */
  private async analyzeFileHash(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const endpoint = `${this.baseURL}/indicators/file/${ioc.value}/general`;

    const response = await this.fetchWithTimeout(endpoint, {
      headers: {
        'X-OTX-API-KEY': this.config.apiKey!,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: OTXErrorResponse = await response.json();
      throw new Error(
        `OTX API error: ${errorData.detail || errorData.error || errorData.message || 'Unknown error'} (${response.status})`
      );
    }

    const data: OTXGeneralResponse = await response.json();
    const stats = this.calculateStats(data);

    return {
      ioc,
      source: this.name,
      status: this.determineStatusFromStats(stats),
      details: {
        pulseCount: stats.pulseCount,
        malicious: stats.malicious,
        suspicious: stats.suspicious,
        harmless: stats.harmless,
        validation: data.validation,
        pulses: data.pulse_info?.pulses.slice(0, 10).map(pulse => ({
          id: pulse.id,
          name: pulse.name,
          description: pulse.description,
          author: pulse.author_name,
          created: pulse.created,
          tags: pulse.tags,
          malware_families: pulse.malware_families,
        })),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Analyze CVE
   * Endpoint: GET /indicators/cve/{cve}/general
   */
  private async analyzeCVE(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const endpoint = `${this.baseURL}/indicators/cve/${ioc.value}/general`;

    const response = await this.fetchWithTimeout(endpoint, {
      headers: {
        'X-OTX-API-KEY': this.config.apiKey!,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: OTXErrorResponse = await response.json();
      throw new Error(
        `OTX API error: ${errorData.detail || errorData.error || errorData.message || 'Unknown error'} (${response.status})`
      );
    }

    const data: OTXGeneralResponse = await response.json();
    const stats = this.calculateStats(data);

    return {
      ioc,
      source: this.name,
      status: this.determineStatusFromStats(stats),
      details: {
        pulseCount: stats.pulseCount,
        malicious: stats.malicious,
        suspicious: stats.suspicious,
        harmless: stats.harmless,
        validation: data.validation,
        pulses: data.pulse_info?.pulses.slice(0, 10).map(pulse => ({
          id: pulse.id,
          name: pulse.name,
          description: pulse.description,
          author: pulse.author_name,
          created: pulse.created,
          tags: pulse.tags,
          attack_ids: pulse.attack_ids,
        })),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate statistics from OTX response
   */
  private calculateStats(data: OTXGeneralResponse): OTXAnalysisStats {
    const pulseCount = data.pulse_info?.count || 0;

    // OTX doesn't provide direct malicious/suspicious counts
    // We derive them from pulse info and tags
    let malicious = 0;
    let suspicious = 0;
    let harmless = 0;

    if (data.pulse_info && data.pulse_info.pulses) {
      for (const pulse of data.pulse_info.pulses) {
        const tags = (pulse.tags || []).map(t => t.toLowerCase());
        const hasmalwareFamily = (pulse.malware_families || []).length > 0;

        // Consider malicious if has malware families or malicious-related tags
        if (
          hasmalwareFamily ||
          tags.some(t =>
            t.includes('malware') ||
            t.includes('trojan') ||
            t.includes('ransomware') ||
            t.includes('botnet') ||
            t.includes('backdoor')
          )
        ) {
          malicious++;
        } else if (
          tags.some(t =>
            t.includes('suspicious') ||
            t.includes('phishing') ||
            t.includes('spam')
          )
        ) {
          suspicious++;
        } else {
          harmless++;
        }
      }
    }

    // If no pulses, consider harmless
    if (pulseCount === 0) {
      harmless = 1;
    }

    return {
      pulseCount,
      malicious,
      suspicious,
      harmless,
    };
  }

  /**
   * Determine status from statistics
   */
  private determineStatusFromStats(
    stats: OTXAnalysisStats
  ): 'safe' | 'suspicious' | 'malicious' | 'unknown' {
    // If no pulses found, consider safe
    if (stats.pulseCount === 0) {
      return 'safe';
    }

    // If any malicious pulses found, mark as malicious
    if (stats.malicious > 0) {
      return 'malicious';
    }

    // If suspicious pulses found, mark as suspicious
    if (stats.suspicious > 0) {
      return 'suspicious';
    }

    // If only harmless pulses found
    if (stats.harmless > 0) {
      return 'safe';
    }

    return 'unknown';
  }
}
