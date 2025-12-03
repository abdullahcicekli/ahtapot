import { BaseToolService, ToolServiceConfig } from '../base/BaseToolService';
import { DetectedIOC, IOCAnalysisResult, IOCType } from '@/types/ioc';
import { ScamalyticsResponse } from '@/types/scamalytics';

/**
 * Scamalytics Service
 * Uses the official Scamalytics IP Fraud Risk API v3
 * API key format: username:apikey
 * API endpoint: https://api12.scamalytics.com/v3/{username}/?key={apikey}&ip={ip}
 */
export class ScamalyticsService extends BaseToolService {
  private readonly apiBaseURL = 'https://api12.scamalytics.com/v3';

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
   * Check if service is configured
   * Requires API key in format: username:apikey
   */
  isConfigured(): boolean {
    const credentials = this.parseCredentials();
    return !!(credentials.username && credentials.apiKey);
  }

  /**
   * Parse credentials from apiKey (format: username:apikey)
   */
  private parseCredentials(): { username: string; apiKey: string } {
    const apiKey = this.config.apiKey || '';
    const parts = apiKey.split(':');
    
    if (parts.length >= 2) {
      return {
        username: parts[0].trim(),
        apiKey: parts.slice(1).join(':').trim(), // Handle case where apikey might contain colons
      };
    }
    
    return { username: '', apiKey: '' };
  }

  /**
   * Analyze an IOC using Scamalytics API
   */
  async analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    console.log(`[Scamalytics] Analyzing IOC: ${ioc.value} (${ioc.type})`);

    if (!this.supports(ioc.type)) {
      console.log(`[Scamalytics] Unsupported IOC type: ${ioc.type}`);
      return this.createUnsupportedResult(ioc);
    }

    if (!this.isConfigured()) {
      console.log('[Scamalytics] Not configured - API credentials missing');
      return this.createErrorResult(ioc, 'Scamalytics API credentials not configured. Format: username:apikey');
    }

    try {
      return await this.queryAPI(ioc);
    } catch (error) {
      console.error('[Scamalytics] Analysis error:', error);
      return this.createErrorResult(
        ioc,
        error instanceof Error ? error : 'Unknown error occurred'
      );
    }
  }

  /**
   * Query Scamalytics API
   */
  private async queryAPI(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const { username, apiKey } = this.parseCredentials();
    const url = `${this.apiBaseURL}/${encodeURIComponent(username)}/?key=${encodeURIComponent(apiKey)}&ip=${encodeURIComponent(ioc.value)}`;
    
    console.log(`[Scamalytics] Fetching API: ${this.apiBaseURL}/${username}/?key=***&ip=${ioc.value}`);

    const response = await this.fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`[Scamalytics] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Scamalytics] API error:', errorText);
      
      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid API credentials');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      
      throw new Error(`API returned HTTP ${response.status}`);
    }

    const data: ScamalyticsResponse = await response.json();
    console.log('[Scamalytics] API response:', JSON.stringify(data, null, 2));

    return this.buildResult(ioc, data);
  }

  /**
   * Build result from API response
   */
  private buildResult(ioc: DetectedIOC, response: ScamalyticsResponse): IOCAnalysisResult {
    const scamalytics = response.scamalytics;

    if (scamalytics.status === 'error') {
      return this.createErrorResult(ioc, scamalytics.error || 'API returned error status');
    }

    const score = scamalytics.scamalytics_score ?? 0;
    const risk = (scamalytics.scamalytics_risk || 'unknown').toLowerCase();
    const proxyInfo = scamalytics.scamalytics_proxy || {};

    // Determine status based on score and risk
    let status: 'safe' | 'suspicious' | 'malicious' = 'safe';
    if (score >= 75 || risk === 'very high' || risk === 'high') {
      status = 'malicious';
    } else if (score >= 40 || risk === 'medium') {
      status = 'suspicious';
    }

    // Build fraud indicators
    const fraudIndicators: string[] = [];
    if (proxyInfo.is_vpn) fraudIndicators.push('VPN');
    if (proxyInfo.is_tor) fraudIndicators.push('Tor Exit Node');
    if (proxyInfo.is_datacenter) fraudIndicators.push('Datacenter');
    if (proxyInfo.is_apple_icloud_private_relay) fraudIndicators.push('iCloud Private Relay');
    if (proxyInfo.is_amazon_aws) fraudIndicators.push('Amazon AWS');
    if (proxyInfo.is_google) fraudIndicators.push('Google');

    // Extract external datasource info
    const externalData = response.external_datasources || {};
    const geoInfo = externalData.maxmind_geolite2 || externalData.ipinfo || {};
    const firehol = externalData.firehol || {};
    const ipsum = externalData.ipsum || {};

    // Check if blacklisted
    const isBlacklisted = scamalytics.is_blacklisted_external || 
                          firehol.ip_blacklisted_30 || 
                          firehol.ip_blacklisted_1day ||
                          ipsum.ip_blacklisted || false;

    return {
      ioc,
      source: this.name,
      status,
      details: {
        score,
        risk,
        risk_description: this.getRiskDescription(risk),
        isp_score: scamalytics.scamalytics_isp_score,
        isp_risk: scamalytics.scamalytics_isp_risk,
        proxy_info: {
          is_vpn: proxyInfo.is_vpn || false,
          is_tor: proxyInfo.is_tor || false,
          is_datacenter: proxyInfo.is_datacenter || false,
          is_icloud_relay: proxyInfo.is_apple_icloud_private_relay || false,
          is_aws: proxyInfo.is_amazon_aws || false,
          is_google: proxyInfo.is_google || false,
        },
        fraud_indicators: fraudIndicators,
        is_blacklisted: isBlacklisted,
        geo_info: {
          country_code: geoInfo.ip_country_code,
          country_name: geoInfo.ip_country_name,
          city: geoInfo.ip_city,
          state: geoInfo.ip_state_name,
          asn: geoInfo.asn,
          as_name: geoInfo.as_name,
          isp: geoInfo.isp_name,
        },
        credits: scamalytics.credits,
        scamalytics_url: scamalytics.scamalytics_url || `https://scamalytics.com/ip/${ioc.value}`,
        mode: scamalytics.mode,
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
