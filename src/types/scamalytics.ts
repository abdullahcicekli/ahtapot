/**
 * Scamalytics API Response Types
 * Based on Scamalytics IP Fraud Risk API v3
 * Documentation: https://scamalytics.com/docs/Scamalytics_Implementation_Guide_IP_Fraud_Risk_API_v3.1.3.pdf
 */

/**
 * Proxy detection information
 */
export interface ScamalyticsProxyInfo {
  is_datacenter?: boolean;
  is_vpn?: boolean;
  is_apple_icloud_private_relay?: boolean;
  is_amazon_aws?: boolean;
  is_google?: boolean;
  is_tor?: boolean;
}

/**
 * Credits/usage information
 */
export interface ScamalyticsCredits {
  used?: number;
  remaining?: number;
  last_sync_timestamp_utc?: string;
  seconds_elapsed_since_last_sync?: number;
  note?: string;
}

/**
 * Main Scamalytics data object
 */
export interface ScamalyticsData {
  status: 'ok' | 'error';
  mode?: 'live' | 'test';
  ip?: string;
  scamalytics_score?: number; // 0-100, higher = more risky
  scamalytics_risk?: 'very high' | 'high' | 'medium' | 'low' | 'very low';
  scamalytics_url?: string;
  scamalytics_isp_score?: number;
  scamalytics_isp_risk?: string;
  scamalytics_proxy?: ScamalyticsProxyInfo;
  is_blacklisted_external?: boolean;
  credits?: ScamalyticsCredits;
  exec?: string;
  error?: string;
}

/**
 * External datasource info (IP2Proxy, MaxMind, etc.)
 */
export interface ExternalDatasource {
  asn?: string;
  as_name?: string;
  ip_country_code?: string;
  ip_country_name?: string;
  ip_city?: string;
  ip_state_name?: string;
  isp_name?: string;
  domain?: string;
  datasource_name?: string;
  license_info?: string;
  [key: string]: any; // Allow additional fields
}

/**
 * Full API response
 */
export interface ScamalyticsResponse {
  scamalytics: ScamalyticsData;
  external_datasources?: {
    ip2proxy_lite?: ExternalDatasource;
    maxmind_geolite2?: ExternalDatasource;
    ipinfo?: ExternalDatasource;
    firehol?: ExternalDatasource & {
      ip_blacklisted_30?: boolean;
      ip_blacklisted_1day?: boolean;
      is_proxy?: boolean;
    };
    ipsum?: ExternalDatasource & {
      ip_blacklisted?: boolean;
      num_blacklists?: number;
    };
    spamhaus_drop?: ExternalDatasource & {
      ip_blacklisted?: boolean;
    };
    x4bnet?: ExternalDatasource & {
      is_vpn?: boolean;
      is_datacenter?: boolean;
      is_tor?: boolean;
      is_blacklisted_spambot?: boolean;
    };
    google?: ExternalDatasource & {
      is_google_general?: boolean;
      is_googlebot?: boolean;
    };
  };
}

/**
 * Error response
 */
export interface ScamalyticsErrorResponse {
  scamalytics?: {
    status: 'error';
    error?: string;
  };
  error?: string;
  message?: string;
}
