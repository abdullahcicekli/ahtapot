import { BaseToolService, ToolServiceConfig } from '../base/BaseToolService';
import { DetectedIOC, IOCAnalysisResult, IOCType } from '@/types/ioc';
import {
  GreyNoiseIPContext,
  GreyNoiseAnalysisStats,
  GREYNOISE_RATE_LIMITS,
} from '@/types/greynoise';

/**
 * GreyNoise Service
 * Integrates with GreyNoise API for internet noise and threat classification
 * Documentation: https://docs.greynoise.io/
 *
 * Key Features:
 * - Distinguishes between internet noise and real threats
 * - IP classification (benign/malicious/unknown)
 * - Actor and behavior tag identification
 * - TOR/VPN/Proxy detection
 * - RIOT (Rule It Out) - identifies known benign services
 *
 * Rate Limits:
 * - Community: 20 requests/minute, 10,000/month
 * - Enterprise: Higher limits based on plan
 */
export class GreyNoiseService extends BaseToolService {
  private readonly baseURL = 'https://api.greynoise.io/v3';
  private readonly rateLimit = {
    maxRequests: GREYNOISE_RATE_LIMITS.COMMUNITY.requestsPerMinute,
    perMilliseconds: 60000, // 1 minute
  };
  private requestTimestamps: number[] = [];

  constructor(config: ToolServiceConfig = {}) {
    super({
      ...config,
      timeout: 30000, // 30 seconds
    });
  }

  get name(): string {
    return 'GreyNoise';
  }

  get supportedIOCTypes(): IOCType[] {
    // GreyNoise primarily supports IPv4 addresses
    // IPv6 support is limited - check API documentation for updates
    return [IOCType.IPV4];
  }

  /**
   * Analyze an IOC using GreyNoise Community API
   */
  async analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    console.log(`[GreyNoise] Analyzing IOC: ${ioc.value} (${ioc.type})`);

    if (!this.isConfigured()) {
      console.log('[GreyNoise] Service not configured - API key missing');
      return this.createErrorResult(ioc, 'GreyNoise API key is required');
    }

    if (!this.supports(ioc.type)) {
      console.log(`[GreyNoise] Unsupported IOC type: ${ioc.type}`);
      return this.createUnsupportedResult(ioc);
    }

    try {
      return await this.lookupIP(ioc);
    } catch (error) {
      return this.createErrorResult(
        ioc,
        error instanceof Error ? error : 'Unknown error occurred'
      );
    }
  }

  /**
   * Lookup IP address using GreyNoise Community API
   * Endpoint: GET /v3/community/{ip}
   */
  private async lookupIP(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    // Apply rate limiting
    await this.waitForRateLimit();

    const endpoint = `${this.baseURL}/community/${ioc.value}`;
    console.log(`[GreyNoise] IP lookup request for: ${ioc.value}`);

    const response = await this.fetchWithTimeout(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'key': this.config.apiKey || '',
      },
    });

    console.log(`[GreyNoise] IP lookup response status: ${response.status}`);

    // Handle 404 - IP not found in GreyNoise database
    // This is COMMON and NOT an error - it means GreyNoise hasn't seen this IP
    if (response.status === 404) {
      console.log(`[GreyNoise] IP not found in database: ${ioc.value}`);
      return {
        ioc,
        source: this.name,
        status: 'unknown',
        details: {
          message: 'This IP has not been observed by GreyNoise sensors',
          note: 'GreyNoise has not seen this IP scanning the internet. This does not indicate safety or threat status.',
          seen: false,
        },
        timestamp: Date.now(),
      };
    }

    // Handle 401 - Invalid API key
    if (response.status === 401) {
      console.log('[GreyNoise] Invalid API key');
      throw new Error('Invalid GreyNoise API key. Please check your API key in settings.');
    }

    // Handle rate limiting
    if (response.status === 429) {
      console.log('[GreyNoise] Rate limit exceeded');
      throw new Error('GreyNoise API rate limit exceeded. Community plan: 20 requests/minute.');
    }

    // Handle quota exceeded (monthly limit)
    if (response.status === 403) {
      console.log('[GreyNoise] Quota exceeded');
      throw new Error('GreyNoise monthly quota exceeded. Community plan: 10,000 requests/month.');
    }

    // Handle other errors
    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.log(`[GreyNoise] API error:`, errorData);
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(`GreyNoise API error: ${errorMessage} (${response.status})`);
    }

    const data: GreyNoiseIPContext = await response.json();
    console.log(`[GreyNoise] IP data received for: ${data.ip}`);

    // Calculate statistics
    const stats = this.calculateStats(data);

    // Determine threat status based on GreyNoise classification
    const status = this.determineGreyNoiseStatus(data);

    return {
      ioc,
      source: this.name,
      status,
      details: {
        // Basic Information
        ip: data.ip,
        seen: data.seen,
        classification: data.classification,

        // Identification
        actor: data.actor,
        tags: data.tags || [],

        // Timeline
        firstSeen: data.first_seen,
        lastSeen: data.last_seen,

        // Location & Network
        country: data.metadata?.country,
        countryCode: data.metadata?.country_code,
        city: data.metadata?.city,
        organization: data.metadata?.organization,
        rdns: data.metadata?.rdns,
        asn: data.metadata?.asn,

        // Security Indicators
        isTor: data.metadata?.tor || false,
        isVPN: data.metadata?.vpn || data.vpn || false,
        isProxy: data.metadata?.proxy || false,

        // RIOT Flag - known benign service
        isRiot: data.riot || false,
        riotName: data.name,

        // Link to GreyNoise Visualizer
        link: data.link || `https://viz.greynoise.io/ip/${ioc.value}`,

        // Statistics
        stats,

        // Summary
        summary: this.generateSummary(data, stats),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Determine threat status based on GreyNoise classification
   */
  private determineGreyNoiseStatus(data: GreyNoiseIPContext): IOCAnalysisResult['status'] {
    // If not seen by GreyNoise
    if (!data.seen) {
      return 'unknown';
    }

    // If RIOT flag is true, this is a known benign service
    if (data.riot) {
      return 'safe';
    }

    // Based on GreyNoise classification
    switch (data.classification) {
      case 'malicious':
        return 'malicious';
      case 'benign':
        // Benign means "known internet scanner, not malicious"
        return 'safe';
      case 'unknown':
        // Seen but not classified yet
        return 'suspicious';
      default:
        return 'unknown';
    }
  }

  /**
   * Calculate statistics from GreyNoise response
   */
  private calculateStats(data: GreyNoiseIPContext): GreyNoiseAnalysisStats {
    return {
      classification: data.classification,
      seen: data.seen,
      tags: data.tags || [],
      country: data.metadata?.country,
      organization: data.metadata?.organization,
      lastSeen: data.last_seen,
      isTor: data.metadata?.tor || false,
      isVPN: data.metadata?.vpn || data.vpn || false,
      isProxy: data.metadata?.proxy || false,
      isRiot: data.riot || false,
    };
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(data: GreyNoiseIPContext, stats: GreyNoiseAnalysisStats): string {
    const parts: string[] = [];

    // Classification
    parts.push(`Classification: ${data.classification}`);

    // RIOT status
    if (data.riot && data.name) {
      parts.push(`Known Service: ${data.name}`);
    }

    // Actor
    if (data.actor) {
      parts.push(`Actor: ${data.actor}`);
    }

    // Organization
    if (stats.organization) {
      parts.push(`Org: ${stats.organization}`);
    }

    // Country
    if (stats.country) {
      parts.push(`Country: ${stats.country}`);
    }

    // Tags (first 3)
    if (stats.tags.length > 0) {
      const tagSummary = stats.tags.slice(0, 3).join(', ');
      parts.push(`Tags: ${tagSummary}${stats.tags.length > 3 ? '...' : ''}`);
    }

    // Security indicators
    const indicators: string[] = [];
    if (stats.isTor) indicators.push('TOR');
    if (stats.isVPN) indicators.push('VPN');
    if (stats.isProxy) indicators.push('Proxy');
    if (indicators.length > 0) {
      parts.push(indicators.join('/'));
    }

    return parts.join(' | ');
  }

  /**
   * Rate limiting implementation
   * Community API: 20 requests/minute
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();

    // Remove timestamps older than the rate limit window (1 minute)
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.rateLimit.perMilliseconds
    );

    // If we've hit the limit, wait
    if (this.requestTimestamps.length >= this.rateLimit.maxRequests) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = this.rateLimit.perMilliseconds - (now - oldestTimestamp);

      if (waitTime > 0) {
        console.log(`[GreyNoise] Rate limit reached (${this.rateLimit.maxRequests}/min), waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Record this request
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Batch analyze is not optimized for GreyNoise (no bulk endpoint in Community API)
   * Falls back to sequential processing with rate limiting
   */
  async analyzeBatch(iocs: DetectedIOC[]): Promise<IOCAnalysisResult[]> {
    console.log(`[GreyNoise] Batch analysis requested for ${iocs.length} IOCs`);
    console.log('[GreyNoise] Using sequential processing with rate limiting (20 requests/min)');

    // Use default sequential implementation from BaseToolService
    // Rate limiting is handled in waitForRateLimit() for each request
    return super.analyzeBatch(iocs);
  }
}
