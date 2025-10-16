/**
 * OTX AlienVault API Type Definitions
 * Documentation: https://otx.alienvault.com/api
 */

/**
 * OTX Pulse Information
 */
export interface OTXPulse {
  id: string;
  name: string;
  description: string;
  author_name: string;
  created: string;
  modified: string;
  tags: string[];
  references: string[];
  indicators: Array<{
    type: string;
    indicator: string;
    description?: string;
  }>;
  malware_families?: string[];
  attack_ids?: string[];
  targeted_countries?: string[];
}

/**
 * OTX General Indicator Response
 */
export interface OTXGeneralResponse {
  indicator: string;
  type: string;
  type_title: string;
  base_indicator?: {
    id: string;
    indicator: string;
    type: string;
  };
  pulse_info?: {
    count: number;
    pulses: OTXPulse[];
    references: string[];
    related: {
      alienvault: {
        adversary: string[];
        malware_families: string[];
        industries: string[];
      };
      other: {
        adversary: string[];
        malware_families: string[];
        industries: string[];
      };
    };
  };
  false_positive?: boolean;
  validation?: Array<{
    source: string;
    message: string;
  }>;
  reputation?: number;
  sections?: string[];
}

/**
 * OTX Error Response
 */
export interface OTXErrorResponse {
  detail?: string;
  error?: string;
  message?: string;
}

/**
 * OTX Analysis Stats
 */
export interface OTXAnalysisStats {
  pulseCount: number;
  malicious: number;
  suspicious: number;
  harmless: number;
}
