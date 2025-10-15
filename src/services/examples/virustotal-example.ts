/**
 * VirusTotal Integration Example
 *
 * This file demonstrates how to use the VirusTotal service
 * to analyze different types of IOCs (IP addresses, domains, URLs, file hashes)
 */

import { VirusTotalService } from '../tools/VirusTotalService';
import { IOCType } from '@/types/ioc';

/**
 * Example: Analyze an IP address
 */
async function analyzeIPAddress() {
  console.log('=== Analyzing IP Address ===');

  const service = new VirusTotalService({
    apiKey: 'YOUR_VIRUSTOTAL_API_KEY', // Replace with actual API key
  });

  const result = await service.analyze({
    type: IOCType.IPV4,
    value: '8.8.8.8',
  });

  console.log('Status:', result.status);
  console.log('Source:', result.source);
  console.log('Details:', JSON.stringify(result.details, null, 2));

  if (result.status !== 'error') {
    console.log('✓ Analysis completed successfully');
    console.log(`  Malicious: ${result.details?.malicious}`);
    console.log(`  Suspicious: ${result.details?.suspicious}`);
    console.log(`  Country: ${result.details?.country}`);
    console.log(`  ASN: ${result.details?.asn}`);
    console.log(`  Network: ${result.details?.network}`);
  } else {
    console.error('✗ Analysis failed:', result.error);
  }

  return result;
}

/**
 * Example: Analyze a domain
 */
async function analyzeDomain() {
  console.log('\n=== Analyzing Domain ===');

  const service = new VirusTotalService({
    apiKey: 'YOUR_VIRUSTOTAL_API_KEY',
  });

  const result = await service.analyze({
    type: IOCType.DOMAIN,
    value: 'google.com',
  });

  console.log('Status:', result.status);
  console.log('Source:', result.source);

  if (result.status !== 'error') {
    console.log('✓ Analysis completed successfully');
    console.log(`  Malicious: ${result.details?.malicious}`);
    console.log(`  Reputation: ${result.details?.reputation}`);
    console.log(`  Categories:`, result.details?.categories);
  } else {
    console.error('✗ Analysis failed:', result.error);
  }

  return result;
}

/**
 * Example: Analyze a URL
 */
async function analyzeURL() {
  console.log('\n=== Analyzing URL ===');

  const service = new VirusTotalService({
    apiKey: 'YOUR_VIRUSTOTAL_API_KEY',
  });

  const result = await service.analyze({
    type: IOCType.URL,
    value: 'https://www.google.com',
  });

  console.log('Status:', result.status);
  console.log('Source:', result.source);

  if (result.status !== 'error') {
    console.log('✓ Analysis completed successfully');
    console.log(`  Malicious: ${result.details?.malicious}`);
    console.log(`  Final URL: ${result.details?.final_url}`);
    console.log(`  HTTP Code: ${result.details?.http_response_code}`);
  } else {
    console.error('✗ Analysis failed:', result.error);
  }

  return result;
}

/**
 * Example: Analyze a file hash
 */
async function analyzeFileHash() {
  console.log('\n=== Analyzing File Hash ===');

  const service = new VirusTotalService({
    apiKey: 'YOUR_VIRUSTOTAL_API_KEY',
  });

  // Example: EICAR test file SHA256
  const eicarSHA256 = '275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f';

  const result = await service.analyze({
    type: IOCType.SHA256,
    value: eicarSHA256,
  });

  console.log('Status:', result.status);
  console.log('Source:', result.source);

  if (result.status !== 'error') {
    console.log('✓ Analysis completed successfully');
    console.log(`  Malicious: ${result.details?.malicious}`);
    console.log(`  Type: ${result.details?.type_description}`);
    console.log(`  Size: ${result.details?.size} bytes`);
    console.log(`  Names:`, result.details?.names);
  } else {
    console.error('✗ Analysis failed:', result.error);
  }

  return result;
}

/**
 * Example: Using APIService for multiple providers
 */
async function analyzeWithMultipleProviders() {
  console.log('\n=== Analyzing with Multiple Providers ===');

  const { APIService } = await import('../api-service');

  const apiService = new APIService({
    virustotal: 'YOUR_VIRUSTOTAL_API_KEY',
    // Add other providers as needed
    // shodan: 'YOUR_SHODAN_API_KEY',
    // abuseipdb: 'YOUR_ABUSEIPDB_API_KEY',
  });

  const results = await apiService.analyzeIOC({
    type: IOCType.IPV4,
    value: '1.1.1.1',
  });

  console.log(`Received ${results.length} result(s):`);
  results.forEach((result, index) => {
    console.log(`\n[${index + 1}] ${result.source}:`);
    console.log(`  Status: ${result.status}`);
    if (result.status !== 'error') {
      console.log(`  Details:`, result.details);
    } else {
      console.log(`  Error: ${result.error}`);
    }
  });

  return results;
}

/**
 * Example: Error handling
 */
async function demonstrateErrorHandling() {
  console.log('\n=== Demonstrating Error Handling ===');

  // 1. Missing API key
  const serviceWithoutKey = new VirusTotalService({ apiKey: '' });
  const result1 = await serviceWithoutKey.analyze({
    type: IOCType.IPV4,
    value: '8.8.8.8',
  });
  console.log('Without API key:', result1.status, '-', result1.error);

  // 2. Unsupported IOC type
  const service = new VirusTotalService({ apiKey: 'test-key' });
  const result2 = await service.analyze({
    type: IOCType.CVE,
    value: 'CVE-2021-44228',
  });
  console.log('Unsupported type:', result2.status, '-', result2.error);

  // 3. Service supports check
  console.log('Supports IPv4?', service.supports(IOCType.IPV4)); // true
  console.log('Supports CVE?', service.supports(IOCType.CVE));   // false
}

/**
 * Main example runner
 */
export async function runExamples() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  VirusTotal Integration Examples          ║');
  console.log('╚════════════════════════════════════════════╝\n');

  try {
    // Note: Replace 'YOUR_VIRUSTOTAL_API_KEY' with actual API key to run these examples

    await demonstrateErrorHandling();

    // Uncomment to run actual API calls (requires valid API key):
    // await analyzeIPAddress();
    // await analyzeDomain();
    // await analyzeURL();
    // await analyzeFileHash();
    // await analyzeWithMultipleProviders();

    console.log('\n✓ All examples completed');
  } catch (error) {
    console.error('\n✗ Example failed:', error);
  }
}

// Export individual functions for testing
export {
  analyzeIPAddress,
  analyzeDomain,
  analyzeURL,
  analyzeFileHash,
  analyzeWithMultipleProviders,
  demonstrateErrorHandling,
};
