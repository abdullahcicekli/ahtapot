import { BaseToolService, ToolServiceConfig } from '../base/BaseToolService';
import { DetectedIOC, IOCAnalysisResult, IOCType } from '@/types/ioc';
import {
  AbuseIPDBCheckResponse,
  AbuseIPDBErrorResponse,
  AbuseIPDBAnalysisStats,
  ABUSE_CATEGORY_LABELS,
} from '@/types/abuseipdb';

/**
 * AbuseIPDB Service
 * Integrates with AbuseIPDB API for IP reputation checking
 * Documentation: https://docs.abuseipdb.com/
 *
 * Free Tier Limits:
 * - 1,000 daily checks
 * - Check endpoint only
 * - Basic IP reputation data
 */
export class AbuseIPDBService extends BaseToolService {
  private readonly baseURL = 'https://api.abuseipdb.com/api/v2';
  private readonly maxAgeInDays = 90; // Default report window

  constructor(config: ToolServiceConfig) {
    super(config);
  }

  get name(): string {
    return 'AbuseIPDB';
  }

  get supportedIOCTypes(): IOCType[] {
    // AbuseIPDB only supports IP addresses (IPv4 and IPv6)
    return [IOCType.IPV4, IOCType.IPV6];
  }

  /**
   * Analyze an IOC using AbuseIPDB
   */
  async analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    console.log(`[AbuseIPDB] Analyzing IOC: ${ioc.value} (${ioc.type})`);

    if (!this.isConfigured()) {
      console.log('[AbuseIPDB] Service not configured - no API key');
      return this.createErrorResult(ioc, 'AbuseIPDB API key not configured');
    }

    if (!this.supports(ioc.type)) {
      console.log(`[AbuseIPDB] Unsupported IOC type: ${ioc.type}`);
      return this.createUnsupportedResult(ioc);
    }

    console.log(`[AbuseIPDB] Starting analysis for ${ioc.type}`);
    try {
      return await this.checkIP(ioc);
    } catch (error) {
      return this.createErrorResult(
        ioc,
        error instanceof Error ? error : 'Unknown error occurred'
      );
    }
  }

  /**
   * Check IP reputation
   * Endpoint: GET /check
   * @param ioc - IP address to check
   */
  private async checkIP(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    // Build query parameters
    const params = new URLSearchParams({
      ipAddress: ioc.value,
      maxAgeInDays: this.maxAgeInDays.toString(),
      verbose: '', // Empty value for verbose=true
    });

    const endpoint = `${this.baseURL}/check?${params.toString()}`;
    console.log(`[AbuseIPDB] API request to: ${endpoint}`);

    const response = await this.fetchWithTimeout(endpoint, {
      method: 'GET',
      headers: {
        'Key': this.config.apiKey!,
        'Accept': 'application/json',
      },
    });

    console.log(`[AbuseIPDB] API response status: ${response.status}`);

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      console.log(`[AbuseIPDB] Rate limit exceeded. Retry after: ${retryAfter}`);
      throw new Error(
        `Rate limit exceeded. ${retryAfter ? `Try again after ${retryAfter} seconds.` : 'Please try again later.'}`
      );
    }

    if (!response.ok) {
      const errorData: AbuseIPDBErrorResponse = await response.json();
      console.log(`[AbuseIPDB] API error:`, errorData);

      const errorMessage = errorData.errors?.[0]?.detail || 'Unknown error';
      throw new Error(`AbuseIPDB API error: ${errorMessage} (${response.status})`);
    }

    const data: AbuseIPDBCheckResponse = await response.json();
    console.log(`[AbuseIPDB] API response received, confidence score: ${data.data.abuseConfidenceScore}`);

    // Calculate statistics
    const stats = this.calculateStats(data);

    return {
      ioc,
      source: this.name,
      status: this.determineStatusFromScore(stats.abuseConfidenceScore, stats.isWhitelisted),
      details: {
        // Core metrics
        abuseConfidenceScore: stats.abuseConfidenceScore,
        totalReports: stats.totalReports,
        numDistinctUsers: stats.numDistinctUsers,

        // IP information
        ipAddress: data.data.ipAddress,
        ipVersion: data.data.ipVersion,
        isPublic: data.data.isPublic,
        isWhitelisted: stats.isWhitelisted,
        isTor: stats.isTor,

        // Geographic & Network info
        countryCode: data.data.countryCode,
        countryName: data.data.countryName,
        usageType: data.data.usageType,
        isp: data.data.isp,
        domain: data.data.domain,
        hostnames: data.data.hostnames,

        // Abuse data
        lastReportedAt: data.data.lastReportedAt,
        categories: stats.categories,
        categoryLabels: stats.categories.map(
          cat => ABUSE_CATEGORY_LABELS[cat as keyof typeof ABUSE_CATEGORY_LABELS] || `Unknown (${cat})`
        ),

        // Recent reports (limited to 10 for display)
        reports: data.data.reports?.slice(0, 10).map(report => ({
          reportedAt: report.reportedAt,
          comment: report.comment,
          categories: report.categories,
          categoryLabels: report.categories.map(
            cat => ABUSE_CATEGORY_LABELS[cat as keyof typeof ABUSE_CATEGORY_LABELS] || `Unknown (${cat})`
          ),
          reporterCountryCode: report.reporterCountryCode,
          reporterCountryName: report.reporterCountryName,
        })),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate statistics from AbuseIPDB response
   */
  private calculateStats(data: AbuseIPDBCheckResponse): AbuseIPDBAnalysisStats {
    const ipData = data.data;

    // Extract unique categories from all reports
    const uniqueCategories = new Set<number>();
    ipData.reports?.forEach(report => {
      report.categories.forEach(cat => uniqueCategories.add(cat));
    });

    return {
      abuseConfidenceScore: ipData.abuseConfidenceScore,
      totalReports: ipData.totalReports,
      numDistinctUsers: ipData.numDistinctUsers,
      isWhitelisted: ipData.isWhitelisted,
      isTor: ipData.isTor,
      categories: Array.from(uniqueCategories),
      recentReports: ipData.reports?.length || 0,
    };
  }

  /**
   * Determine threat status based on abuse confidence score
   *
   * Score Interpretation:
   * - 0-25: Safe (low confidence of abuse)
   * - 26-75: Suspicious (moderate confidence of abuse)
   * - 76-100: Malicious (high confidence of abuse)
   *
   * Whitelisted IPs are always considered safe regardless of score
   */
  private determineStatusFromScore(
    score: number,
    isWhitelisted: boolean
  ): 'safe' | 'suspicious' | 'malicious' | 'unknown' {
    // Whitelisted IPs are always safe
    if (isWhitelisted) {
      return 'safe';
    }

    // Classify based on confidence score
    if (score >= 76) {
      return 'malicious';
    } else if (score >= 26) {
      return 'suspicious';
    } else if (score >= 0) {
      return 'safe';
    }

    return 'unknown';
  }

  /**
   * Batch analyze is not optimized for AbuseIPDB (no bulk endpoint in free tier)
   * Falls back to sequential processing
   */
  async analyzeBatch(iocs: DetectedIOC[]): Promise<IOCAnalysisResult[]> {
    console.log(`[AbuseIPDB] Batch analysis requested for ${iocs.length} IOCs`);
    console.log('[AbuseIPDB] Using sequential processing (no bulk endpoint available)');

    // Use default sequential implementation from BaseToolService
    return super.analyzeBatch(iocs);
  }
}
