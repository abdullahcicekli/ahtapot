# Release Notes

## Version 2.0.0 (2025-01-XX)

### 🎉 Major Release - Complete Redesign

This is a major update with significant new features, improved user experience, and enhanced security analysis capabilities.

---

### ✨ New Features

#### 🔍 OTX AlienVault Integration
- **Comprehensive threat intelligence** from AlienVault's Open Threat Exchange
- **Pulse-based analysis** showing community-driven threat information
- **6 IOC types supported**: IPv4, IPv6, Domain, URL, File Hashes (MD5/SHA1/SHA256), CVE
- **Custom threat scoring** algorithm categorizing threats as Malicious, Suspicious, or Harmless
- **Rich threat context**: Malware families, targeted countries, adversary information, and tags
- **Pagination support**: View pulses 5 at a time with smooth navigation
- **10,000 requests/day** free tier (10 requests/second)

#### 🎯 Tab-Based Provider Results
- **Seamless provider switching** between VirusTotal and OTX AlienVault
- **Clean, minimal design** with bottom border active indicator
- **Smooth transitions** with 0.2s animation
- **Independent result viewing** - each provider's results in its own tab
- **Automatic tab selection** - first provider becomes active by default

#### ✅ Live API Key Validation
- **Test before save** - validate API keys with real endpoint requests
- **Visual feedback** - green checkmark for valid, red X for invalid keys
- **Error messages** - detailed validation errors for troubleshooting
- **10-second timeout** protection against hanging requests
- **Per-provider validation** - test VirusTotal and OTX independently

#### 💾 Smart Cache Management
- **Configurable retention** - store IOC results for 1-30 days (default: 5 days)
- **Daily bucket organization** - efficient storage with format `ahtapot_cache_YYYYMMDD`
- **Automatic cleanup** - old cache entries removed automatically
- **Cache statistics** - view total entries, size, oldest/newest dates
- **Manual clearing** - clear all cache with confirmation dialog
- **Enable/disable toggle** - turn caching on/off as needed

#### ⚡ Per-Field Save Operations
- **Individual save buttons** - save each API key independently
- **Real-time change detection** - save button appears only when field is modified
- **Loading indicators** - spinner during save operations
- **Success feedback** - "Saved successfully" message for 3 seconds
- **Error handling** - clear error messages if save fails

#### 🌍 Full Internationalization (i18n)
- **Complete Turkish translations** - every UI element translated
- **Complete English translations** - professional English interface
- **Language switcher** - easy switching in settings
- **Consistent terminology** - proper technical terms in both languages
- **Future-ready** - easy to add more languages

---

### 🔄 Changes

#### Provider Simplification
**Removed Providers:**
- ❌ Shodan (device intelligence)
- ❌ AbuseIPDB (IP reputation)
- ❌ URLScan.io (website scanning)
- ❌ Have I Been Pwned (email breaches)

**Active Providers:**
- ✅ **VirusTotal** - Malware & URL analysis (4 req/min free)
- ✅ **OTX AlienVault** - Threat intelligence & IOC pulses (10,000 req/day free)

**Rationale:** Focus on the two most comprehensive and reliable threat intelligence sources for IOC analysis. This simplifies the UI and improves performance while providing better threat intelligence coverage.

---

### 🎨 UI/UX Improvements

#### Results Display
- **Tab navigation** for provider results
- **Color-coded threat levels** for quick assessment
- **Improved card layouts** for better readability
- **Smooth animations** throughout the interface

#### Settings Page
- **Organized sections** - General Settings and API Keys tabs
- **Clear visual hierarchy** - better spacing and grouping
- **Responsive design** - works on all screen sizes
- **Professional styling** - dark theme optimization

#### Result Cards
- **VirusTotal Card**: Stats, detections, analysis summary
- **OTX Card**: Two tabs (Pulses & Details), pagination, threat scoring
- **Consistent styling** across all cards
- **Status icons** for quick threat identification

---

### 🔧 Technical Improvements

#### Architecture
- **Modular service architecture** - clean separation of concerns
- **ServiceRegistry pattern** - efficient service management
- **Type safety** - comprehensive TypeScript types for OTX
- **Error handling** - robust error management throughout

#### Performance
- **Parallel API requests** - VirusTotal and OTX called simultaneously
- **Efficient caching** - daily buckets for fast lookup and cleanup
- **Optimized rendering** - only active tab content rendered
- **Debounced operations** - prevent excessive API calls

#### Security
- **Secure storage** - API keys encrypted in Chrome storage
- **HTTPS only** - all API calls over secure connections
- **No tracking** - zero analytics or telemetry
- **Local processing** - all data stays on your device

---

### 📝 Updated Documentation

- **CHANGES.md** - Comprehensive change log with technical details
- **OTX_INTEGRATION.md** - Complete OTX AlienVault integration guide
- **README.md** - Updated with v2.0.0 features and API information
- **PRIVACY.md** - Privacy policy unchanged (no new data collection)
- **PRIVACY_TR.md** - Turkish privacy policy

---

### 🐛 Bug Fixes

- Fixed OTX results not displaying in sidepanel
- Fixed provider mapping missing for OTX in service workers
- Fixed first provider tab not auto-selecting
- Corrected all provider references in codebase

---

### 📦 Files Changed

**Created:**
- `src/types/otx.ts` - OTX type definitions
- `src/services/tools/OTXService.ts` - OTX service implementation
- `src/components/results/OTXResultCard.tsx` - OTX result card component
- `src/components/results/OTXResultCard.css` - OTX card styling
- `src/utils/apiValidator.ts` - API key validation utility
- `src/utils/cacheManager.ts` - Cache management utility
- `OTX_INTEGRATION.md` - OTX integration documentation
- `CHANGES.md` - Detailed change log
- `RELEASE_NOTES.md` - This file

**Modified:**
- `src/manifest.json` - Version 2.0.0, updated permissions and descriptions
- `package.json` - Version 2.0.0, updated description
- `src/pages/sidepanel/sidepanel.tsx` - Tab-based results, OTX rendering
- `src/pages/sidepanel/sidepanel.css` - Tab styling
- `src/pages/options/options.tsx` - Validation, per-field save, cache settings
- `src/pages/options/options.css` - New UI elements styling
- `src/services/ServiceRegistry.ts` - OTX service registration
- `src/services/api-service.ts` - OTX provider mapping
- `src/background/service-worker.ts` - OTX provider mapping
- `src/types/ioc.ts` - Updated APIProvider enum
- `src/i18n/locales/en/options.json` - English translations
- `src/i18n/locales/tr/options.json` - Turkish translations
- `README.md` - v2.0.0 features and updated API section

---

### 🚀 Upgrade Instructions

#### For Users
1. Extension will auto-update in Chrome
2. Visit Settings → API Keys
3. Add OTX AlienVault API key (get from [otx.alienvault.com/api](https://otx.alienvault.com/api))
4. Test API keys using "Validate" button
5. Save individually using "Save" buttons
6. Configure cache settings in General Settings tab

#### For Developers
1. Pull latest changes: `git pull origin main`
2. Install dependencies: `npm install`
3. Build extension: `npm run build`
4. Reload extension in Chrome: `chrome://extensions`
5. Test with sample IOCs to verify OTX integration

---

### 🔜 Roadmap (v2.1.0+)

Planned features for future releases:
- Additional IOC types support
- Export results to CSV/JSON
- Bulk IOC analysis
- Custom threat intelligence sources
- Advanced filtering and search
- Historical analysis comparison
- Browser notifications for high-risk IOCs

---

### 📞 Support & Feedback

- **GitHub Issues:** [Report bugs or request features](https://github.com/yourusername/ahtapot-extension/issues)
- **Discussions:** [Community Q&A and discussions](https://github.com/yourusername/ahtapot-extension/discussions)
- **Privacy Questions:** See [PRIVACY.md](PRIVACY.md)

---

### 🙏 Acknowledgments

Special thanks to:
- **AlienVault OTX** for providing free threat intelligence API
- **VirusTotal** for comprehensive malware analysis
- The cybersecurity community for feedback and suggestions
- All beta testers who helped improve this release

---

**Made with ❤️ for the cybersecurity community**

[⬅️ Back to README](README.md) | [📋 View Full Changelog](CHANGES.md)
