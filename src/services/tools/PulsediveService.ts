import { BaseToolService, ToolServiceConfig } from '../base/BaseToolService';
import { DetectedIOC, IOCAnalysisResult, IOCType } from '@/types/ioc';
import { PulsediveIndicator, PulsediveErrorResponse } from '@/types/pulsedive';

/**
 * Pulsedive Service
 * Integrates with Pulsedive Threat Intelligence API
 * Documentation: https://pulsedive.com/api/
 */
export class PulsediveService extends BaseToolService {
  private readonly baseURL = 'https://pulsedive.com/api';

  constructor(config: ToolServiceConfig) {
    super(config);
  }

  get name(): string {
    return 'Pulsedive';
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
   * Analyze an IOC using Pulsedive
   */
  async analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    console.log(`[Pulsedive] Analyzing IOC: ${ioc.value} (${ioc.type})`);

    if (!this.isConfigured()) {
      console.log('[Pulsedive] Service not configured - no API key');
      return this.createErrorResult(ioc, 'Pulsedive API key not configured');
    }

    if (!this.supports(ioc.type)) {
      console.log(`[Pulsedive] Unsupported IOC type: ${ioc.type}`);
      return this.createUnsupportedResult(ioc);
    }

    console.log(`[Pulsedive] Starting analysis for ${ioc.type}`);
    try {
      return await this.analyzeIndicator(ioc);
    } catch (error) {
      return this.createErrorResult(
        ioc,
        error instanceof Error ? error : 'Unknown error occurred'
      );
    }
  }

  /**
   * Get indicator type for Pulsedive API
   */
  private getPulsediveType(iocType: IOCType): string {
    switch (iocType) {
      case IOCType.IPV4:
      case IOCType.IPV6:
        return 'ip';
      case IOCType.DOMAIN:
        return 'domain';
      case IOCType.URL:
        return 'url';
      case IOCType.MD5:
      case IOCType.SHA1:
      case IOCType.SHA256:
        return 'hash';
      default:
        return 'unknown';
    }
  }

  /**
   * Analyze indicator
   * Endpoint: GET /info.php
   */
  private async analyzeIndicator(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const indicatorType = this.getPulsediveType(ioc.type);
    const endpoint = `${this.baseURL}/info.php?indicator=${encodeURIComponent(ioc.value)}&pretty=1&key=${this.config.apiKey}`;

    console.log(`[Pulsedive] API request for type: ${indicatorType}`);

    const response = await this.fetchWithTimeout(endpoint, {
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`[Pulsedive] API response status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          ioc,
          source: this.name,
          status: 'safe',
          details: {
            message: 'Indicator not found in Pulsedive database',
          },
          timestamp: Date.now(),
        };
      }

      const errorData: PulsediveErrorResponse = await response.json();
      throw new Error(
        `Pulsedive API error: ${errorData.message || errorData.error} (${response.status})`
      );
    }

    const data: PulsediveIndicator | PulsediveErrorResponse = await response.json();

    if ('error' in data) {
      throw new Error(`Pulsedive API error: ${data.message || data.error}`);
    }

    const indicator = data as PulsediveIndicator;
    const risk = indicator.risk || indicator.risk_recommended || 'unknown';

    // Map Pulsedive risk to our status
    let status: 'safe' | 'suspicious' | 'malicious' | 'unknown' = 'unknown';
    if (risk === 'critical' || risk === 'high') {
      status = 'malicious';
    } else if (risk === 'medium' || risk === 'low') {
      status = 'suspicious';
    } else if (risk === 'none' || risk === 'retired') {
      status = 'safe';
    }

    return {
      ioc,
      source: this.name,
      status,
      details: {
        iid: indicator.iid,
        risk,
        risk_recommended: indicator.risk_recommended,
        retired: indicator.retired,
        stamp_added: indicator.stamp_added,
        stamp_updated: indicator.stamp_updated,
        stamp_seen: indicator.stamp_seen,
        recent: indicator.recent,
        attributes: indicator.attributes,
        properties: indicator.properties,
        threats: indicator.threats || [],
        feeds: indicator.feeds || [],
        riskfactors: indicator.riskfactors || [],
        comments: indicator.comments || [],
      },
      timestamp: Date.now(),
    };
  }
}
