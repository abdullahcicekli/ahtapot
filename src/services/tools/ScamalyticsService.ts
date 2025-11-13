import { BaseToolService, ToolServiceConfig } from '../base/BaseToolService';
import { DetectedIOC, IOCAnalysisResult, IOCType } from '@/types/ioc';
import { ScamalyticsResponse, ScamalyticsErrorResponse } from '@/types/scamalytics';

/**
 * Scamalytics Service
 * Integrates with Scamalytics IP Fraud Score API
 * Documentation: https://scamalytics.com/ip/api
 */
export class ScamalyticsService extends BaseToolService {
  private readonly baseURL = 'https://api11.scamalytics.com';

  constructor(config: ToolServiceConfig) {
    super(config);
  }

  get name(): string {
    return 'Scamalytics';
  }

  get supportedIOCTypes(): IOCType[] {
    return [IOCType.IPV4, IOCType.IPV6];
  }

  /**
   * Analyze an IOC using Scamalytics
   */
  async analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    console.log(`[Scamalytics] Analyzing IOC: ${ioc.value} (${ioc.type})`);

    if (!this.isConfigured()) {
      console.log('[Scamalytics] Service not configured - no API key');
      return this.createErrorResult(ioc, 'Scamalytics API key not configured');
    }

    if (!this.supports(ioc.type)) {
      console.log(`[Scamalytics] Unsupported IOC type: ${ioc.type}`);
      return this.createUnsupportedResult(ioc);
    }

    console.log(`[Scamalytics] Starting analysis for ${ioc.type}`);
    try {
      return await this.analyzeIP(ioc);
    } catch (error) {
      return this.createErrorResult(
        ioc,
        error instanceof Error ? error : 'Unknown error occurred'
      );
    }
  }

  /**
   * Analyze IP address
   * Endpoint: GET /ip/{ip}
   */
  private async analyzeIP(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const endpoint = `${this.baseURL}/ip/${ioc.value}`;
    console.log(`[Scamalytics] API request to: ${endpoint}`);

    const response = await this.fetchWithTimeout(endpoint, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Accept': 'application/json',
      },
    });

    console.log(`[Scamalytics] API response status: ${response.status}`);

    if (!response.ok) {
      const errorData: ScamalyticsErrorResponse = await response.json();
      throw new Error(
        `Scamalytics API error: ${errorData.message || errorData.error} (${response.status})`
      );
    }

    const data: ScamalyticsResponse = await response.json();
    const score = data.score || 0;
    const risk = data.risk || 'very low';

    // Map Scamalytics risk to our status
    // Score: 0-100 (higher = more risky)
    let status: 'safe' | 'suspicious' | 'malicious' = 'safe';
    if (score >= 75 || risk === 'very high' || risk === 'high') {
      status = 'malicious';
    } else if (score >= 40 || risk === 'medium') {
      status = 'suspicious';
    }

    return {
      ioc,
      source: this.name,
      status,
      details: {
        score,
        risk,
        risk_description: this.getRiskDescription(risk),
        entries: data.entries || [],
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Get risk description
   */
  private getRiskDescription(risk: string): string {
    const descriptions: Record<string, string> = {
      'very high': 'IP address is very likely to be fraudulent',
      'high': 'IP address is likely to be fraudulent',
      'medium': 'IP address shows some fraudulent characteristics',
      'low': 'IP address shows minimal fraudulent characteristics',
      'very low': 'IP address appears legitimate',
    };

    return descriptions[risk] || 'Unknown risk level';
  }
}
