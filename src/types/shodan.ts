/**
 * Shodan API Type Definitions
 * Documentation: https://developer.shodan.io/api
 *
 * Shodan is a search engine for Internet-connected devices that provides
 * detailed information about hosts including services, vulnerabilities, and banners.
 */

/**
 * Shodan Host Information
 * Core data from /shodan/host/{ip} endpoint
 */
export interface ShodanHost {
  ip_str: string;
  hostnames: string[];
  country_name?: string;
  country_code?: string;
  city?: string;
  region_code?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  org?: string;
  asn?: string;
  os?: string;
  ports: number[];
  vulns?: string[]; // CVE IDs
  tags?: string[];
  last_update?: string;
  data?: ShodanService[];
}

/**
 * Shodan Service/Banner Information
 * Individual service data from host scan
 */
export interface ShodanService {
  port: number;
  transport: string; // tcp, udp
  product?: string;
  version?: string;
  data?: string; // banner/service info
  timestamp?: string;
  ssl?: {
    cert?: {
      subject?: {
        CN?: string;
      };
      issuer?: {
        CN?: string;
      };
      expires?: string;
    };
  };
}

/**
 * Shodan Domain Information
 * Response from /dns/domain/{hostname} endpoint
 */
export interface ShodanDomain {
  domain: string;
  tags: string[];
  data?: Array<{
    subdomain: string;
    type: string;
    value: string;
    last_seen?: string;
  }>;
  subdomains?: string[];
}

/**
 * Shodan DNS Resolution
 * Response from /dns/resolve endpoint
 */
export interface ShodanDNSResolve {
  [hostname: string]: string; // hostname -> IP mapping
}

/**
 * Shodan Error Response
 */
export interface ShodanErrorResponse {
  error: string;
}

/**
 * Statistics calculated from Shodan response
 */
export interface ShodanAnalysisStats {
  totalPorts: number;
  openPorts: number[];
  totalVulnerabilities: number;
  vulnerabilities: string[];
  services: Array<{
    port: number;
    protocol: string;
    product?: string;
    version?: string;
  }>;
  location?: {
    country: string;
    city?: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  };
  organization?: {
    name?: string;
    isp?: string;
    asn?: string;
  };
  os?: string;
  hostnames: string[];
  lastUpdate?: string;
  tags: string[];
}

/**
 * Shodan Query Credits Information
 */
export interface ShodanAPIInfo {
  query_credits: number;
  scan_credits: number;
  telnet: boolean;
  plan: string;
  https: boolean;
  unlocked: boolean;
}

/**
 * Vulnerability Severity Mapping
 */
export const VULNERABILITY_SEVERITY: Record<string, string> = {
  'CRITICAL': 'Critical',
  'HIGH': 'High',
  'MEDIUM': 'Medium',
  'LOW': 'Low',
};

/**
 * Common Service Names
 */
export const SERVICE_NAMES: Record<number, string> = {
  21: 'FTP',
  22: 'SSH',
  23: 'Telnet',
  25: 'SMTP',
  53: 'DNS',
  80: 'HTTP',
  110: 'POP3',
  143: 'IMAP',
  443: 'HTTPS',
  445: 'SMB',
  3306: 'MySQL',
  3389: 'RDP',
  5432: 'PostgreSQL',
  5900: 'VNC',
  6379: 'Redis',
  8080: 'HTTP-Alt',
  8443: 'HTTPS-Alt',
  27017: 'MongoDB',
};
