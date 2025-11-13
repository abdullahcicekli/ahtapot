import { BaseToolService, ToolServiceConfig } from '../base/BaseToolService';
import { DetectedIOC, IOCAnalysisResult, IOCType } from '@/types/ioc';
import {
  XForceIPResponse,
  XForceURLResponse,
  XForceMalwareResponse,
  XForceErrorResponse,
} from '@/types/xforce';

/**
 * IBM X-Force Exchange Service
 * Integrates with IBM X-Force Exchange API
 * Documentation: https://api.xforce.ibmcloud.com/doc/
 */
export class XForceService extends BaseToolService {
  private readonly baseURL = 'https://api.xforce.ibmcloud.com';

  constructor(config: ToolServiceConfig) {
    super(config);
  }

  get name(): string {
    return 'X-Force';
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
   * Analyze an IOC using X-Force
   */
  async analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    console.log(`[X-Force] Analyzing IOC: ${ioc.value} (${ioc.type})`);

    if (!this.isConfigured()) {
      console.log('[X-Force] Service not configured - no API key');
      return this.createErrorResult(ioc, 'X-Force API key not configured');
    }

    if (!this.supports(ioc.type)) {
      console.log(`[X-Force] Unsupported IOC type: ${ioc.type}`);
      return this.createUnsupportedResult(ioc);
    }

    console.log(`[X-Force] Starting analysis for ${ioc.type}`);
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
          return await this.analyzeMalware(ioc);
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
   * Get Basic Auth header
   */
  private getAuthHeader(): string {
    // X-Force uses API key as username and password
    // Format: apikey:password
    const [apiKey, password] = this.config.apiKey!.split(':');
    const credentials = btoa(`${apiKey}:${password || ''}`);
    return `Basic ${credentials}`;
  }

  /**
   * Analyze IP address
   * Endpoint: GET /ipr/{ip}
   */
  private async analyzeIP(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const endpoint = `${this.baseURL}/ipr/${ioc.value}`;
    console.log(`[X-Force] API request to: ${endpoint}`);

    const response = await this.fetchWithTimeout(endpoint, {
      headers: {
        'Authorization': this.getAuthHeader(),
        'Accept': 'application/json',
      },
    });

    console.log(`[X-Force] API response status: ${response.status}`);

    if (!response.ok) {
      const errorData: XForceErrorResponse = await response.json();
      throw new Error(
        `X-Force API error: ${errorData.message || errorData.error} (${response.status})`
      );
    }

    const data: XForceIPResponse = await response.json();
    const score = data.score || 0;
    const cats = data.cats || {};

    // X-Force score: 1-10 (1=low risk, 10=high risk)
    let status: 'safe' | 'suspicious' | 'malicious' = 'safe';
    if (score >= 7) {
      status = 'malicious';
    } else if (score >= 4) {
      status = 'suspicious';
    }

    return {
      ioc,
      source: this.name,
      status,
      details: {
        score,
        risk_level: this.getRiskLevel(score),
        categories: cats,
        category_descriptions: data.categoryDescriptions,
        reason: data.reason,
        reason_description: data.reasonDescription,
        geo: data.geo,
        history: data.history,
        subnets: data.subnets,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Analyze Domain
   * Endpoint: GET /url/{domain}
   */
  private async analyzeDomain(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const endpoint = `${this.baseURL}/url/${ioc.value}`;

    const response = await this.fetchWithTimeout(endpoint, {
      headers: {
        'Authorization': this.getAuthHeader(),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: XForceErrorResponse = await response.json();
      throw new Error(
        `X-Force API error: ${errorData.message || errorData.error} (${response.status})`
      );
    }

    const data: XForceURLResponse = await response.json();
    const score = data.result?.score || 0;
    const cats = data.result?.cats || {};

    let status: 'safe' | 'suspicious' | 'malicious' = 'safe';
    if (score >= 7) {
      status = 'malicious';
    } else if (score >= 4) {
      status = 'suspicious';
    }

    return {
      ioc,
      source: this.name,
      status,
      details: {
        score,
        risk_level: this.getRiskLevel(score),
        categories: cats,
        category_descriptions: data.result?.categoryDescriptions,
        application: data.result?.application,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Analyze URL
   * Endpoint: GET /url/{url}
   */
  private async analyzeURL(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    // For URLs, encode the URL
    const encodedURL = encodeURIComponent(ioc.value);
    const endpoint = `${this.baseURL}/url/${encodedURL}`;

    const response = await this.fetchWithTimeout(endpoint, {
      headers: {
        'Authorization': this.getAuthHeader(),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: XForceErrorResponse = await response.json();
      throw new Error(
        `X-Force API error: ${errorData.message || errorData.error} (${response.status})`
      );
    }

    const data: XForceURLResponse = await response.json();
    const score = data.result?.score || 0;
    const cats = data.result?.cats || {};

    let status: 'safe' | 'suspicious' | 'malicious' = 'safe';
    if (score >= 7) {
      status = 'malicious';
    } else if (score >= 4) {
      status = 'suspicious';
    }

    return {
      ioc,
      source: this.name,
      status,
      details: {
        score,
        risk_level: this.getRiskLevel(score),
        categories: cats,
        category_descriptions: data.result?.categoryDescriptions,
        application: data.result?.application,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Analyze Malware (hash)
   * Endpoint: GET /malware/{hash}
   */
  private async analyzeMalware(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const endpoint = `${this.baseURL}/malware/${ioc.value}`;

    const response = await this.fetchWithTimeout(endpoint, {
      headers: {
        'Authorization': this.getAuthHeader(),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          ioc,
          source: this.name,
          status: 'safe',
          details: {
            message: 'Malware not found in X-Force database',
          },
          timestamp: Date.now(),
        };
      }

      const errorData: XForceErrorResponse = await response.json();
      throw new Error(
        `X-Force API error: ${errorData.message || errorData.error} (${response.status})`
      );
    }

    const data: XForceMalwareResponse = await response.json();
    const malware = data.malware;

    // If found in database, it's malicious
    const isMalicious = malware.risk === 'high' || malware.family !== undefined;

    return {
      ioc,
      source: this.name,
      status: isMalicious ? 'malicious' : 'suspicious',
      details: {
        type: malware.type,
        md5: malware.md5,
        family: malware.family,
        risk: malware.risk,
        created: malware.created,
        origins: malware.origins,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Get risk level label from score
   */
  private getRiskLevel(score: number): string {
    if (score >= 7) return 'High';
    if (score >= 4) return 'Medium';
    if (score >= 2) return 'Low';
    return 'Very Low';
  }
}
