/**
 * AbuseIPDB API Type Definitions
 * Documentation: https://docs.abuseipdb.com/
 */

/**
 * AbuseIPDB Check Response
 * Returned by /check endpoint
 */
export interface AbuseIPDBCheckResponse {
  data: {
    ipAddress: string;
    isPublic: boolean;
    ipVersion: number;
    isWhitelisted: boolean;
    abuseConfidenceScore: number;
    countryCode: string;
    countryName?: string;
    usageType: string;
    isp: string;
    domain: string;
    hostnames: string[];
    isTor: boolean;
    totalReports: number;
    numDistinctUsers: number;
    lastReportedAt: string | null;
    reports?: AbuseIPDBReport[];
  };
}

/**
 * Individual abuse report
 */
export interface AbuseIPDBReport {
  reportedAt: string;
  comment: string;
  categories: number[];
  reporterId: number;
  reporterCountryCode: string;
  reporterCountryName: string;
}

/**
 * AbuseIPDB Error Response
 */
export interface AbuseIPDBErrorResponse {
  errors: Array<{
    detail: string;
    status: number;
    source?: {
      parameter?: string;
    };
  }>;
}

/**
 * AbuseIPDB Category Codes
 * Reference: https://www.abuseipdb.com/categories
 */
export enum AbuseIPDBCategory {
  DNS_COMPROMISE = 1,
  DNS_POISONING = 2,
  FRAUD_ORDERS = 3,
  DDOS_ATTACK = 4,
  FTP_BRUTE_FORCE = 5,
  PING_OF_DEATH = 6,
  PHISHING = 7,
  FRAUD_VOIP = 8,
  OPEN_PROXY = 9,
  WEB_SPAM = 10,
  EMAIL_SPAM = 11,
  BLOG_SPAM = 12,
  VPNIP = 13,
  PORT_SCAN = 14,
  HACKING = 15,
  SQL_INJECTION = 16,
  SPOOFING = 17,
  BRUTE_FORCE = 18,
  BAD_WEB_BOT = 19,
  EXPLOITED_HOST = 20,
  WEB_APP_ATTACK = 21,
  SSH = 22,
  IOT_TARGETED = 23,
}

/**
 * Human-readable category labels
 */
export const ABUSE_CATEGORY_LABELS: Record<AbuseIPDBCategory, string> = {
  [AbuseIPDBCategory.DNS_COMPROMISE]: 'DNS Compromise',
  [AbuseIPDBCategory.DNS_POISONING]: 'DNS Poisoning',
  [AbuseIPDBCategory.FRAUD_ORDERS]: 'Fraud Orders',
  [AbuseIPDBCategory.DDOS_ATTACK]: 'DDoS Attack',
  [AbuseIPDBCategory.FTP_BRUTE_FORCE]: 'FTP Brute-Force',
  [AbuseIPDBCategory.PING_OF_DEATH]: 'Ping of Death',
  [AbuseIPDBCategory.PHISHING]: 'Phishing',
  [AbuseIPDBCategory.FRAUD_VOIP]: 'Fraud VoIP',
  [AbuseIPDBCategory.OPEN_PROXY]: 'Open Proxy',
  [AbuseIPDBCategory.WEB_SPAM]: 'Web Spam',
  [AbuseIPDBCategory.EMAIL_SPAM]: 'Email Spam',
  [AbuseIPDBCategory.BLOG_SPAM]: 'Blog Spam',
  [AbuseIPDBCategory.VPNIP]: 'VPN IP',
  [AbuseIPDBCategory.PORT_SCAN]: 'Port Scan',
  [AbuseIPDBCategory.HACKING]: 'Hacking',
  [AbuseIPDBCategory.SQL_INJECTION]: 'SQL Injection',
  [AbuseIPDBCategory.SPOOFING]: 'Spoofing',
  [AbuseIPDBCategory.BRUTE_FORCE]: 'Brute Force',
  [AbuseIPDBCategory.BAD_WEB_BOT]: 'Bad Web Bot',
  [AbuseIPDBCategory.EXPLOITED_HOST]: 'Exploited Host',
  [AbuseIPDBCategory.WEB_APP_ATTACK]: 'Web App Attack',
  [AbuseIPDBCategory.SSH]: 'SSH',
  [AbuseIPDBCategory.IOT_TARGETED]: 'IoT Targeted',
};

/**
 * Statistics calculated from AbuseIPDB response
 */
export interface AbuseIPDBAnalysisStats {
  abuseConfidenceScore: number;
  totalReports: number;
  numDistinctUsers: number;
  isWhitelisted: boolean;
  isTor: boolean;
  categories: number[];
  recentReports: number; // Last 30 days
}
