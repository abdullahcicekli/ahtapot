/**
 * IOC (Indicator of Compromise) türleri
 */
export enum IOCType {
  IPV4 = 'ipv4',
  IPV6 = 'ipv6',
  DOMAIN = 'domain',
  URL = 'url',
  MD5 = 'md5',
  SHA1 = 'sha1',
  SHA256 = 'sha256',
  EMAIL = 'email',
  CVE = 'cve',
  BITCOIN = 'bitcoin',
  ETHEREUM = 'ethereum',
}

/**
 * Tespit edilen IOC bilgisi
 */
export interface DetectedIOC {
  type: IOCType;
  value: string;
  position?: {
    start: number;
    end: number;
  };
}

/**
 * IOC analiz sonucu
 */
export interface IOCAnalysisResult {
  ioc: DetectedIOC;
  source: string; // VirusTotal
  status: 'safe' | 'suspicious' | 'malicious' | 'unknown' | 'error';
  details?: Record<string, any>;
  error?: string;
  unsupportedReason?: string; // Reason why this IOC type is not supported
  supportedTypes?: IOCType[]; // List of supported IOC types for this provider
  timestamp: number;
}

/**
 * API sağlayıcı türleri
 */
export enum APIProvider {
  VIRUSTOTAL = 'virustotal',
  OTX = 'otx',
  ABUSEIPDB = 'abuseipdb',
  MALWAREBAZAAR = 'malwarebazaar',
}

/**
 * API anahtarı yapılandırması
 */
export interface APIConfig {
  provider: APIProvider;
  apiKey: string;
  enabled: boolean;
}
