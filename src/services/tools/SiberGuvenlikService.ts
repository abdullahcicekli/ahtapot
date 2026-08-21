import { BaseToolService, ToolServiceConfig } from '../base/BaseToolService';
import { DetectedIOC, IOCAnalysisResult, IOCType } from '@/types/ioc';
import { SGBRecord, SGBResponse, SGBEntry } from '@/types/siberguvenlik';
import { CacheManager } from '@/utils/cacheManager';

/**
 * Turkiye SGB (Siber Güvenlik Başkanlığı / TR-CERT) Service
 * National malicious-link feed by the Turkish Cybersecurity Directorate.
 * Documentation: https://siberguvenlik.gov.tr/api/
 *
 * Key Features:
 * - No API key required (public feed)
 * - Domains, URLs, IPv4 and IPv6 addresses
 * - Phishing / malware categorization with criticality scoring (1-10)
 * - The API does substring matching server-side, so exact matches are
 *   separated from related hits before building the verdict.
 */

const CATEGORY_MAP: Record<string, string> = {
  PH: 'Phishing',
  BP: 'Financial Phishing',
  MD: 'Malware Distribution Domain',
  MI: 'Malware Distribution IP',
  MU: 'Malware Distribution URL',
  MC: 'Malware Command Center',
  CA: 'Cyber Attack',
};

const CATEGORY_DESC_MAP: Record<string, string> = {
  PH: 'Malicious domains, IP addresses or URLs used in social engineering attacks outside the financial sector.',
  BP: 'Malicious domains, IP addresses or URLs used in social engineering attacks targeting the financial sector.',
  MD: 'Domains from which malware, in part or in full, is downloaded.',
  MI: 'IP addresses from which malware, in part or in full, is downloaded.',
  MU: 'URLs from which malware, in part or in full, is downloaded.',
  MC: 'Domains, IP addresses or URLs used as command and control centers for malicious operations.',
  CA: 'Domains, IP addresses or URLs that regularly perform malicious activity (port scanning, brute force etc.).',
};

const CONNECTION_MAP: Record<string, string> = {
  AC: 'APT C&C',
  BC: 'Botnet C&C',
  EK: 'Exploit Kit',
  MC: 'Mobile C&C',
  MF: 'Malware Download',
  MM: 'Mining Malware',
  OT: 'Other',
  PH: 'Phishing',
};

const SOURCE_MAP: Record<string, string> = {
  US: 'USOM / TR-CERT',
  SO: 'SOME / CERT',
  RS: 'RSA',
  IH: 'Reporting',
  SB: 'SGB',
};

const DETAIL_BASE_URL = 'https://siberguvenlik.gov.tr/zararli-baglantilar/detay/';

export class SiberGuvenlikService extends BaseToolService {
  private readonly baseURL = 'https://siberguvenlik.gov.tr/api/address/index';

  constructor(config: ToolServiceConfig = {}) {
    super({
      ...config,
      timeout: 30000,
    });
  }

  get name(): string {
    return 'Turkiye SGB';
  }

  get supportedIOCTypes(): IOCType[] {
    return [IOCType.DOMAIN, IOCType.URL, IOCType.IPV4, IOCType.IPV6];
  }

  /** Public feed - no API key required */
  isConfigured(): boolean {
    return true;
  }

  async analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    if (!this.supports(ioc.type)) {
      return this.createUnsupportedResult(ioc);
    }

    const cachedResult = await CacheManager.getResult(this.name, ioc.type, ioc.value);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const result = await this.lookup(ioc);
      await CacheManager.storeResult(result);
      return result;
    } catch (error) {
      return this.createErrorResult(
        ioc,
        error instanceof Error ? error : 'Unknown error occurred'
      );
    }
  }

  private queryType(iocType: IOCType): string {
    switch (iocType) {
      case IOCType.DOMAIN:
        return 'domain';
      case IOCType.IPV4:
        return 'ip';
      case IOCType.IPV6:
        return 'ip6';
      default:
        return 'url';
    }
  }

  /** Normalize for exact-match comparison: lowercase, strip scheme + trailing slash */
  private normalize(value: string): string {
    let v = value.trim().toLowerCase();
    v = v.replace(/^https?:\/\//, '');
    if (v.endsWith('/')) v = v.slice(0, -1);
    return v;
  }

  private mapRecord(record: SGBRecord): SGBEntry {
    return {
      id: record.id,
      value: record.url,
      recordType: record.type,
      category: CATEGORY_MAP[record.desc] || record.desc,
      categoryDesc: CATEGORY_DESC_MAP[record.desc],
      connection: record.connectiontype
        ? CONNECTION_MAP[record.connectiontype] || record.connectiontype
        : undefined,
      source: record.source ? SOURCE_MAP[record.source] || record.source : undefined,
      date: record.date ? record.date.slice(0, 10).split('-').reverse().join('.') : undefined,
      criticality: record.criticality_level,
      detailUrl: record.id ? `${DETAIL_BASE_URL}${record.id}` : undefined,
    };
  }

  private async lookup(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const query = ioc.value.replace(/^https?:\/\//, '');
    const endpoint = `${this.baseURL}?type=${this.queryType(ioc.type)}&q=${encodeURIComponent(query)}`;

    const response = await this.fetchWithTimeout(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Turkiye SGB API error: ${response.status}`);
    }

    const data: SGBResponse = await response.json();
    const records = Array.isArray(data.models) ? data.models : [];
    const mapped = records.map((record) => this.mapRecord(record));

    const target = this.normalize(ioc.value);
    const exact = mapped.filter((entry) => this.normalize(entry.value) === target);
    const related = mapped.filter((entry) => this.normalize(entry.value) !== target);
    const match = exact[0] || null;

    return {
      ioc,
      source: this.name,
      status: match ? 'malicious' : 'safe',
      details: {
        listed: Boolean(match),
        match,
        relatedCount: related.length,
        related: related.slice(0, 5),
        lookupUrl: match?.detailUrl,
      },
      timestamp: Date.now(),
    };
  }
}
