import { BaseToolService, ToolServiceConfig } from '../base/BaseToolService';
import { DetectedIOC, IOCAnalysisResult, IOCType } from '@/types/ioc';
import {
  URLhausURLResponse,
  URLhausHostResponse,
  URLhausPayloadResponse,
  URLhausErrorResponse,
} from '@/types/urlhaus';

/**
 * URLhaus Service
 * Integrates with URLhaus API from abuse.ch
 * Documentation: https://urlhaus-api.abuse.ch/
 */
export class URLhausService extends BaseToolService {
  private readonly baseURL = 'https://urlhaus-api.abuse.ch/v1';

  constructor(config: ToolServiceConfig) {
    super(config);
  }

  get name(): string {
    return 'URLhaus';
  }

  get supportedIOCTypes(): IOCType[] {
    return [
      IOCType.URL,
      IOCType.DOMAIN,
      IOCType.IPV4,
      IOCType.IPV6,
      IOCType.MD5,
      IOCType.SHA256,
    ];
  }

  /**
   * Analyze an IOC using URLhaus
   */
  async analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    console.log(`[URLhaus] Analyzing IOC: ${ioc.value} (${ioc.type})`);

    if (!this.isConfigured()) {
      console.log('[URLhaus] Service not configured - no API key');
      return this.createErrorResult(ioc, 'URLhaus API key not configured');
    }

    if (!this.supports(ioc.type)) {
      console.log(`[URLhaus] Unsupported IOC type: ${ioc.type}`);
      return this.createUnsupportedResult(ioc);
    }

    console.log(`[URLhaus] Starting analysis for ${ioc.type}`);
    try {
      switch (ioc.type) {
        case IOCType.URL:
          return await this.analyzeURL(ioc);
        case IOCType.DOMAIN:
        case IOCType.IPV4:
        case IOCType.IPV6:
          return await this.analyzeHost(ioc);
        case IOCType.MD5:
        case IOCType.SHA256:
          return await this.analyzePayload(ioc);
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
   * Analyze URL
   * Endpoint: POST /url
   */
  private async analyzeURL(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const endpoint = `${this.baseURL}/url/`;
    console.log(`[URLhaus] API request to: ${endpoint}`);

    const formData = new FormData();
    formData.append('url', ioc.value);

    const response = await this.fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Auth-Key': this.config.apiKey!,
      },
      body: formData,
    });

    console.log(`[URLhaus] API response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`URLhaus API error: ${response.status}`);
    }

    const data: URLhausURLResponse | URLhausErrorResponse = await response.json();

    if ('query_status' in data && data.query_status === 'no_results') {
      return {
        ioc,
        source: this.name,
        status: 'safe',
        details: {
          message: 'URL not found in URLhaus database',
        },
        timestamp: Date.now(),
      };
    }

    if ('query_status' in data && data.query_status === 'ok') {
      const urlData = data as URLhausURLResponse;
      const isMalicious = urlData.url_status === 'online';
      const isSuspicious = urlData.url_status === 'offline' || urlData.threat !== undefined;

      return {
        ioc,
        source: this.name,
        status: isMalicious ? 'malicious' : isSuspicious ? 'suspicious' : 'safe',
        details: {
          id: urlData.id,
          urlhaus_reference: urlData.urlhaus_reference,
          url_status: urlData.url_status,
          host: urlData.host,
          date_added: urlData.date_added,
          threat: urlData.threat,
          blacklists: urlData.blacklists,
          reporter: urlData.reporter,
          tags: urlData.tags || [],
          payloads: urlData.payloads || [],
        },
        timestamp: Date.now(),
      };
    }

    throw new Error('Invalid response from URLhaus API');
  }

  /**
   * Analyze Host (domain/IP)
   * Endpoint: POST /host
   */
  private async analyzeHost(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const endpoint = `${this.baseURL}/host/`;

    const formData = new FormData();
    formData.append('host', ioc.value);

    const response = await this.fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Auth-Key': this.config.apiKey!,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`URLhaus API error: ${response.status}`);
    }

    const data: URLhausHostResponse | URLhausErrorResponse = await response.json();

    if ('query_status' in data && data.query_status === 'no_results') {
      return {
        ioc,
        source: this.name,
        status: 'safe',
        details: {
          message: 'Host not found in URLhaus database',
        },
        timestamp: Date.now(),
      };
    }

    if ('query_status' in data && data.query_status === 'ok') {
      const hostData = data as URLhausHostResponse;
      const onlineCount = hostData.urls?.filter(u => u.url_status === 'online').length || 0;
      const isMalicious = onlineCount > 0;
      const isSuspicious = (hostData.url_count || 0) > 0;

      return {
        ioc,
        source: this.name,
        status: isMalicious ? 'malicious' : isSuspicious ? 'suspicious' : 'safe',
        details: {
          urlhaus_reference: hostData.urlhaus_reference,
          host: hostData.host,
          firstseen: hostData.firstseen,
          url_count: hostData.url_count,
          online_count: onlineCount,
          blacklists: hostData.blacklists,
          urls: hostData.urls || [],
        },
        timestamp: Date.now(),
      };
    }

    throw new Error('Invalid response from URLhaus API');
  }

  /**
   * Analyze Payload (hash)
   * Endpoint: POST /payload
   */
  private async analyzePayload(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const endpoint = `${this.baseURL}/payload/`;

    const formData = new FormData();
    const hashType = ioc.type === IOCType.MD5 ? 'md5_hash' : 'sha256_hash';
    formData.append(hashType, ioc.value);

    const response = await this.fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Auth-Key': this.config.apiKey!,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`URLhaus API error: ${response.status}`);
    }

    const data: URLhausPayloadResponse | URLhausErrorResponse = await response.json();

    if ('query_status' in data && data.query_status === 'no_results') {
      return {
        ioc,
        source: this.name,
        status: 'safe',
        details: {
          message: 'Payload not found in URLhaus database',
        },
        timestamp: Date.now(),
      };
    }

    if ('query_status' in data && data.query_status === 'ok') {
      const payloadData = data as URLhausPayloadResponse;
      const onlineCount = payloadData.urls?.filter(u => u.url_status === 'online').length || 0;
      const isMalicious = onlineCount > 0 || payloadData.signature !== null;

      return {
        ioc,
        source: this.name,
        status: isMalicious ? 'malicious' : 'suspicious',
        details: {
          md5_hash: payloadData.md5_hash,
          sha256_hash: payloadData.sha256_hash,
          file_type: payloadData.file_type,
          file_size: payloadData.file_size,
          signature: payloadData.signature,
          firstseen: payloadData.firstseen,
          lastseen: payloadData.lastseen,
          url_count: payloadData.url_count,
          online_count: onlineCount,
          virustotal: payloadData.virustotal,
          urlhaus_download: payloadData.urlhaus_download,
          urls: payloadData.urls || [],
        },
        timestamp: Date.now(),
      };
    }

    throw new Error('Invalid response from URLhaus API');
  }
}
