/**
 * GreyNoise API Type Definitions
 * Documentation: https://docs.greynoise.io/
 *
 * GreyNoise collects, analyzes and labels data on IPs that scan the internet
 * and saturate security tools with noise. This helps distinguish between
 * benign internet noise and real threats.
 */

/**
 * GreyNoise IP Context Response
 * Returned by the Community API endpoint: /v3/community/{ip}
 */
export interface GreyNoiseIPContext {
  /** The IP address queried */
  ip: string;

  /** Whether GreyNoise has seen this IP scanning the internet */
  seen: boolean;

  /** Classification of the IP's behavior */
  classification: 'benign' | 'malicious' | 'unknown';

  /** When GreyNoise first observed this IP */
  first_seen?: string;

  /** When GreyNoise last observed this IP */
  last_seen?: string;

  /** Actor name associated with this IP (if identified) */
  actor?: string;

  /** Tags describing the IP's behavior (e.g., "Masscan Scanner", "Mirai Botnet") */
  tags?: string[];

  /** Metadata about the IP's network and location */
  metadata?: {
    /** Country name */
    country?: string;

    /** ISO country code */
    country_code?: string;

    /** City name */
    city?: string;

    /** Organization/ISP name */
    organization?: string;

    /** Reverse DNS hostname */
    rdns?: string;

    /** Autonomous System Number */
    asn?: string;

    /** Whether this IP is a TOR exit node */
    tor?: boolean;

    /** Whether this IP is part of a VPN service */
    vpn?: boolean;

    /** Whether this IP is a proxy */
    proxy?: boolean;
  };

  /** Raw scan data (if available) */
  raw_data?: {
    scan?: Array<{
      port: number;
      protocol: string;
    }>;
    web?: {
      paths?: string[];
      useragents?: string[];
    };
  };

  /** VPN flag (deprecated, use metadata.vpn) */
  vpn?: boolean;

  /** VPN service name */
  vpn_service?: string;

  /** RIOT flag - whether this IP belongs to a known benign service */
  riot?: boolean;

  /** Name of the benign service (if RIOT is true) */
  name?: string;

  /** Link to GreyNoise Visualizer for this IP */
  link?: string;

  /** Additional message from the API */
  message?: string;
}

/**
 * Statistics calculated from GreyNoise analysis
 * Used for quick reference in the UI
 */
export interface GreyNoiseAnalysisStats {
  /** Classification of the IP */
  classification: string;

  /** Whether GreyNoise has seen this IP */
  seen: boolean;

  /** Number of behavior tags */
  tags: string[];

  /** Country where the IP is located */
  country?: string;

  /** Organization operating the IP */
  organization?: string;

  /** When the IP was last observed */
  lastSeen?: string;

  /** Whether this is a TOR exit node */
  isTor: boolean;

  /** Whether this is a VPN */
  isVPN: boolean;

  /** Whether this is a proxy */
  isProxy: boolean;

  /** Whether this is a RIOT IP (known benign service) */
  isRiot: boolean;
}

/**
 * GreyNoise API Error Response
 */
export interface GreyNoiseError {
  error: string;
  message?: string;
  status?: number;
}

/**
 * GreyNoise Community API Rate Limits
 */
export const GREYNOISE_RATE_LIMITS = {
  COMMUNITY: {
    requestsPerMinute: 20,
    requestsPerMonth: 10000,
  },
  ENTERPRISE: {
    requestsPerMinute: 100,
    requestsPerMonth: 1000000,
  },
} as const;
