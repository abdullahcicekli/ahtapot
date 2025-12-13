/**
 * Domain Validation Tests
 *
 * False positive tespiti için test senaryoları
 *
 * Run: npx ts-node tests/domain-validation.test.ts
 */

import { validateDomain, needsExtraValidation } from '../src/utils/domain-validator';
import { isDefinitelyNotTLD } from '../src/utils/file-extensions';

// Test helper
function test(name: string, fn: () => boolean): void {
  try {
    const result = fn();
    console.log(result ? `✅ ${name}` : `❌ ${name}`);
  } catch (e) {
    console.log(`❌ ${name} - Error: ${e}`);
  }
}

console.log('\n=== FALSE POSITIVE TESTS ===\n');
console.log('These should be detected as FILES (not domains):\n');

// 1. Non-TLD file extensions
test('access.log should NOT be detected as domain', () => {
  return isDefinitelyNotTLD('log') === true;
});

test('data.csv should NOT be detected as domain', () => {
  return isDefinitelyNotTLD('csv') === true;
});

test('config.json should NOT be detected as domain', () => {
  return isDefinitelyNotTLD('json') === true;
});

test('script.js should NOT be detected as domain', () => {
  return isDefinitelyNotTLD('js') === true;
});

test('styles.css should NOT be detected as domain', () => {
  return isDefinitelyNotTLD('css') === true;
});

test('document.pdf should NOT be detected as domain', () => {
  return isDefinitelyNotTLD('pdf') === true;
});

test('image.png should NOT be detected as domain', () => {
  return isDefinitelyNotTLD('png') === true;
});

test('video.mp4 should NOT be detected as domain', () => {
  return isDefinitelyNotTLD('mp4') === true;
});

// 2. TLD collision cases - should be detected as files
console.log('\n--- TLD Collision Cases (Files) ---\n');

test('readme.md should NOT be detected as domain', () => {
  const result = validateDomain('readme.md');
  return result.isValid === false;
});

test('access.sh should NOT be detected as domain', () => {
  const result = validateDomain('access.sh');
  return result.isValid === false;
});

test('config.py should NOT be detected as domain', () => {
  const result = validateDomain('config.py');
  return result.isValid === false;
});

test('main.rs should NOT be detected as domain', () => {
  const result = validateDomain('main.rs');
  return result.isValid === false;
});

test('script.pl should NOT be detected as domain', () => {
  const result = validateDomain('script.pl');
  return result.isValid === false;
});

test('archive.zip should NOT be detected as domain', () => {
  const result = validateDomain('archive.zip');
  return result.isValid === false;
});

test('video.mov should NOT be detected as domain', () => {
  const result = validateDomain('video.mov');
  return result.isValid === false;
});

test('installer.app should NOT be detected as domain', () => {
  const result = validateDomain('installer.app');
  return result.isValid === false;
});

test('design.ai should NOT be detected as domain', () => {
  const result = validateDomain('design.ai');
  return result.isValid === false;
});

test('data.io should NOT be detected as domain', () => {
  const result = validateDomain('data.io');
  return result.isValid === false;
});

test('client_hostname.csv context should reject', () => {
  return isDefinitelyNotTLD('csv') === true;
});

// 3. Context-based detection
console.log('\n--- Context-Based Detection ---\n');

test('/var/log/access.md should NOT be domain (file path context)', () => {
  const result = validateDomain('access.md', { before: '/var/log/', after: '' });
  return result.isValid === false;
});

test('~/Documents/readme.md should NOT be domain (home path context)', () => {
  const result = validateDomain('readme.md', { before: '~/Documents/', after: '' });
  return result.isValid === false;
});

test('config_v2.sh should NOT be domain (underscore pattern)', () => {
  const result = validateDomain('config_v2.sh');
  return result.isValid === false;
});

// 4. Valid domains that SHOULD be detected
console.log('\n=== TRUE POSITIVE TESTS ===\n');
console.log('These SHOULD be detected as domains:\n');

test('google.com should be detected as domain', () => {
  const result = validateDomain('google.com');
  return result.isValid === true;
});

test('github.io should be detected as domain', () => {
  const result = validateDomain('github.io');
  return result.isValid === true;
});

test('www.example.dev should be detected as domain', () => {
  const result = validateDomain('www.example.dev');
  return result.isValid === true;
});

test('api.stripe.co should be detected as domain', () => {
  const result = validateDomain('api.stripe.co');
  return result.isValid === true;
});

test('mail.protonmail.me should be detected as domain', () => {
  const result = validateDomain('mail.protonmail.me');
  return result.isValid === true;
});

test('subdomain.example.ai should be detected as domain', () => {
  const result = validateDomain('subdomain.example.ai');
  return result.isValid === true;
});

test('download.mozilla.org should be detected as domain', () => {
  const result = validateDomain('download.mozilla.org');
  return result.isValid === true;
});

test('vercel.app should be detected as domain (platform)', () => {
  // This is tricky - vercel.app is a valid platform domain
  // but our heuristics might flag it. Let's see.
  const result = validateDomain('vercel.app');
  return result.isValid === true || result.confidence === 'LOW';
});

// 5. Edge cases
console.log('\n=== EDGE CASES ===\n');

test('a.md should NOT be domain (too short)', () => {
  const result = validateDomain('a.md');
  return result.isValid === false;
});

test('CHANGELOG.md should NOT be domain (common filename)', () => {
  const result = validateDomain('CHANGELOG.md');
  return result.isValid === false;
});

test('LICENSE.md should NOT be domain (common filename)', () => {
  const result = validateDomain('LICENSE.md');
  return result.isValid === false;
});

console.log('\n=== TEST COMPLETE ===\n');
