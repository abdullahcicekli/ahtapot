/**
 * ARIN WHOIS RWS API Type Definitions
 * Documentation: https://www.arin.net/resources/registry/whois/rws/
 *
 * ARIN provides public WHOIS information about IP number resources,
 * organizations, and Points of Contact registered with ARIN.
 */

/**
 * ARIN Network Information
 * Core network data from WHOIS lookup
 */
export interface ARINNetwork {
  handle: string;
  name: string;
  startAddress: string;
  endAddress: string;
  cidrLength: number;
  version: string; // "4" or "6"
  registrationDate: string;
  updateDate: string;
  comment?: string[];
  netBlocks?: {
    startAddress: string;
    endAddress: string;
    cidrLength: number;
    type: string;
  }[];
}

/**
 * ARIN Organization Information
 */
export interface ARINOrganization {
  handle: string;
  name: string;
  orgType?: string; // Organization type (e.g., "Direct Allocation", "Reassigned", etc.)
  registrationDate?: string;
  updateDate?: string;
  streetAddress?: string[];
  city?: string;
  iso3166_1?: {
    code2: string;
    code3: string;
    name: string;
  };
  postalCode?: string;
  comment?: string[];
}

/**
 * ARIN Point of Contact
 */
export interface ARINPointOfContact {
  handle: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  kind: string; // "person", "group", etc.
  emails?: string[];
  phones?: {
    number: string;
    type: string;
  }[];
}

/**
 * Complete ARIN IP Response
 * Combined response from /ip/{ipAddress} endpoint
 */
export interface ARINIPResponse {
  net: ARINNetwork;
  orgRef?: {
    handle: string;
    name: string;
  };
  customerRef?: {
    handle: string;
    name: string;
  };
  netBlocks?: {
    netBlock: {
      startAddress: string;
      endAddress: string;
      cidrLength: number;
      type: string;
    };
  }[];
  parentNetRef?: {
    handle: string;
    name: string;
  };
}

/**
 * ARIN Organization Response
 * Response from /org/{handle} endpoint
 */
export interface ARINOrgResponse {
  org: ARINOrganization;
  pocLinks?: {
    pocLinkRef: Array<{
      handle: string;
      function: string; // "AD", "AB", "N", "T"
    }>;
  };
}

/**
 * ARIN Error Response
 */
export interface ARINErrorResponse {
  message: {
    code: string;
    text: string;
    additionalInfo?: Array<{
      message: string;
      name: string;
    }>;
  };
}

/**
 * Statistics calculated from ARIN response
 */
export interface ARINAnalysisStats {
  networkName: string;
  networkRange: string;
  cidr: string;
  ipVersion: number;
  organizationName?: string;
  organizationType?: string;
  country?: string;
  registrationDate?: string;
  lastUpdateDate?: string;
  hasCustomerRef: boolean;
  hasParentNet: boolean;
}

/**
 * POC Function Labels
 * Reference: https://www.arin.net/resources/manage/customer-support/common-abuses/
 */
export const POC_FUNCTION_LABELS: Record<string, string> = {
  'AD': 'Administrative Contact',
  'AB': 'Abuse Contact',
  'N': 'NOC Contact',
  'T': 'Technical Contact',
};

/**
 * Organization Type Labels
 */
export const ORG_TYPE_LABELS: Record<string, string> = {
  'Direct Allocation': 'Direct Allocation',
  'Direct Assignment': 'Direct Assignment',
  'Reallocated': 'Reallocated',
  'Reassigned': 'Reassigned',
  'LIR': 'Local Internet Registry',
  'ISP': 'Internet Service Provider',
};
