/**
 * Domain Validator
 *
 * Dosya uzantıları ile TLD çakışmalarını tespit eder.
 * False positive'leri minimize etmek için context-based validation yapar.
 */

import {
  NON_TLD_EXTENSIONS,
  COMMON_FILENAME_PREFIXES,
  FILE_PATH_INDICATORS,
  hasTLDCollisionRisk,
  getCollisionRiskLevel,
} from './file-extensions';

/**
 * Domain validation sonucu
 */
export interface DomainValidationResult {
  isValid: boolean;
  reason?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  riskLevel?: 'HIGH' | 'MEDIUM_HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
}

/**
 * Validates if a potential domain is actually a domain or a filename
 *
 * @param potentialDomain - The string that looks like a domain
 * @param context - The surrounding text (before and after the match)
 * @returns Validation result with confidence level
 */
export function validateDomain(
  potentialDomain: string,
  context?: { before: string; after: string }
): DomainValidationResult {
  const domain = potentialDomain.toLowerCase().trim();

  // 1. Extract the TLD (last part after the final dot)
  const parts = domain.split('.');
  if (parts.length < 2) {
    return { isValid: false, reason: 'No TLD found', confidence: 'HIGH' };
  }

  const tld = parts[parts.length - 1];
  const filename = parts.slice(0, -1).join('.');

  // 2. Check if TLD is definitely NOT a valid TLD (e.g., .log, .csv, .txt)
  if (NON_TLD_EXTENSIONS.has(tld)) {
    return {
      isValid: false,
      reason: `Extension .${tld} is not a valid TLD`,
      confidence: 'HIGH',
    };
  }

  // 3. Check for file path indicators in context
  if (context?.before) {
    const beforeLower = context.before.toLowerCase();
    for (const indicator of FILE_PATH_INDICATORS) {
      if (beforeLower.endsWith(indicator) || beforeLower.includes(indicator)) {
        return {
          isValid: false,
          reason: `File path indicator found: ${indicator}`,
          confidence: 'HIGH',
        };
      }
    }
  }

  // 4. Check if this is a TLD with collision risk
  const riskLevel = getCollisionRiskLevel(tld);

  if (riskLevel !== 'NONE' && hasTLDCollisionRisk(tld)) {
    // 4a. Check for common filename prefixes
    const filenameLower = filename.toLowerCase();
    if (COMMON_FILENAME_PREFIXES.has(filenameLower)) {
      return {
        isValid: false,
        reason: `Common filename prefix: ${filename}`,
        confidence: 'HIGH',
        riskLevel,
      };
    }

    // 4b. Check for underscore or common file naming patterns
    if (filename.includes('_') || filename.includes('-')) {
      // Files often use underscores: access_log.md, client_data.csv
      // But domains also use hyphens: my-site.dev
      // Underscore is more likely a file
      if (filename.includes('_')) {
        return {
          isValid: false,
          reason: `Underscore in name suggests file: ${filename}`,
          confidence: 'MEDIUM',
          riskLevel,
        };
      }
    }

    // 4c. Check for version numbers in filename
    const versionPattern = /v?\d+(\.\d+)*$/i;
    if (versionPattern.test(filename)) {
      return {
        isValid: false,
        reason: `Version number in name suggests file: ${filename}`,
        confidence: 'MEDIUM',
        riskLevel,
      };
    }

    // 4d. Check for all-lowercase single word without subdomain pattern
    // High-risk TLDs: Single word + high-risk TLD = likely file
    if (riskLevel === 'HIGH' || riskLevel === 'MEDIUM_HIGH') {
      // Check if it's just "word.ext" without subdomain indicators
      if (parts.length === 2 && !filename.includes('.')) {
        // Single word like "readme.md", "access.log", "script.sh"
        // Check if filename is all lowercase and looks like a file
        if (isLikelyFilename(filename)) {
          return {
            isValid: false,
            reason: `Likely filename pattern: ${filename}.${tld}`,
            confidence: 'MEDIUM',
            riskLevel,
          };
        }
      }
    }

    // 4e. Context-based checks
    if (context) {
      // Check for file-like context after the domain
      const afterLower = context.after.toLowerCase().trim();
      if (afterLower.startsWith(':') || afterLower.startsWith('(')) {
        // Could be "file.md:10" (line number) or "file.sh (executable)"
        return {
          isValid: false,
          reason: 'File-like context detected',
          confidence: 'MEDIUM',
          riskLevel,
        };
      }
    }

    // 4f. HIGH and MEDIUM_HIGH risk TLDs with single-word names need subdomain
    // to be considered valid domains
    if ((riskLevel === 'HIGH' || riskLevel === 'MEDIUM_HIGH') && parts.length === 2) {
      // For high-risk TLDs, require subdomain (www, api, mail, etc.) or
      // recognizable domain pattern
      if (!hasRecognizableDomainPattern(domain)) {
        return {
          isValid: false,
          reason: `High-risk TLD without subdomain or recognizable pattern`,
          confidence: 'LOW',
          riskLevel,
        };
      }
    }
  }

  // 5. Additional validation for all domains
  // Check for minimum domain length
  if (filename.length < 2) {
    return {
      isValid: false,
      reason: 'Domain name too short',
      confidence: 'HIGH',
    };
  }

  // Check for invalid characters
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(filename.split('.').pop() || '')) {
    // This is a simplified check - real domains have more complex rules
  }

  // 6. Domain appears valid
  return {
    isValid: true,
    confidence: riskLevel === 'NONE' ? 'HIGH' : 'MEDIUM',
    riskLevel,
  };
}

/**
 * Check if a string looks like a typical filename
 */
function isLikelyFilename(name: string): boolean {
  const nameLower = name.toLowerCase();

  // Common filename patterns that are NOT domain names
  const filenamePatterns = [
    // Log files
    /^(access|error|debug|info|warn|warning|audit|system|app|application|server|request|response|event|query|slow|general)$/,
    // Config files
    /^(config|configuration|settings|options|preferences|prefs|env|environment)$/,
    // Data files
    /^(data|database|db|backup|dump|export|import|input|output|result|results|report|reports)$/,
    // Main/entry files
    /^(main|index|app|application|server|client|worker|init|setup|install|bootstrap|entry|start|run)$/,
    // Documentation
    /^(readme|changelog|license|licence|contributing|authors|history|news|todo|copying|notice)$/,
    // Source files
    /^(src|source|sources|include|includes|util|utils|helper|helpers|common|shared|core|base|module)$/,
    // Test files
    /^(test|tests|spec|specs|unit|integration|e2e|fixture|fixtures|mock|mocks)$/,
    // Build files
    /^(build|dist|output|bundle|vendor|lib|libs|package|manifest)$/,
    // Script files
    /^(script|scripts|style|styles|asset|assets)$/,
    // Version indicators
    /^(v\d+|old|new|backup|copy|original|final)$/,
    // Common file names with numbers
    /^(file|document|image|photo|video|audio|song|track|clip|sample|example|demo)\d*$/,
    // Hostname patterns (often in logs)
    /^(hostname|host|client|server|node|worker|master|primary|secondary|replica|slave|proxy|gateway)\d*$/,
  ];

  return filenamePatterns.some((pattern) => pattern.test(nameLower));
}

/**
 * Check if domain has recognizable domain pattern
 * (subdomain, common domain name patterns)
 */
function hasRecognizableDomainPattern(domain: string): boolean {
  const parts = domain.toLowerCase().split('.');

  // Has subdomain (3+ parts)
  if (parts.length >= 3) {
    return true;
  }

  // Common domain prefixes that indicate real domain
  const domainIndicators = [
    'www', 'api', 'app', 'mail', 'smtp', 'imap', 'pop', 'ftp', 'sftp',
    'cdn', 'static', 'assets', 'media', 'img', 'images', 'video',
    'blog', 'shop', 'store', 'admin', 'dashboard', 'portal', 'login',
    'auth', 'oauth', 'sso', 'id', 'account', 'accounts', 'my',
    'support', 'help', 'docs', 'documentation', 'wiki', 'forum',
    'dev', 'staging', 'prod', 'production', 'test', 'demo', 'beta',
    'news', 'status', 'health', 'metrics', 'monitor', 'analytics',
  ];

  // Check first part for common domain indicators
  if (parts.length >= 2 && domainIndicators.includes(parts[0])) {
    return true;
  }

  // Check if name looks like a company/brand name (capitalized, longer)
  const name = parts[0];
  if (name.length >= 6) {
    // Longer names are more likely to be real domains
    // unless they match filename patterns
    return !isLikelyFilename(name);
  }

  return false;
}

/**
 * Quick check if a potential domain should be further validated
 * Returns true if the domain might be a false positive
 */
export function needsExtraValidation(potentialDomain: string): boolean {
  const parts = potentialDomain.toLowerCase().split('.');
  if (parts.length < 2) return false;

  const tld = parts[parts.length - 1];

  // Definitely not a TLD
  if (NON_TLD_EXTENSIONS.has(tld)) {
    return true;
  }

  // Has TLD collision risk
  if (hasTLDCollisionRisk(tld)) {
    return true;
  }

  return false;
}

/**
 * Extract context around a match position in text
 */
export function extractContext(
  text: string,
  position: { start: number; end: number },
  contextLength: number = 50
): { before: string; after: string } {
  const before = text.substring(
    Math.max(0, position.start - contextLength),
    position.start
  );
  const after = text.substring(
    position.end,
    Math.min(text.length, position.end + contextLength)
  );

  return { before, after };
}
