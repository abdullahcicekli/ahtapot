/**
 * URLhaus API Response Types
 * Based on https://urlhaus-api.abuse.ch/
 */

/**
 * URL query response
 */
export interface URLhausURLResponse {
  query_status: 'ok' | 'no_results' | 'invalid_url';
  id?: string;
  urlhaus_reference?: string;
  url?: string;
  url_status?: 'online' | 'offline' | 'unknown';
  host?: string;
  date_added?: string;
  threat?: string;
  blacklists?: {
    spamhaus_dbl?: string;
    surbl?: string;
  };
  reporter?: string;
  larted?: string;
  tags?: string[];
  payloads?: Array<{
    firstseen: string;
    filename: string | null;
    file_type: string;
    response_size: number;
    response_md5: string;
    response_sha256: string;
    urlhaus_download: string;
    signature: string | null;
    virustotal?: {
      result: string;
      percent: string;
      link: string;
    };
  }>;
}

/**
 * Host (domain/IP) query response
 */
export interface URLhausHostResponse {
  query_status: 'ok' | 'no_results' | 'invalid_host';
  urlhaus_reference?: string;
  host?: string;
  firstseen?: string;
  url_count?: number;
  blacklists?: {
    spamhaus_dbl?: string;
    surbl?: string;
  };
  urls?: Array<{
    id: string;
    urlhaus_reference: string;
    url: string;
    url_status: 'online' | 'offline' | 'unknown';
    date_added: string;
    threat: string;
    reporter: string;
    larted: string;
    tags: string[];
  }>;
}

/**
 * Hash (payload) query response
 */
export interface URLhausPayloadResponse {
  query_status: 'ok' | 'no_results' | 'invalid_hash';
  md5_hash?: string;
  sha256_hash?: string;
  file_type?: string;
  file_size?: number;
  signature?: string | null;
  firstseen?: string;
  lastseen?: string;
  url_count?: number;
  urlhaus_download?: string;
  virustotal?: {
    result: string;
    percent: string;
    link: string;
  };
  imphash?: string;
  ssdeep?: string;
  tlsh?: string;
  urls?: Array<{
    url_id: string;
    url: string;
    url_status: 'online' | 'offline' | 'unknown';
    urlhaus_reference: string;
    filename: string | null;
    firstseen: string;
    lastseen: string;
  }>;
}

/**
 * Error response
 */
export interface URLhausErrorResponse {
  query_status: 'error';
  error?: string;
}
