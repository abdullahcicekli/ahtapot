import { BaseToolService, ToolServiceConfig } from '../base/BaseToolService';
import { DetectedIOC, IOCAnalysisResult, IOCType } from '@/types/ioc';

/**
 * Scamalytics Response Types (from web scraping)
 */
interface ScamalyticsScrapedData {
  score?: string;
  risk?: string;
  'Anonymizing VPN'?: string;
  'Tor Exit Node'?: string;
  'Server'?: string;
  'Public Proxy'?: string;
  'Web Proxy'?: string;
  'Search Engine Robot'?: string;
  // Additional fields that might be present
  [key: string]: string | undefined;
}

/**
 * Scamalytics Service
 * Uses web scraping to get IP fraud scores from scamalytics.com
 * No API key required - scrapes the public website
 */
export class ScamalyticsService extends BaseToolService {
  private readonly publicURL = 'https://scamalytics.com/ip';

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
   * Scamalytics works without API key (web scraping)
   */
  isConfigured(): boolean {
    return true; // Always configured - uses public website
  }

  /**
   * Analyze an IOC using Scamalytics
   */
  async analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    console.log(`[Scamalytics] Analyzing IOC: ${ioc.value} (${ioc.type})`);

    if (!this.supports(ioc.type)) {
      console.log(`[Scamalytics] Unsupported IOC type: ${ioc.type}`);
      return this.createUnsupportedResult(ioc);
    }

    console.log(`[Scamalytics] Starting web scraping analysis for ${ioc.value}`);
    try {
      return await this.scrapeIP(ioc);
    } catch (error) {
      console.error('[Scamalytics] Analysis error:', error);
      return this.createErrorResult(
        ioc,
        error instanceof Error ? error : 'Unknown error occurred'
      );
    }
  }

  /**
   * Scrape IP information from scamalytics.com
   * Similar to the Go ipchecker package approach
   */
  private async scrapeIP(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const url = `${this.publicURL}/${ioc.value}`;
    console.log(`[Scamalytics] Fetching: ${url}`);

    const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

    console.log(`[Scamalytics] Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`Scamalytics returned HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // Extract JSON from <pre> tags (like Go code does)
    const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    if (!preMatch || !preMatch[1]) {
      console.log('[Scamalytics] Could not find <pre> tag, trying alternative parsing');
      return this.parseFromHTML(ioc, html);
    }

    let jsonStr = preMatch[1].trim();
    console.log('[Scamalytics] Raw pre content:', jsonStr.substring(0, 200));

    // Clean up the JSON string (like Go code does)
    // Remove trailing "..." and fix trailing commas
    jsonStr = jsonStr.replace(/\.\.\./, '');
    jsonStr = jsonStr.replace(/,(\s*})/, '$1');
    jsonStr = jsonStr.replace(/,(\s*$)/, '');
    
    // Wrap in braces if needed
    if (!jsonStr.startsWith('{')) {
      jsonStr = '{' + jsonStr + '}';
    }

    let data: ScamalyticsScrapedData;
    try {
      data = JSON.parse(jsonStr);
      console.log('[Scamalytics] Parsed data:', data);
    } catch (parseError) {
      console.error('[Scamalytics] JSON parse error:', parseError);
      console.log('[Scamalytics] Falling back to HTML parsing');
      return this.parseFromHTML(ioc, html);
    }

    return this.buildResult(ioc, data, html);
  }

  /**
   * Parse data from HTML when JSON extraction fails
   */
  private parseFromHTML(ioc: DetectedIOC, html: string): IOCAnalysisResult {
    // Try to extract score from HTML
    const scoreMatch = html.match(/Fraud\s*Score[:\s]*(\d+)/i) || 
                       html.match(/score[:\s]*["']?(\d+)["']?/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;

    // Try to extract risk level
    const riskMatch = html.match(/risk[:\s]*["']?([^"'<\n,]+)["']?/i);
    const risk = riskMatch ? riskMatch[1].trim().toLowerCase() : 'unknown';

    // Check for proxy indicators in HTML
    const isVPN = /vpn[:\s]*["']?yes["']?/i.test(html) || html.includes('Anonymizing VPN');
    const isTor = /tor[:\s]*["']?yes["']?/i.test(html) || html.includes('Tor Exit Node');
    const isProxy = /proxy[:\s]*["']?yes["']?/i.test(html);
    const isDatacenter = /server[:\s]*["']?yes["']?/i.test(html) || /datacenter/i.test(html);

    const proxyInfo = {
      is_vpn: isVPN,
      is_tor: isTor,
      is_datacenter: isDatacenter,
    };

    // Determine status
    let status: 'safe' | 'suspicious' | 'malicious' = 'safe';
    if (score >= 75 || risk === 'very high' || risk === 'high') {
      status = 'malicious';
    } else if (score >= 40 || risk === 'medium') {
      status = 'suspicious';
    }

    const fraudIndicators: string[] = [];
    if (isVPN) fraudIndicators.push('VPN');
    if (isTor) fraudIndicators.push('Tor Exit Node');
    if (isProxy) fraudIndicators.push('Proxy');
    if (isDatacenter) fraudIndicators.push('Datacenter/Server');

    return {
      ioc,
      source: this.name,
      status,
      details: {
        score,
        risk,
        risk_description: this.getRiskDescription(risk),
        proxy_info: proxyInfo,
        fraud_indicators: fraudIndicators,
        is_blacklisted: false,
        scamalytics_url: `https://scamalytics.com/ip/${ioc.value}`,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Build result from scraped data
   */
  private buildResult(ioc: DetectedIOC, data: ScamalyticsScrapedData, _html: string): IOCAnalysisResult {
    const score = data.score ? parseInt(data.score, 10) : 0;
    const risk = (data.risk || 'unknown').toLowerCase();

    // Parse proxy indicators
    const isYes = (val: string | undefined) => val?.toLowerCase() === 'yes';
    
    const proxyInfo = {
      is_vpn: isYes(data['Anonymizing VPN']),
      is_tor: isYes(data['Tor Exit Node']),
      is_datacenter: isYes(data['Server']),
      is_public_proxy: isYes(data['Public Proxy']),
      is_web_proxy: isYes(data['Web Proxy']),
      is_search_engine_robot: isYes(data['Search Engine Robot']),
    };

    // Determine status
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
    if (proxyInfo.is_datacenter) fraudIndicators.push('Datacenter/Server');
    if (proxyInfo.is_public_proxy) fraudIndicators.push('Public Proxy');
    if (proxyInfo.is_web_proxy) fraudIndicators.push('Web Proxy');
    if (proxyInfo.is_search_engine_robot) fraudIndicators.push('Search Engine Robot');

    return {
      ioc,
      source: this.name,
      status,
      details: {
        score,
        risk,
        risk_description: this.getRiskDescription(risk),
        proxy_info: proxyInfo,
        fraud_indicators: fraudIndicators,
        is_blacklisted: false,
        scamalytics_url: `https://scamalytics.com/ip/${ioc.value}`,
        raw_data: data,
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
