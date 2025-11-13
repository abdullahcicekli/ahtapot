# CLAUDE.md - Ahtapot IOC Analysis Extension

## Project Overview

**Ahtapot** is a Chrome extension for fast and secure IOC (Indicator of Compromise) analysis with multiple threat intelligence providers. It provides cybersecurity analysts with a convenient way to analyze security indicators directly from their browser.

### Key Information
- **Version**: 2.4.0
- **Tech Stack**: React 18 + TypeScript + Vite 5
- **Extension Type**: Chrome Manifest V3
- **License**: MIT
- **Primary Language**: TypeScript with English/Turkish i18n support

### Project Purpose
Ahtapot enables security analysts to:
1. Select any text on a webpage containing IOCs
2. Automatically detect various IOC types (IPs, domains, hashes, URLs, etc.)
3. Query multiple threat intelligence providers simultaneously
4. View consolidated analysis results in a side panel

---

## Architecture Overview

### High-Level Structure

```
ahtapot/
├── src/
│   ├── background/          # Service worker (API orchestration)
│   ├── content/            # Content scripts (IOC detection on pages)
│   ├── pages/              # Extension UI pages
│   │   ├── popup/          # Extension popup menu
│   │   ├── sidepanel/      # Main results display panel
│   │   └── options/        # Settings and API key management
│   ├── components/         # React components
│   │   └── results/        # Provider-specific result cards
│   ├── services/           # API integration layer
│   │   ├── base/           # Base service interfaces
│   │   └── tools/          # Provider implementations
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── i18n/               # Internationalization (EN/TR)
│   ├── config/             # Configuration files
│   └── manifest.json       # Chrome extension manifest
├── public/                 # Static assets (icons, logos)
├── dist/                   # Build output (gitignored)
└── docs/                   # Documentation
```

### Extension Architecture

Ahtapot follows Chrome Extension Manifest V3 architecture:

1. **Background Service Worker** (`src/background/service-worker.ts`)
   - Orchestrates API calls to threat intelligence providers
   - Manages API keys securely
   - Handles message passing between extension components
   - Initializes context menus

2. **Content Scripts** (`src/content/content-script.tsx`)
   - Injected into all web pages
   - Displays floating "Analyze" button on text selection
   - Detects IOCs in selected text
   - Communicates with background worker

3. **Side Panel** (`src/pages/sidepanel/`)
   - Main UI for displaying analysis results
   - Tab-based interface for each provider
   - Shows IOC detection results and threat assessments

4. **Options Page** (`src/pages/options/`)
   - API key management (add/test/save/remove)
   - General settings (language, cache retention)
   - Live API key validation

5. **Popup** (`src/pages/popup/`)
   - Quick access menu
   - Links to settings and main functionality

---

## Core Concepts

### 1. IOC Detection

**File**: `src/utils/ioc-detector.ts`

The extension automatically detects these IOC types:

| IOC Type | Examples | Pattern |
|----------|----------|---------|
| IPv4 | `192.168.1.1` | Validates 0-255 range |
| IPv6 | `2001:0db8:85a3::8a2e:0370:7334` | Full/compressed notation |
| Domain | `example.com` | Valid TLD required |
| URL | `https://example.com/path` | HTTP/HTTPS |
| MD5 | `d41d8cd98f00b204e9800998ecf8427e` | 32 hex chars |
| SHA1 | `da39a3ee5e6b4b0d3255bfef95601890afd80709` | 40 hex chars |
| SHA256 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 64 hex chars |
| Email | `user@example.com` | RFC 5322 compliant |
| CVE | `CVE-2021-44228` | CVE-YYYY-NNNNN |
| Bitcoin | `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` | Base58/Bech32 |
| Ethereum | `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb` | 0x + 40 hex |

**Detection Algorithm**:
- O(n) complexity with position-based deduplication
- Priority-based pattern matching (more specific patterns first)
- Prevents duplicate detection (e.g., URL containing a domain)
- Smart overlap detection using sorted ranges

### 2. Service Architecture

**Pattern**: Strategy Pattern + Service Registry

**Base Interface**: `src/services/base/BaseToolService.ts`

All provider services implement `IToolService`:
```typescript
interface IToolService {
  name: string;
  supportedIOCTypes: IOCType[];
  isConfigured(): boolean;
  supports(iocType: IOCType): boolean;
  analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult>;
  analyzeBatch?(iocs: DetectedIOC[]): Promise<IOCAnalysisResult[]>;
}
```

**Service Registry**: `src/services/ServiceRegistry.ts`
- Centralized management of all provider services
- Lazy initialization (services created only when needed)
- Automatic API key injection
- ARIN service always available (no API key required)

### 3. Supported Providers

**Current Providers** (as of v2.4.0):

| Provider | Purpose | Rate Limit | Requires API Key |
|----------|---------|------------|------------------|
| **VirusTotal** | Malware & URL scanning | 4 req/min | Yes |
| **OTX AlienVault** | Threat intelligence | 10,000 req/day | Yes |
| **AbuseIPDB** | IP reputation | 1,000 req/day | Yes |
| **MalwareBazaar** | Malware hash database | Unlimited | No |
| **ARIN** | IP WHOIS | 15 req/min | No |
| **Shodan** | Device search | 100 results/month | Yes (with confirmation) |
| **GreyNoise** | Internet noise detection | 50 searches/week | Yes (with confirmation) |
| **URLhaus** | Malicious URL database | Unlimited | Yes (optional) |
| **IBM X-Force** | Enterprise threat intel | 5,000 req/month | Yes |
| **Pulsedive** | IOC enrichment | 250 req/day | Yes |
| **Scamalytics** | IP fraud detection | 5,000 req/month | Yes |

**Note**: Providers marked "with confirmation" require user approval before consuming rate-limited quota.

### 4. Provider Support Matrix

**Smart Provider Matching**: Each provider only supports certain IOC types. The extension:
- Detects which providers support each IOC type
- Displays support badges in the UI
- Only queries compatible providers
- Shows informative messages when providers don't support an IOC type

See `src/utils/providerMappings.ts` for provider name mappings.

---

## Development Conventions

### TypeScript Standards

1. **Strict Mode**: Enabled (`tsconfig.json`)
   - `strict: true`
   - `noUnusedLocals: true`
   - `noUnusedParameters: true`
   - `noFallthroughCasesInSwitch: true`

2. **Path Aliases**: Use `@/` for absolute imports
   ```typescript
   import { IOCType } from '@/types/ioc';
   import { detectIOCs } from '@/utils/ioc-detector';
   ```

3. **Type Definitions**:
   - All types defined in `src/types/`
   - Each provider has its own type file (e.g., `virustotal.ts`)
   - Shared types in `ioc.ts` and `messages.ts`

### Code Organization

1. **Service Implementation Pattern**:
   ```typescript
   // All services extend BaseToolService
   export class NewProviderService extends BaseToolService {
     get name(): string { return 'ProviderName'; }
     get supportedIOCTypes(): IOCType[] { return [...]; }

     async analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
       if (!this.supports(ioc.type)) {
         return this.createUnsupportedResult(ioc);
       }
       // Implementation
     }
   }
   ```

2. **Component Structure**:
   - React functional components with TypeScript
   - Props interfaces defined inline or in separate types file
   - Use React hooks (useState, useEffect, etc.)
   - Custom i18n hook: `useTranslation()`

3. **Message Passing** (Chrome Extension):
   ```typescript
   // All messages follow ExtensionMessage interface
   interface ExtensionMessage {
     type: MessageType;
     payload?: any;
   }

   // Send message from content script to background
   chrome.runtime.sendMessage({
     type: MessageType.ANALYZE_IOC,
     payload: { iocs }
   });
   ```

### Naming Conventions

1. **Files**:
   - React components: `PascalCase.tsx`
   - Services: `PascalCaseService.ts`
   - Utils/helpers: `kebab-case.ts`
   - Types: `lowercase.ts`

2. **Variables/Functions**:
   - `camelCase` for variables and functions
   - `PascalCase` for classes and React components
   - `UPPER_SNAKE_CASE` for constants

3. **Enums**:
   - `PascalCase` for enum names
   - `SCREAMING_SNAKE_CASE` for enum values
   ```typescript
   export enum IOCType {
     IPV4 = 'ipv4',
     DOMAIN = 'domain',
   }
   ```

### Git Workflow

1. **Branching**:
   - Feature branches: `claude/feature-description-{sessionId}`
   - Main branch for stable releases

2. **Commit Messages**:
   - Follow conventional commits format
   - Examples:
     - `feat: add new provider integration`
     - `fix: resolve API key validation issue`
     - `docs: update README with new features`
     - `refactor: optimize IOC detection algorithm`

3. **Versioning** (Semantic Versioning):
   - `MAJOR.MINOR.PATCH` format
   - MAJOR: Breaking changes (e.g., removing a provider)
   - MINOR: New features (e.g., adding a provider)
   - PATCH: Bug fixes and improvements
   - See `docs/VERSIONING.md` for details

---

## Development Workflow

### Getting Started

```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Type checking (without build)
npm run type-check

# Production build
npm run build

# Load extension in Chrome
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the 'dist' folder
```

### Build System

**Vite Configuration** (`vite.config.ts`):
- Uses `vite-plugin-web-extension` for Chrome extension support
- Path alias: `@` → `./src`
- Multiple entry points:
  - `src/pages/options/index.html`
  - `src/pages/sidepanel/index.html`
  - `src/pages/popup/index.html`
- Build output: `dist/`

### Adding a New Provider

**Step-by-step guide**:

1. **Create Type Definition** (`src/types/newprovider.ts`):
   ```typescript
   export interface NewProviderResponse {
     // Define API response structure
   }
   ```

2. **Create Service** (`src/services/tools/NewProviderService.ts`):
   ```typescript
   import { BaseToolService } from '../base/BaseToolService';

   export class NewProviderService extends BaseToolService {
     get name(): string { return 'NewProvider'; }
     get supportedIOCTypes(): IOCType[] {
       return [IOCType.IPV4, IOCType.DOMAIN];
     }

     async analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
       // Implementation
     }
   }
   ```

3. **Register in ServiceRegistry** (`src/services/ServiceRegistry.ts`):
   - Add to `APIProvider` enum in `src/types/ioc.ts`
   - Import service class
   - Add case in `initializeService()` switch statement

4. **Add Provider Mapping** (`src/utils/providerMappings.ts`):
   ```typescript
   export const SERVICE_NAME_TO_PROVIDER: Record<string, APIProvider> = {
     // ...
     'NewProvider': APIProvider.NEWPROVIDER,
   };
   ```

5. **Create Result Card Component** (`src/components/results/NewProviderResultCard.tsx`):
   - Display provider-specific analysis results
   - Follow existing card patterns
   - Support both light and dark modes

6. **Update i18n** (`src/i18n/locales/en/` and `/tr/`):
   - Add translations in `results.json`
   - Include provider name, descriptions, error messages

7. **Update Manifest** (`src/manifest.json`):
   - Add host permission if needed:
     ```json
     "host_permissions": [
       "https://api.newprovider.com/*"
     ]
     ```

8. **Test**:
   - Test API integration
   - Verify IOC type support
   - Check UI rendering
   - Test error handling

### Development Environment

**Environment Variables** (`src/utils/devApiKeys.ts`):
- Development API keys can be stored for testing
- Only initialized in development mode
- Never committed to repository

**Chrome Extension Debugging**:
- Background worker: `chrome://extensions` → "Inspect views: service worker"
- Side panel: Right-click panel → "Inspect"
- Content script: Regular page DevTools → check console
- Popup: Right-click extension icon → "Inspect popup"

---

## Key Files Reference

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, project metadata |
| `tsconfig.json` | TypeScript compiler configuration |
| `vite.config.ts` | Build system configuration |
| `src/manifest.json` | Chrome extension manifest (V3) |
| `src/i18n/config.ts` | i18n configuration |

### Core Logic

| File | Purpose |
|------|---------|
| `src/background/service-worker.ts` | Background orchestration, API calls |
| `src/content/content-script.tsx` | Page interaction, IOC detection trigger |
| `src/utils/ioc-detector.ts` | IOC pattern matching and detection |
| `src/services/ServiceRegistry.ts` | Provider service management |
| `src/services/api-service.ts` | API orchestration layer |
| `src/utils/apiKeyStorage.ts` | Secure API key storage |
| `src/utils/cacheManager.ts` | Result caching system |

### UI Components

| File | Purpose |
|------|---------|
| `src/components/FloatingButton.tsx` | Text selection analyze button |
| `src/components/ProviderStatusBadges.tsx` | Provider support indicators |
| `src/components/results/*.tsx` | Provider-specific result cards |

### Types

| File | Purpose |
|------|---------|
| `src/types/ioc.ts` | Core IOC and provider types |
| `src/types/messages.ts` | Chrome message passing types |
| `src/types/{provider}.ts` | Provider-specific API response types |

---

## Testing Guidelines

### Manual Testing Checklist

When adding features or providers:

1. **IOC Detection**:
   - Test all supported IOC types
   - Verify no false positives
   - Check overlap handling (e.g., URL containing domain)

2. **API Integration**:
   - Test with valid API keys
   - Test with invalid/missing API keys
   - Verify error handling
   - Check rate limit protection (for Shodan/GreyNoise)

3. **UI/UX**:
   - Test light and dark modes
   - Verify responsive design
   - Check all provider result cards
   - Test i18n (English and Turkish)

4. **Cache**:
   - Verify cache hits/misses
   - Test cache expiration
   - Check manual cache clearing

5. **Cross-browser**:
   - Chrome (primary target)
   - Edge (Chromium-based, should work)
   - Other Chromium-based browsers

### Performance Considerations

1. **Parallel Processing**: IOCs are analyzed in parallel across providers
2. **Lazy Initialization**: Services only created when needed
3. **Efficient Detection**: O(n) IOC detection algorithm
4. **Caching**: Configurable result caching (1-30 days)

---

## Common Patterns

### 1. Fetching with Timeout

```typescript
protected async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${this.config.timeout}ms`);
    }
    throw error;
  }
}
```

### 2. Error Result Creation

```typescript
protected createErrorResult(ioc: DetectedIOC, error: Error | string): IOCAnalysisResult {
  return {
    ioc,
    source: this.name,
    status: 'error',
    error: error instanceof Error ? error.message : error,
    timestamp: Date.now(),
  };
}
```

### 3. Status Determination

```typescript
protected determineStatus(malicious: number, suspicious: number, total: number): IOCAnalysisResult['status'] {
  if (total === 0) return 'unknown';
  if (malicious > 5) return 'malicious';
  if (malicious > 0 || suspicious > 0) return 'suspicious';
  return 'safe';
}
```

### 4. Message Passing

```typescript
// Sending a message
chrome.runtime.sendMessage({
  type: MessageType.ANALYZE_IOC,
  payload: { iocs }
}, (response) => {
  if (response.success) {
    // Handle success
  }
});

// Receiving a message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MessageType.ANALYZE_IOC) {
    handleAnalyzeIOC(message.payload.iocs)
      .then(response => sendResponse({ success: true, ...response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async response
  }
});
```

---

## Internationalization (i18n)

### Structure

```
src/i18n/
├── config.ts              # i18next configuration
├── types.ts               # i18n type definitions
├── hooks/
│   └── useTranslation.ts  # Custom translation hook
└── locales/
    ├── en/                # English translations
    │   ├── common.json
    │   ├── ioc.json
    │   ├── options.json
    │   ├── popup.json
    │   ├── results.json
    │   ├── sidepanel.json
    │   └── errors.json
    └── tr/                # Turkish translations
        └── (same structure)
```

### Usage

```typescript
import { useTranslation } from '@/i18n/hooks/useTranslation';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.title')}</h1>
      <p>{t('results.virustotal.title')}</p>
    </div>
  );
}
```

### Adding Translations

1. Add key-value pairs to relevant JSON files in both `en/` and `tr/`
2. Use dot notation for nested keys: `category.subcategory.key`
3. Keep consistent structure across languages

---

## Privacy & Security

### API Key Storage

- Stored using Chrome Storage API (encrypted by Chrome)
- Never transmitted except to authorized provider APIs
- Can be removed at any time by user

### Cache Management

- Configurable retention: 1-30 days (default: 7)
- Stored locally only
- Automatic cleanup
- Manual clear option

### Data Flow

1. User selects text → Content script detects IOCs
2. Content script sends IOCs to background via messages
3. Background worker makes secure HTTPS API calls
4. Results returned to side panel for display
5. No data sent to external servers (except provider APIs)

### Security Considerations

- All API requests use HTTPS only
- Content Security Policy compliant
- No analytics or telemetry
- No third-party tracking
- Open source for transparency

---

## Troubleshooting

### Common Issues

1. **Extension not loading**:
   - Ensure `npm run build` completed successfully
   - Check `dist/` folder exists
   - Verify manifest.json has no errors
   - Check Chrome console for errors

2. **API calls failing**:
   - Verify API key is correct
   - Check provider rate limits
   - Inspect network tab for HTTP errors
   - Check background service worker console

3. **IOC detection not working**:
   - Verify IOC format matches patterns
   - Check content script is injected (`chrome://extensions` → inspect content script)
   - Test with known-good IOCs

4. **Build errors**:
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run type-check`
   - Verify all dependencies are installed

### Debugging Tips

1. **Background Worker Console**: Essential for debugging API calls
2. **React DevTools**: Install extension for component debugging
3. **Chrome Storage Viewer**: Check stored API keys and cache
4. **Network Tab**: Monitor all API requests

---

## Resources

### Documentation

- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [React 18 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [i18next Documentation](https://www.i18next.com/)

### Project Files

- `README.md` - User-facing documentation
- `CHANGELOG.md` - Version history and release notes
- `docs/VERSIONING.md` - Versioning strategy
- `docs/PRIVACY.md` - Privacy policy (EN)
- `docs/PRIVACY_TR.md` - Privacy policy (TR)

### Provider API Documentation

- [VirusTotal API](https://developers.virustotal.com/reference/overview)
- [OTX AlienVault API](https://otx.alienvault.com/api)
- [AbuseIPDB API](https://docs.abuseipdb.com/)
- [MalwareBazaar API](https://bazaar.abuse.ch/api/)
- [ARIN WHOIS](https://www.arin.net/resources/registry/whois/rws/)
- [Shodan API](https://developer.shodan.io/api)
- [GreyNoise API](https://docs.greynoise.io/)
- [URLhaus API](https://urlhaus.abuse.ch/api/)
- [IBM X-Force API](https://api.xforce.ibmcloud.com/doc/)
- [Pulsedive API](https://pulsedive.com/api/)
- [Scamalytics API](https://scamalytics.com/api)

---

## AI Assistant Guidelines

### When Working on This Codebase

1. **Always check existing patterns** before implementing new features
2. **Follow the service architecture** when adding providers
3. **Update all relevant files** (types, i18n, manifest, registry)
4. **Test thoroughly** in both light and dark modes
5. **Update version numbers** consistently across:
   - `package.json`
   - `manifest.json`
   - `README.md` version badge
   - `CHANGELOG.md`

### Code Quality Standards

1. **No console.logs in production** (except strategic logging)
2. **Always handle errors gracefully**
3. **Provide informative error messages**
4. **Use TypeScript strictly** (no `any` types unless absolutely necessary)
5. **Write self-documenting code** with clear variable names
6. **Add comments for complex logic**

### Before Committing

1. Run `npm run type-check` to verify TypeScript
2. Run `npm run build` to ensure build succeeds
3. Test extension in Chrome
4. Update CHANGELOG.md if adding features
5. Verify all i18n keys are translated
6. Check that version numbers are synchronized

---

## Project Maintainability

### DRY Principles Applied

1. **Service Registry**: Single source of truth for all providers
2. **BaseToolService**: Common functionality inherited by all services
3. **Provider Mappings**: Centralized name-to-enum conversions
4. **Message Types**: Unified message passing interface

### Extensibility

The codebase is designed for easy extension:
- Adding providers: Follow the documented pattern
- Adding IOC types: Update enum and detection patterns
- Adding UI themes: CSS variables support customization
- Adding languages: Add locale folder and translations

### Technical Debt

Keep these areas maintainable:
1. **Type safety**: Maintain strict TypeScript usage
2. **API compatibility**: Monitor provider API changes
3. **Performance**: Watch for cache size growth
4. **Security**: Keep dependencies updated

---

## Version History Summary

- **v2.4.0** (2025-11-13): Added URLhaus, X-Force, Pulsedive, Scamalytics
- **v2.3.2** (2025-10-25): Enhanced UX with loading animations
- **v2.3.1** (2025-10-25): Added Chrome Web Store rating button
- **v2.3.0** (2025-10-21): Added GreyNoise with rate limit protection
- **v2.2.0** (2025-10-19): Added Shodan and ARIN WHOIS
- **v2.1.0** (2025-10-15): Added AbuseIPDB and MalwareBazaar
- **v2.0.0** (2025-10-10): Major rewrite with OTX, i18n, enhanced UI
- **v1.0.0** (2025-10-01): Initial release with VirusTotal

---

**Last Updated**: 2025-11-13 (v2.4.0)

This document should be updated whenever significant architectural changes are made to the codebase.
