import { APIProvider } from '@/types/ioc';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate API keys by making test requests
 */
export class APIKeyValidator {
  private static readonly TEST_ENDPOINTS = {
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

      // Add API key to headers or URL based on provider
      if (endpoint.header) {
        headers[endpoint.header] = apiKey;
      }

      const url = endpoint.header
        ? endpoint.url
        : `${endpoint.url}${apiKey}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        headers,
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
