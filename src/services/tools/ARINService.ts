import { BaseToolService, ToolServiceConfig } from '../base/BaseToolService';
import { DetectedIOC, IOCAnalysisResult, IOCType } from '@/types/ioc';
import {
  ARINIPResponse,
  ARINErrorResponse,
  ARINAnalysisStats,
} from '@/types/arin';
import { CacheManager } from '@/utils/cacheManager';

/**
 * ARIN WHOIS RWS Service
 * Integrates with ARIN's WHOIS RESTful Web Service for IP address lookup
 * Documentation: https://www.arin.net/resources/registry/whois/rws/
 *
 * Key Features:
 * - No API key required (public read-only access)
 * - Supports IPv4 and IPv6 addresses
 * - Provides network registration information
 * - Conservative rate limiting (15 requests/minute)
 * - Aggressive caching to minimize requests
 */
export class ARINService extends BaseToolService {
  private readonly baseURL = 'https://whois.arin.net/rest';
  private readonly rateLimit = {
    maxRequests: 15,
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
    return 'ARIN';
  }

  get supportedIOCTypes(): IOCType[] {
    // ARIN WHOIS supports IP addresses only (IPv4 and IPv6)
    return [IOCType.IPV4, IOCType.IPV6];
  }

  /**
   * ARIN requires no API key - always configured
   * Override base implementation
   */
  isConfigured(): boolean {
    return true;
  }

  /**
   * Analyze an IOC using ARIN WHOIS
   */
  async analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    console.log(`[ARIN] Analyzing IOC: ${ioc.value} (${ioc.type})`);

    if (!this.supports(ioc.type)) {
      console.log(`[ARIN] Unsupported IOC type: ${ioc.type}`);
      return this.createUnsupportedResult(ioc);
    }

    // Check cache first
    const cachedResult = await CacheManager.getResult(
      this.name,
      ioc.type,
      ioc.value
    );
    if (cachedResult) {
      console.log(`[ARIN] Using cached result for ${ioc.value}`);
      return cachedResult;
    }

    console.log(`[ARIN] Starting WHOIS lookup for ${ioc.type}`);
    try {
      const result = await this.lookupIP(ioc);

      // Cache the result
      await CacheManager.storeResult(result);

      return result;
    } catch (error) {
      return this.createErrorResult(
        ioc,
        error instanceof Error ? error : 'Unknown error occurred'
      );
    }
  }

  /**
   * Lookup IP address in ARIN WHOIS
   * Endpoint: GET /ip/{ipAddress}
   */
  private async lookupIP(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    // Apply rate limiting
    await this.waitForRateLimit();

    const endpoint = `${this.baseURL}/ip/${ioc.value}`;
    console.log(`[ARIN] WHOIS request to: ${endpoint}`);

    const response = await this.fetchWithTimeout(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`[ARIN] WHOIS response status: ${response.status}`);

    // Handle 404 - IP not in ARIN database
    if (response.status === 404) {
      console.log(`[ARIN] IP not found in ARIN database: ${ioc.value}`);
      return {
        ioc,
        source: this.name,
        status: 'unknown',
        details: {
          message: 'This IP address is not registered in the ARIN database',
          note: 'This IP may be managed by a different Regional Internet Registry (RIPE, APNIC, LACNIC, or AFRINIC)',
        },
        timestamp: Date.now(),
      };
    }

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      console.log(`[ARIN] Rate limit exceeded. Retry after: ${retryAfter}`);
      throw new Error(
        `Rate limit exceeded. ${retryAfter ? `Try again after ${retryAfter} seconds.` : 'Please try again later.'}`
      );
    }

    // Handle other errors
    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData: ARINErrorResponse = await response.json();
        errorMessage = errorData.message?.text || errorMessage;
        console.log(`[ARIN] API error:`, errorData);
      } catch {
        // If error parsing fails, use status text
        errorMessage = response.statusText;
      }
      throw new Error(`ARIN WHOIS error: ${errorMessage} (${response.status})`);
    }

    const rawData = await response.json();
    console.log(`[ARIN] Raw WHOIS response received:`, rawData);

    // Parse ARIN's JSON format (values are in { "$": "value" } format)
    const data = this.parseARINResponse(rawData);
    console.log(`[ARIN] Parsed WHOIS data for network: ${data.net.name}`);

    // Calculate statistics
    const stats = this.calculateStats(data);

    return {
      ioc,
      source: this.name,
      status: 'unknown', // ARIN doesn't provide reputation data, only registration info
      details: {
        // Network Information
        networkHandle: data.net.handle,
        networkName: data.net.name,
        startAddress: data.net.startAddress,
        endAddress: data.net.endAddress,
        cidrLength: data.net.cidrLength,
        cidr: stats.cidr,
        networkRange: stats.networkRange,
        ipVersion: stats.ipVersion,

        // Registration Dates
        registrationDate: data.net.registrationDate,
        updateDate: data.net.updateDate,

        // Organization Information
        organizationHandle: data.orgRef?.handle || data.customerRef?.handle,
        organizationName: data.orgRef?.name || data.customerRef?.name,
        hasCustomerRef: stats.hasCustomerRef,

        // Parent Network
        parentNetHandle: data.parentNetRef?.handle,
        parentNetName: data.parentNetRef?.name,
        hasParentNet: stats.hasParentNet,

        // Comments (if any)
        comments: data.net.comment,

        // Net Blocks (detailed allocation info)
        netBlocks: data.netBlocks?.map(nb => ({
          startAddress: nb.netBlock.startAddress,
          endAddress: nb.netBlock.endAddress,
          cidrLength: nb.netBlock.cidrLength,
          type: nb.netBlock.type,
        })),

        // Analysis Summary
        summary: this.generateSummary(stats),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate statistics from ARIN response
   */
  private calculateStats(data: ARINIPResponse): ARINAnalysisStats {
    const ipVersion = data.net.version === '6' ? 6 : 4;

    // Generate CIDR notation
    const cidr = `${data.net.startAddress}/${data.net.cidrLength}`;

    // Generate network range
    const networkRange = data.net.startAddress === data.net.endAddress
      ? data.net.startAddress
      : `${data.net.startAddress} - ${data.net.endAddress}`;

    return {
      networkName: data.net.name,
      networkRange,
      cidr,
      ipVersion,
      organizationName: data.orgRef?.name || data.customerRef?.name,
      organizationType: undefined, // Would need separate org lookup
      country: undefined, // Would need separate org lookup
      registrationDate: data.net.registrationDate,
      lastUpdateDate: data.net.updateDate,
      hasCustomerRef: !!data.customerRef,
      hasParentNet: !!data.parentNetRef,
    };
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(stats: ARINAnalysisStats): string {
    const parts: string[] = [];

    parts.push(`Network: ${stats.networkName}`);
    parts.push(`Range: ${stats.networkRange}`);
    parts.push(`IPv${stats.ipVersion}`);

    if (stats.organizationName) {
      parts.push(`Organization: ${stats.organizationName}`);
    }

    if (stats.registrationDate) {
      const regDate = new Date(stats.registrationDate);
      parts.push(`Registered: ${regDate.toLocaleDateString()}`);
    }

    return parts.join(' | ');
  }

  /**
   * Rate limiting implementation
   * Ensures we don't exceed 15 requests per minute
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
        console.log(`[ARIN] Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Record this request
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Parse ARIN's JSON response format
   * ARIN returns values in { "$": "value" } format, this converts to simple strings
   */
  private parseARINResponse(rawData: any): ARINIPResponse {
    return {
      net: {
        handle: this.extractValue(rawData.net?.handle),
        name: this.extractValue(rawData.net?.name),
        startAddress: this.extractValue(rawData.net?.startAddress),
        endAddress: this.extractValue(rawData.net?.endAddress),
        cidrLength: parseInt(this.extractValue(rawData.net?.netBlocks?.netBlock?.cidrLength) || '0'),
        version: this.extractValue(rawData.net?.version),
        registrationDate: this.extractValue(rawData.net?.registrationDate),
        updateDate: this.extractValue(rawData.net?.updateDate),
        comment: this.extractComments(rawData.net?.comment),
        netBlocks: this.extractNetBlocks(rawData.net?.netBlocks),
      },
      orgRef: rawData.net?.orgRef ? {
        handle: this.extractAttribute(rawData.net.orgRef, '@handle'),
        name: this.extractAttribute(rawData.net.orgRef, '@name'),
      } : undefined,
      customerRef: rawData.net?.customerRef ? {
        handle: this.extractAttribute(rawData.net.customerRef, '@handle'),
        name: this.extractAttribute(rawData.net.customerRef, '@name'),
      } : undefined,
      parentNetRef: rawData.net?.parentNetRef ? {
        handle: this.extractAttribute(rawData.net.parentNetRef, '@handle'),
        name: this.extractAttribute(rawData.net.parentNetRef, '@name'),
      } : undefined,
      netBlocks: this.extractNetBlocks(rawData.net?.netBlocks),
    };
  }

  /**
   * Extract value from ARIN's { "$": "value" } format
   */
  private extractValue(obj: any): string {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object' && obj.$) return obj.$;
    return '';
  }

  /**
   * Extract attribute from ARIN's { "@attribute": "value" } format
   */
  private extractAttribute(obj: any, attr: string): string {
    if (!obj) return '';
    if (obj[attr]) return obj[attr];
    return '';
  }

  /**
   * Extract comments from ARIN response
   */
  private extractComments(comment: any): string[] | undefined {
    if (!comment) return undefined;

    // Single line comment
    if (comment.line) {
      const lineValue = this.extractValue(comment.line);
      return lineValue ? [lineValue] : undefined;
    }

    // Multiple line comments
    if (Array.isArray(comment)) {
      return comment
        .map(c => this.extractValue(c.line || c))
        .filter(Boolean);
    }

    return undefined;
  }

  /**
   * Extract net blocks from ARIN response
   */
  private extractNetBlocks(netBlocks: any): any[] | undefined {
    if (!netBlocks) return undefined;

    const blocks = [];

    // Single netBlock
    if (netBlocks.netBlock) {
      const nb = netBlocks.netBlock;
      blocks.push({
        netBlock: {
          startAddress: this.extractValue(nb.startAddress),
          endAddress: this.extractValue(nb.endAddress),
          cidrLength: parseInt(this.extractValue(nb.cidrLength) || '0'),
          type: this.extractValue(nb.type),
        }
      });
    }

    // Multiple netBlocks (array)
    if (Array.isArray(netBlocks)) {
      netBlocks.forEach(nb => {
        if (nb.netBlock) {
          blocks.push({
            netBlock: {
              startAddress: this.extractValue(nb.netBlock.startAddress),
              endAddress: this.extractValue(nb.netBlock.endAddress),
              cidrLength: parseInt(this.extractValue(nb.netBlock.cidrLength) || '0'),
              type: this.extractValue(nb.netBlock.type),
            }
          });
        }
      });
    }

    return blocks.length > 0 ? blocks : undefined;
  }

  /**
   * Batch analyze is not optimized for ARIN (no bulk endpoint)
   * Falls back to sequential processing with rate limiting
   */
  async analyzeBatch(iocs: DetectedIOC[]): Promise<IOCAnalysisResult[]> {
    console.log(`[ARIN] Batch analysis requested for ${iocs.length} IOCs`);
    console.log('[ARIN] Using sequential processing with rate limiting');

    // Use default sequential implementation from BaseToolService
    // Rate limiting is handled in waitForRateLimit() for each request
    return super.analyzeBatch(iocs);
  }
}
