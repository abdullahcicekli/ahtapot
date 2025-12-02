import { BaseToolService, ToolServiceConfig } from '../base/BaseToolService';
import { DetectedIOC, IOCAnalysisResult, IOCType } from '@/types/ioc';

/**
 * Scamalytics API Response Types
 */
interface ScamalyticsProxyInfo {
  is_datacenter?: boolean;
  is_vpn?: boolean;
  is_apple_icloud_private_relay?: boolean;
  is_amazon_aws?: boolean;
  is_google?: boolean;
  is_tor?: boolean;
}

interface ScamalyticsCredits {
  used?: number;
  remaining?: number;
  last_sync_timestamp_utc?: string;
}

interface ScamalyticsData {
  status: string;
  mode?: string;
  ip?: string;
  score?: number;
  risk?: string;
  scamalytics_score?: number;
  scamalytics_risk?: string;
  scamalytics_url?: string;
  scamalytics_isp_score?: number;
  scamalytics_isp_risk?: string;
  scamalytics_proxy?: ScamalyticsProxyInfo;
  is_blacklisted_external?: boolean;
  credits?: ScamalyticsCredits;
  exec?: string;
  error?: string;
}

interface ScamalyticsResponse {
  // V3 format
  scamalytics?: ScamalyticsData;
  external_datasources?: any;
  // Alternative format (direct response)
  status?: string;
  ip?: string;
  score?: number;
  risk?: string;
  error?: string;
}

/**
 * Scamalytics Service
 * Integrates with Scamalytics IP Fraud Score API
 * 
 * API Key Format Options:
 * 1. Single API key (hash): "ba60f951414cc61191470dfbb10176224247c0a19ebe8d8e474233eadd3012c5"
 * 2. Username:Key format: "myusername:abc123xyz"
 * 
 * The service will auto-detect the format and use the appropriate authentication method.
 */
export class ScamalyticsService extends BaseToolService {
  // Default to US endpoint, can be api12.scamalytics.com for Europe
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
   * Parse API key to determine format
   * Returns { type: 'single' | 'userkey', username?: string, key: string }
   */
  private parseApiKey(): { type: 'single' | 'userkey'; username?: string; key: string } | null {
    if (!this.config.apiKey || this.config.apiKey.trim() === '') return null;
    
    const apiKey = this.config.apiKey.trim();
    
    // Check if it's username:key format
    if (apiKey.includes(':')) {
      const parts = apiKey.split(':');
      if (parts.length === 2 && parts[0].trim() !== '' && parts[1].trim() !== '') {
        return {
          type: 'userkey',
          username: parts[0].trim(),
          key: parts[1].trim()
        };
      }
    }
    
    // Single API key format (hash)
    return {
      type: 'single',
      key: apiKey
    };
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    const credentials = this.parseApiKey();
    return credentials !== null && credentials.key !== '';
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
      console.error('[Scamalytics] Analysis error:', error);
      return this.createErrorResult(
        ioc,
        error instanceof Error ? error : 'Unknown error occurred'
      );
    }
  }

  /**
   * Analyze IP address
   * Tries multiple endpoint formats based on API key type
   */
  private async analyzeIP(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const credentials = this.parseApiKey();
    if (!credentials) {
      throw new Error('Invalid API key');
    }

    let response: Response;
    let url: string;

    if (credentials.type === 'userkey' && credentials.username) {
      // Format: https://api11.scamalytics.com/<username>?key=<key>&ip=<ip>
      url = `${this.baseURL}/${credentials.username}?key=${credentials.key}&ip=${ioc.value}`;
      console.log(`[Scamalytics] Using username:key format - ${this.baseURL}/${credentials.username}?key=***&ip=${ioc.value}`);
      
      response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
    } else {
      // Try multiple formats for single API key
      
      // Format 1: Query parameter with key
      url = `${this.baseURL}/?key=${credentials.key}&ip=${ioc.value}`;
      console.log(`[Scamalytics] Trying format 1: query param - ${this.baseURL}/?key=***&ip=${ioc.value}`);
      
      response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      // If format 1 fails, try format 2: Bearer token
      if (!response.ok && response.status === 401) {
        url = `${this.baseURL}/ip/${ioc.value}`;
        console.log(`[Scamalytics] Trying format 2: Bearer token - ${url}`);
        
        response = await this.fetchWithTimeout(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${credentials.key}`,
            'Accept': 'application/json',
          },
        });
      }

      // If format 2 fails, try format 3: X-API-Key header
      if (!response.ok && response.status === 401) {
        url = `${this.baseURL}/ip/${ioc.value}`;
        console.log(`[Scamalytics] Trying format 3: X-API-Key header - ${url}`);
        
        response = await this.fetchWithTimeout(url, {
          method: 'GET',
          headers: {
            'X-API-Key': credentials.key,
            'Accept': 'application/json',
          },
        });
      }
    }

    console.log(`[Scamalytics] API response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.scamalytics?.error || errorData.error || errorData.message || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(`Scamalytics API error: ${errorMessage}`);
    }

    const data: ScamalyticsResponse = await response.json();
    console.log('[Scamalytics] API response:', JSON.stringify(data, null, 2));

    // Handle different response formats
    let score: number;
    let risk: string;
    let proxyInfo: ScamalyticsProxyInfo = {};
    let ispScore: number | undefined;
    let ispRisk: string | undefined;
    let isBlacklisted = false;
    let scamalyticsUrl: string | undefined;
    let externalDatasources: any;

    if (data.scamalytics) {
      // V3 format with nested scamalytics object
      const scamalyticsData = data.scamalytics;
      
      if (scamalyticsData.status === 'error') {
        throw new Error(`Scamalytics API error: ${scamalyticsData.error || 'Unknown error'}`);
      }
      
      score = scamalyticsData.scamalytics_score ?? scamalyticsData.score ?? 0;
      risk = scamalyticsData.scamalytics_risk || scamalyticsData.risk || 'unknown';
      proxyInfo = scamalyticsData.scamalytics_proxy || {};
      ispScore = scamalyticsData.scamalytics_isp_score;
      ispRisk = scamalyticsData.scamalytics_isp_risk;
      isBlacklisted = scamalyticsData.is_blacklisted_external || false;
      scamalyticsUrl = scamalyticsData.scamalytics_url;
      externalDatasources = data.external_datasources;
    } else {
      // Direct response format
      if (data.status === 'error') {
        throw new Error(`Scamalytics API error: ${data.error || 'Unknown error'}`);
      }
      
      score = data.score ?? 0;
      risk = data.risk || 'unknown';
    }

    // Map Scamalytics risk to our status
    // Score: 0-100 (higher = more risky)
    let status: 'safe' | 'suspicious' | 'malicious' = 'safe';
    const riskLower = risk.toLowerCase();
    if (score >= 75 || riskLower === 'very high' || riskLower === 'high') {
      status = 'malicious';
    } else if (score >= 40 || riskLower === 'medium') {
      status = 'suspicious';
    }

    // Build fraud indicators
    const fraudIndicators: string[] = [];
    if (proxyInfo.is_datacenter) fraudIndicators.push('Datacenter IP');
    if (proxyInfo.is_vpn) fraudIndicators.push('VPN');
    if (proxyInfo.is_tor) fraudIndicators.push('Tor Exit Node');
    if (proxyInfo.is_apple_icloud_private_relay) fraudIndicators.push('iCloud Private Relay');
    if (proxyInfo.is_amazon_aws) fraudIndicators.push('Amazon AWS');
    if (proxyInfo.is_google) fraudIndicators.push('Google');
    if (isBlacklisted) fraudIndicators.push('Blacklisted');

    return {
      ioc,
      source: this.name,
      status,
      details: {
        score,
        risk,
        risk_description: this.getRiskDescription(risk),
        isp_score: ispScore,
        isp_risk: ispRisk,
        proxy_info: proxyInfo,
        fraud_indicators: fraudIndicators,
        is_blacklisted: isBlacklisted,
        scamalytics_url: scamalyticsUrl || `https://scamalytics.com/ip/${ioc.value}`,
        external_datasources: externalDatasources,
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

    return descriptions[risk.toLowerCase()] || 'Unknown risk level';
  }
}
