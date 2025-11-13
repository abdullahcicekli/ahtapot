/**
 * IBM X-Force Exchange API Response Types
 * Based on https://api.xforce.ibmcloud.com/doc/
 */

/**
 * IP Reputation response
 */
export interface XForceIPResponse {
  ip: string;
  history?: Array<{
    created: string;
    reason: string;
    score: number;
    reasonDescription?: string;
    categoryDescriptions?: Record<string, string>;
    geo?: {
      country: string;
      countrycode: string;
    };
    cats?: Record<string, number>;
  }>;
  cats?: Record<string, number>;
  categoryDescriptions?: Record<string, string>;
  score?: number;
  geo?: {
    country: string;
    countrycode: string;
  };
  reason?: string;
  reasonDescription?: string;
  subnets?: Array<{
    subnet: string;
    categoryDescriptions?: Record<string, string>;
    score: number;
    cats?: Record<string, number>;
    reason?: string;
    created: string;
  }>;
}

/**
 * URL Reputation response
 */
export interface XForceURLResponse {
  result: {
    url: string;
    cats?: Record<string, number>;
    categoryDescriptions?: Record<string, string>;
    score?: number;
    application?: {
      name: string;
      description: string;
      categories?: Record<string, number>;
    };
  };
}

/**
 * Domain/WHOIS response
 */
export interface XForceDomainResponse {
  contact?: Array<{
    type: string;
    name?: string;
    organization?: string;
    email?: string;
    country?: string;
  }>;
  cats?: Record<string, number>;
  categoryDescriptions?: Record<string, string>;
  score?: number;
}

/**
 * Malware response
 */
export interface XForceMalwareResponse {
  malware: {
    type: string;
    md5?: string;
    family?: string[];
    origins?: {
      external?: {
        family?: string[];
        detectionCoverage?: number;
        firstSeen?: string;
        lastSeen?: string;
      };
    };
    risk?: string;
    created?: string;
  };
}

/**
 * Error response
 */
export interface XForceErrorResponse {
  error?: string;
  message?: string;
}
