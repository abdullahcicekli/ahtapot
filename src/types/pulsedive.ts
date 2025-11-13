/**
 * Pulsedive API Response Types
 * Based on https://pulsedive.com/api/
 */

/**
 * Risk level
 */
export type PulsediveRisk = 'none' | 'low' | 'medium' | 'high' | 'critical' | 'retired' | 'unknown';

/**
 * Indicator information
 */
export interface PulsediveIndicator {
  iid: number;
  indicator: string;
  type: 'ip' | 'domain' | 'url' | 'hash';
  risk: PulsediveRisk;
  risk_recommended?: PulsediveRisk;
  manualrisk?: number;
  retired?: boolean;
  stamp_added?: string;
  stamp_updated?: string;
  stamp_seen?: string;
  stamp_probed?: string;
  stamp_retired?: string;
  recent?: boolean;
  attributes?: {
    technology?: string[];
    port?: string[];
    protocol?: string[];
    asn?: string[];
    geo?: string[];
  };
  properties?: {
    [key: string]: any;
  };
  threats?: Array<{
    tid: number;
    name: string;
    category: string;
    risk: PulsediveRisk;
    stamp_linked?: string;
  }>;
  feeds?: Array<{
    fid: number;
    name: string;
    organization: string;
    category: string;
  }>;
  riskfactors?: Array<{
    rfid: number;
    description: string;
    risk: PulsediveRisk;
  }>;
  comments?: Array<{
    cid: number;
    comment: string;
    username: string;
    stamp_added: string;
  }>;
  redirect?: {
    indicator: string;
    type: string;
  };
}

/**
 * Error response
 */
export interface PulsediveErrorResponse {
  error?: string;
  message?: string;
}

/**
 * Summary response (lightweight)
 */
export interface PulsediveSummary {
  indicator: string;
  type: 'ip' | 'domain' | 'url' | 'hash';
  risk: PulsediveRisk;
  stamp_added?: string;
  stamp_seen?: string;
  threats?: Array<{
    name: string;
    category: string;
  }>;
}
