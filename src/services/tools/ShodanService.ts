import { BaseToolService, ToolServiceConfig } from '../base/BaseToolService';
import { DetectedIOC, IOCAnalysisResult, IOCType } from '@/types/ioc';
import {
  ShodanHost,
  ShodanDomain,
  ShodanErrorResponse,
  ShodanAnalysisStats,
} from '@/types/shodan';

/**
 * Shodan Service
 * Integrates with Shodan API for Internet-connected device search and analysis
 * Documentation: https://developer.shodan.io/api
 *
 * Key Features:
 * - IP address lookup with service and vulnerability information
 * - Domain DNS information and subdomain discovery
 * - Port scanning and banner grabbing results
 * - CVE vulnerability identification
 * - Geolocation and organization data
 */
export class ShodanService extends BaseToolService {
  private readonly baseURL = 'https://api.shodan.io';
  private readonly rateLimit = {
    maxRequests: 1, // Conservative: 1 request per second for free tier
    perMilliseconds: 1000,
  };
  private requestTimestamps: number[] = [];

  constructor(config: ToolServiceConfig = {}) {
    super({
      ...config,
      timeout: 30000, // 30 seconds
    });
  }

  get name(): string {
    return 'Shodan';
  }

  get supportedIOCTypes(): IOCType[] {
    // Shodan primarily supports IP addresses and domains
    return [IOCType.IPV4, IOCType.IPV6, IOCType.DOMAIN];
  }

  /**
   * Analyze an IOC using Shodan API
   */
  async analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    console.log(`[Shodan] Analyzing IOC: ${ioc.value} (${ioc.type})`);

    if (!this.isConfigured()) {
      console.log('[Shodan] Service not configured - API key missing');
      return this.createErrorResult(ioc, 'Shodan API key is required');
    }

    if (!this.supports(ioc.type)) {
      console.log(`[Shodan] Unsupported IOC type: ${ioc.type}`);
      return this.createUnsupportedResult(ioc);
    }

    try {
      if (ioc.type === IOCType.DOMAIN) {
        return await this.lookupDomain(ioc);
      } else {
        // IPv4 or IPv6
        return await this.lookupHost(ioc);
      }
    } catch (error) {
      return this.createErrorResult(
        ioc,
        error instanceof Error ? error : 'Unknown error occurred'
      );
    }
  }

  /**
   * Lookup host information by IP address
   * Endpoint: GET /shodan/host/{ip}
   */
  private async lookupHost(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    // Apply rate limiting
    await this.waitForRateLimit();

    const endpoint = `${this.baseURL}/shodan/host/${ioc.value}?key=${this.config.apiKey}`;
    console.log(`[Shodan] Host lookup request for: ${ioc.value}`);

    const response = await this.fetchWithTimeout(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`[Shodan] Host lookup response status: ${response.status}`);

    // Handle 404 - IP not found in Shodan database
    if (response.status === 404) {
      console.log(`[Shodan] IP not found in database: ${ioc.value}`);
      return {
        ioc,
        source: this.name,
        status: 'unknown',
        details: {
          message: 'This IP address has not been scanned by Shodan yet',
          note: 'The IP may not have any open ports or services, or it has not been indexed by Shodan',
        },
        timestamp: Date.now(),
      };
    }

    // Handle 401 - Invalid API key
    if (response.status === 401) {
      console.log('[Shodan] Invalid API key');
      throw new Error('Invalid Shodan API key. Please check your API key in settings.');
    }

    // Handle rate limiting
    if (response.status === 429) {
      console.log('[Shodan] Rate limit exceeded');
      throw new Error('Shodan API rate limit exceeded. Please try again later.');
    }

    // Handle other errors
    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData: ShodanErrorResponse = await response.json();
        errorMessage = errorData.error || errorMessage;
        console.log(`[Shodan] API error:`, errorData);
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(`Shodan API error: ${errorMessage} (${response.status})`);
    }

    const data: ShodanHost = await response.json();
    console.log(`[Shodan] Host data received for: ${data.ip_str}`);

    // Calculate statistics
    const stats = this.calculateHostStats(data);

    // Determine threat status based on vulnerabilities and open ports
    const status = this.determineHostStatus(stats);

    return {
      ioc,
      source: this.name,
      status,
      details: {
        // Basic Information
        ip: data.ip_str,
        hostnames: data.hostnames || [],
        os: data.os,
        organization: data.org,
        isp: data.isp,
        asn: data.asn,

        // Location
        country: data.country_name,
        countryCode: data.country_code,
        city: data.city,
        region: data.region_code,
        postalCode: data.postal_code,
        latitude: data.latitude,
        longitude: data.longitude,

        // Ports and Services
        totalPorts: stats.totalPorts,
        openPorts: stats.openPorts,
        services: stats.services,

        // Vulnerabilities
        totalVulnerabilities: stats.totalVulnerabilities,
        vulnerabilities: stats.vulnerabilities,
        vulns: data.vulns || [],

        // Additional Information
        tags: data.tags || [],
        lastUpdate: data.last_update,

        // Statistics
        stats,

        // Summary
        summary: this.generateHostSummary(data, stats),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Lookup domain DNS information
   * Endpoint: GET /dns/domain/{hostname}
   */
  private async lookupDomain(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    // Apply rate limiting
    await this.waitForRateLimit();

    const endpoint = `${this.baseURL}/dns/domain/${ioc.value}?key=${this.config.apiKey}`;
    console.log(`[Shodan] Domain lookup request for: ${ioc.value}`);

    const response = await this.fetchWithTimeout(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`[Shodan] Domain lookup response status: ${response.status}`);

    // Handle errors
    if (response.status === 404) {
      console.log(`[Shodan] Domain not found: ${ioc.value}`);
      return {
        ioc,
        source: this.name,
        status: 'unknown',
        details: {
          message: 'This domain has not been indexed by Shodan',
          note: 'The domain may not have DNS records or has not been scanned yet',
        },
        timestamp: Date.now(),
      };
    }

    if (response.status === 401) {
      throw new Error('Invalid Shodan API key. Please check your API key in settings.');
    }

    if (response.status === 429) {
      throw new Error('Shodan API rate limit exceeded. Please try again later.');
    }

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData: ShodanErrorResponse = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(`Shodan API error: ${errorMessage} (${response.status})`);
    }

    const data: ShodanDomain = await response.json();
    console.log(`[Shodan] Domain data received for: ${data.domain}`);

    return {
      ioc,
      source: this.name,
      status: 'unknown', // Shodan doesn't provide reputation for domains
      details: {
        domain: data.domain,
        tags: data.tags || [],
        subdomains: data.subdomains || [],
        totalSubdomains: data.subdomains?.length || 0,
        dnsRecords: data.data || [],
        summary: this.generateDomainSummary(data),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate statistics from Shodan host response
   */
  private calculateHostStats(data: ShodanHost): ShodanAnalysisStats {
    const services = (data.data || []).map(service => ({
      port: service.port,
      protocol: service.transport,
      product: service.product,
      version: service.version,
    }));

    return {
      totalPorts: data.ports?.length || 0,
      openPorts: data.ports || [],
      totalVulnerabilities: data.vulns?.length || 0,
      vulnerabilities: data.vulns || [],
      services,
      location: data.country_name ? {
        country: data.country_name,
        city: data.city,
        coordinates: (data.latitude && data.longitude) ? {
          lat: data.latitude,
          lon: data.longitude,
        } : undefined,
      } : undefined,
      organization: {
        name: data.org,
        isp: data.isp,
        asn: data.asn,
      },
      os: data.os,
      hostnames: data.hostnames || [],
      lastUpdate: data.last_update,
      tags: data.tags || [],
    };
  }

  /**
   * Determine host status based on vulnerabilities
   */
  private determineHostStatus(stats: ShodanAnalysisStats): IOCAnalysisResult['status'] {
    // If has critical vulnerabilities, mark as malicious
    if (stats.totalVulnerabilities > 0) {
      const hasCriticalVulns = stats.vulnerabilities.some(vuln =>
        vuln.toLowerCase().includes('critical')
      );

      if (hasCriticalVulns || stats.totalVulnerabilities > 5) {
        return 'malicious';
      }

      return 'suspicious';
    }

    // If has many open ports with services, mark as suspicious
    if (stats.totalPorts > 10) {
      return 'suspicious';
    }

    // Otherwise, unknown (Shodan doesn't provide reputation data)
    return 'unknown';
  }

  /**
   * Generate human-readable summary for host
   */
  private generateHostSummary(data: ShodanHost, stats: ShodanAnalysisStats): string {
    const parts: string[] = [];

    if (data.org) {
      parts.push(`Organization: ${data.org}`);
    }

    if (data.country_name) {
      parts.push(`Location: ${data.city ? `${data.city}, ` : ''}${data.country_name}`);
    }

    parts.push(`Open Ports: ${stats.totalPorts}`);

    if (stats.totalVulnerabilities > 0) {
      parts.push(`Vulnerabilities: ${stats.totalVulnerabilities}`);
    }

    if (data.os) {
      parts.push(`OS: ${data.os}`);
    }

    return parts.join(' | ');
  }

  /**
   * Generate human-readable summary for domain
   */
  private generateDomainSummary(data: ShodanDomain): string {
    const parts: string[] = [];

    parts.push(`Domain: ${data.domain}`);

    if (data.subdomains && data.subdomains.length > 0) {
      parts.push(`Subdomains: ${data.subdomains.length}`);
    }

    if (data.tags && data.tags.length > 0) {
      parts.push(`Tags: ${data.tags.join(', ')}`);
    }

    return parts.join(' | ');
  }

  /**
   * Rate limiting implementation
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();

    // Remove timestamps older than the rate limit window
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.rateLimit.perMilliseconds
    );

    // If we've hit the limit, wait
    if (this.requestTimestamps.length >= this.rateLimit.maxRequests) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = this.rateLimit.perMilliseconds - (now - oldestTimestamp);

      if (waitTime > 0) {
        console.log(`[Shodan] Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Record this request
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Batch analyze is not optimized for Shodan (no bulk endpoint)
   * Falls back to sequential processing with rate limiting
   */
  async analyzeBatch(iocs: DetectedIOC[]): Promise<IOCAnalysisResult[]> {
    console.log(`[Shodan] Batch analysis requested for ${iocs.length} IOCs`);
    console.log('[Shodan] Using sequential processing with rate limiting');

    // Use default sequential implementation from BaseToolService
    // Rate limiting is handled in waitForRateLimit() for each request
    return super.analyzeBatch(iocs);
  }
}
