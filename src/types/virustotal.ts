/**
 * VirusTotal API Response Types
 * Based on https://docs.virustotal.com/reference/overview
 */

/**
 * Common analysis stats structure across different resources
 */
export interface AnalysisStats {
  malicious: number;
  suspicious: number;
  undetected: number;
  harmless: number;
  timeout: number;
}

/**
 * Individual engine result
 */
export interface EngineResult {
  method: string;
  engine_name: string;
  category: 'harmless' | 'malicious' | 'suspicious' | 'undetected';
  result: string;
}

/**
 * Voting information
 */
export interface TotalVotes {
  harmless: number;
  malicious: number;
}

/**
 * RDAP (Registration Data Access Protocol) information
 */
export interface RDAPInfo {
  object_class_name: string;
  handle: string;
  start_address?: string;
  end_address?: string;
  ip_version?: string;
  name: string;
  type?: string;
  parent_handle?: string;
  status?: string[];
  links?: Array<{
    href: string;
    rel: string;
    type: string;
  }>;
  notices?: Array<{
    title: string;
    description: string[];
  }>;
  events?: Array<{
    event_action: string;
    event_date: string;
  }>;
  entities?: any[];
  country?: string;
}

/**
 * IP Address specific attributes
 */
export interface IPAddressAttributes {
  country: string;
  as_owner: string;
  asn: number;
  continent: string;
  network: string;
  regional_internet_registry: string;
  last_analysis_stats: AnalysisStats;
  last_analysis_results: Record<string, EngineResult>;
  last_analysis_date: number;
  last_modification_date: number;
  reputation: number;
  total_votes: TotalVotes;
  whois?: string;
  whois_date?: number;
  rdap?: RDAPInfo;
  tags?: string[];
}

/**
 * Domain specific attributes
 */
export interface DomainAttributes {
  last_analysis_stats: AnalysisStats;
  last_analysis_results: Record<string, EngineResult>;
  last_analysis_date: number;
  last_modification_date: number;
  last_dns_records?: Array<{
    type: string;
    value: string;
    ttl?: number;
  }>;
  reputation: number;
  total_votes: TotalVotes;
  whois?: string;
  whois_date?: number;
  registrar?: string;
  creation_date?: number;
  tags?: string[];
  categories?: Record<string, string>;
}

/**
 * URL specific attributes
 */
export interface URLAttributes {
  last_analysis_stats: AnalysisStats;
  last_analysis_results: Record<string, EngineResult>;
  last_analysis_date: number;
  last_final_url?: string;
  last_http_response_code?: number;
  last_http_response_content_length?: number;
  last_http_response_content_sha256?: string;
  last_modification_date: number;
  reputation: number;
  total_votes: TotalVotes;
  title?: string;
  tags?: string[];
  categories?: Record<string, string>;
}

/**
 * File specific attributes
 */
export interface FileAttributes {
  last_analysis_stats: AnalysisStats;
  last_analysis_results: Record<string, EngineResult>;
  last_analysis_date: number;
  last_modification_date: number;
  size: number;
  type_description: string;
  type_tag: string;
  md5: string;
  sha1: string;
  sha256: string;
  ssdeep?: string;
  meaningful_name?: string;
  reputation: number;
  total_votes: TotalVotes;
  tags?: string[];
  names?: string[];
}

/**
 * Generic VirusTotal resource data structure
 */
export interface VTResourceData<T> {
  id: string;
  type: string;
  links: {
    self: string;
  };
  attributes: T;
}

/**
 * VirusTotal API Response structure
 */
export interface VTResponse<T> {
  data: VTResourceData<T>;
}

/**
 * Specific response types for different resources
 */
export type VTIPAddressResponse = VTResponse<IPAddressAttributes>;
export type VTDomainResponse = VTResponse<DomainAttributes>;
export type VTURLResponse = VTResponse<URLAttributes>;
export type VTFileResponse = VTResponse<FileAttributes>;

/**
 * Error response from VirusTotal API
 */
export interface VTErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

/**
 * Rate limit information
 */
export interface VTRateLimitInfo {
  hourly: {
    limit: number;
    used: number;
    remaining: number;
  };
  daily: {
    limit: number;
    used: number;
    remaining: number;
  };
  monthly: {
    limit: number;
    used: number;
    remaining: number;
  };
}
