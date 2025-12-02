import { APIProvider } from '@/types/ioc';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate API keys by making test requests
 */
export class APIKeyValidator {
  private static readonly TEST_ENDPOINTS: Partial<Record<APIProvider, {
    url: string;
    header: string;
    method?: string;
    testHash?: string;
    authType?: 'header' | 'query' | 'basic';
  }>> = {
    [APIProvider.VIRUSTOTAL]: {
      url: 'https://www.virustotal.com/api/v3/ip_addresses/8.8.8.8',
      header: 'x-apikey',
    },
    [APIProvider.OTX]: {
      url: 'https://otx.alienvault.com/api/v1/indicators/IPv4/8.8.8.8/general',
      header: 'X-OTX-API-KEY',
    },
    [APIProvider.ABUSEIPDB]: {
      url: 'https://api.abuseipdb.com/api/v2/check?ipAddress=8.8.8.8',
      header: 'Key',
    },
    [APIProvider.MALWAREBAZAAR]: {
      url: 'https://mb-api.abuse.ch/api/v1/',
      header: 'Auth-Key',
      method: 'POST',
      testHash: '275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f', // Known malware SHA256
    },
    [APIProvider.SHODAN]: {
      url: 'https://api.shodan.io/api-info',
      header: 'key',
    },
    [APIProvider.GREYNOISE]: {
      url: 'https://api.greynoise.io/v3/community/8.8.8.8',
      header: 'key',
    },
    [APIProvider.URLHAUS]: {
      url: 'https://urlhaus-api.abuse.ch/v1/url/',
      header: 'Auth-Key',
      method: 'POST',
    },
    [APIProvider.PULSEDIVE]: {
      url: 'https://pulsedive.com/api/info.php?indicator=8.8.8.8',
      header: 'key',
      authType: 'query',
    },
    [APIProvider.SCAMALYTICS]: {
      url: 'https://api11.scamalytics.com/ip/8.8.8.8',
      header: 'Authorization',
    },
    // ARIN doesn't need validation - no API key required
  };

  /**
   * Validate an API key for a specific provider
   */
  static async validate(
    provider: APIProvider,
    apiKey: string
  ): Promise<ValidationResult> {
    if (!apiKey || apiKey.trim().length === 0) {
      return {
        isValid: false,
        error: 'API key is empty',
      };
    }

    const endpoint = this.TEST_ENDPOINTS[provider];
    if (!endpoint) {
      return {
        isValid: false,
        error: 'Unsupported provider',
      };
    }

    try {
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };

      // Handle different authentication types
      let url = endpoint.url;
      const authType = (endpoint as any).authType || 'header';

      if (authType === 'query' || provider === APIProvider.SHODAN) {
        // Query parameter authentication (Shodan, Pulsedive)
        url = `${endpoint.url}&key=${apiKey}`;
      } else if (provider === APIProvider.SCAMALYTICS) {
        // Bearer token authentication
        headers[endpoint.header] = `Bearer ${apiKey}`;
      } else if (endpoint.header) {
        // Standard header authentication
        headers[endpoint.header] = apiKey;
      }

      // Prepare request options based on provider
      let requestOptions: RequestInit = {
        method: (endpoint as any).method || 'GET',
        headers,
      };

      // Special handling for MalwareBazaar (requires POST with FormData)
      if (provider === APIProvider.MALWAREBAZAAR) {
        const formData = new FormData();
        formData.append('query', 'get_info');
        formData.append('hash', (endpoint as any).testHash);
        requestOptions.body = formData;
        // Remove Content-Type header to let browser set it with boundary
        delete (headers as any)['Content-Type'];
      }

      // Special handling for URLhaus (requires POST with FormData)
      if (provider === APIProvider.URLHAUS) {
        const formData = new FormData();
        formData.append('url', 'http://example.com/test');
        requestOptions.body = formData;
        delete (headers as any)['Content-Type'];
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if the API key is valid based on response status
      if (response.ok) {
        return { isValid: true };
      }

      // Handle specific error codes
      if (response.status === 401 || response.status === 403) {
        return {
          isValid: false,
          error: 'Invalid API key',
        };
      }

      if (response.status === 429) {
        return {
          isValid: false,
          error: 'Rate limit exceeded',
        };
      }

      if (response.status === 404) {
        // For GreyNoise, 404 means "IP not found in database" which is a valid response
        // For other providers, 404 means the endpoint doesn't exist
        if (provider === APIProvider.GREYNOISE) {
          return { isValid: true };
        }
        return {
          isValid: false,
          error: 'API endpoint not found',
        };
      }

      return {
        isValid: false,
        error: `Unexpected response: ${response.status}`,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            isValid: false,
            error: 'Request timeout',
          };
        }
        return {
          isValid: false,
          error: error.message,
        };
      }
      return {
        isValid: false,
        error: 'Unknown error occurred',
      };
    }
  }
}
