# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.8.0] - 2025-12-03

### Added
- **Structured AI JSON Responses** - AI now returns structured JSON with fixed schemas for each analysis mode
  - Summary mode: Verdict, risk level, confidence, key signals, recommended action
  - Analysis mode: Provider analysis table, consensus, MITRE ATT&CK mapping, actionable recommendations
  - Detailed mode: Full investigation report with threat intel, infrastructure, false positive analysis
- **AI Result Caching System** - Intelligent caching to avoid duplicate queries
  - Cache key format: `{provider}-{ioc}-{mode}-{language}`
  - Language-aware caching (TR results cached separately from EN)
  - 24-hour cache expiry with automatic cleanup
  - "Re-analyze" button to force fresh analysis
- **Enhanced AI Result UI** - Completely redesigned AI result cards
  - Localized verdict labels (Malicious → Kötü Amaçlı)
  - Localized risk levels (Critical → Kritik, High → Yüksek)
  - Localized confidence levels (High → Yüksek güven)
  - Color-coded confidence badges (green=high, yellow=medium, red=low)
- **Copy as Markdown** - AI responses include hidden `copy_markdown` field
  - Beautiful markdown export for documentation
  - One-click copy to clipboard
- **Export as Image** - Export AI analysis as PNG image
  - html2canvas integration
  - Full card capture with styling
- **Clickable Links in AI Results** - URLs are truncated and clickable
  - Max 50 characters with ellipsis
  - Opens in new tab
- **Suggestive Tone** - AI recommendations now use suggestive language
  - "You should consider..." instead of "Do this immediately"
  - More professional and advisory tone

### Changed
- **Full Localization** - All AI UI elements now properly localized
  - Verdict labels (Malicious, Suspicious, Likely Benign, Clean, Unknown)
  - Risk levels (Critical, High, Medium, Low, Info)
  - Confidence levels (High, Medium, Low)
  - Section headers (Summary, Key Signals, Assessment, etc.)
  - Button labels (Copy as Markdown, Re-analyze, Export as Image)
- **Confidence Badge Colors** - Fixed color logic
  - HIGH confidence = Green (reliable result)
  - MEDIUM confidence = Yellow/Orange (moderate reliability)
  - LOW confidence = Red (uncertain result)
- **Provider Analysis Cards** - Improved styling with inline confidence colors
- **Turkish Translations** - Full Turkish character support (Ö, Ü, İ, Ş, Ç, Ğ)

### Fixed
- "high güven" → "Yüksek güven" - Proper Turkish localization
- Mixed language labels in AI results
- Inverted confidence badge colors in provider analysis
- Long URLs causing layout overflow

### Technical
- New `AIStructuredResultCard` component with JSON parsing
- `aiResultCache.ts` utility for cache management
- Updated `aiResponse.ts` types with `copy_markdown` field
- Enhanced prompt templates with JSON schema requirements
- Added `getConfidenceConfig()`, `getRiskLabel()`, `getConfidenceLabel()` helpers

## [2.7.0] - 2025-12-03

### Added
- **Provider Enable/Disable Configuration System** - Centralized control for provider availability
  - New `PROVIDER_ENABLED_STATUS` config in `providerDisplay.ts`
  - `isProviderEnabled()`, `getEnabledProviders()`, `getDisabledProviders()` utility functions
  - Easy toggle to enable/disable providers without code changes across multiple files
- **Dynamic Provider Filtering** - All UI components now respect provider enabled status
  - ServiceRegistry skips disabled providers
  - Options page hides disabled providers from API key settings
  - ProviderSlider and sidepanel filter out disabled providers
  - Provider order storage filters disabled providers

### Changed
- **Scamalytics Integration Temporarily Disabled** - Pending API activation confirmation
  - Scamalytics hidden from all UI components
  - No API calls made to Scamalytics service
  - Will be re-enabled once API access is confirmed
- Updated ahtapot.me website to reflect 9 active providers
- Provider count updated from 10 to 9 across all documentation and UI text

### Technical
- Enhanced `providerDisplay.ts` with provider enable/disable configuration
- Updated `ServiceRegistry.ts` to check `isProviderEnabled()` before service initialization
- Modified `providerOrderStorage.ts` to filter disabled providers from order lists
- Updated `options.tsx` to only show enabled providers in API key settings

## [2.6.0] - 2025-12-02

### Added
- **Enhanced Provider Result Cards** - Completely redesigned Pulsedive, URLhaus, and Scamalytics result cards
  - Modern UI matching VirusTotal/ARIN/OTX design language
  - Rich data display with all API response fields
  - Stats grids, threat indicators, and detailed sections
- **Scamalytics API v3 Integration** - Full implementation with correct endpoint format
  - Support for single API key and username:key formats
  - Fraud score, risk level, ISP score display
  - Proxy detection (VPN, Datacenter, Tor, iCloud Private Relay)
  - External blacklist status
- **Rate-Limited Provider Badges** - Shodan and GreyNoise now visible in provider badges when pending confirmation
- **URL-based Tab Management** - Settings page tabs now controllable via URL parameter (?tab=apiKeys)
- **Environment Variables Example** - Added `.env.example` file for development setup

### Changed
- **Pulsedive Result Card** - Complete redesign with:
  - Risk indicator with color-coded circle
  - Location, organization, and timestamp sections
  - Threats, risk factors, and feeds display
  - Consistent styling with other provider cards
- **URLhaus Result Card** - Complete redesign with:
  - URL count stats circle with active/offline breakdown
  - Stats grid (URL Count, Active, Offline, Blacklists)
  - Threat tags and sample URLs with status indicators
  - Blacklist status display (Spamhaus DBL, SURBL)
- **Scamalytics Result Card** - Complete redesign with:
  - Fraud score circle with risk color
  - Stats grid (Score, Risk Level, ISP Score, Blacklisted)
  - Fraud indicators section
  - Proxy detection details
- Updated Scamalytics info notes with accurate registration process
- Improved Turkish and English translations for all new features

### Fixed
- Scamalytics API endpoint format (now supports multiple authentication methods)
- Provider status badges now show pending rate-limited providers
- Result card theme compatibility issues

### Removed
- **IBM X-Force Exchange Integration** - Temporarily removed due to API key creation issues (will be re-added when clarified)

### Technical
- Added dedicated CSS files for Pulsedive, URLhaus, and Scamalytics result cards
- Enhanced ScamalyticsService with auto-detection of API key format
- Updated type definitions for Scamalytics API v3 response
- Centralized version display from manifest.json

## [2.5.0] - 2025-11-13

### Added
- **Customizable Provider Display Order** - New drag-and-drop interface in General Settings
  - Reorder providers according to personal preference
  - Visual drag handles with smooth animations
  - Real-time order preview with numbered indicators
  - One-click reset to default alphabetical order
- **Persistent Provider Ordering** - Custom order saved to Chrome storage
  - Automatic synchronization across extension components
  - Results display respects custom provider order
  - Default alphabetical sorting for new installations
- **Provider Order Storage System** - New utility module for order management
  - `providerOrderStorage.ts` with complete CRUD operations
  - Automatic handling of new providers added in future updates
  - Smart sorting algorithm for results based on custom order
- **Enhanced General Settings UI** - New section with modern design
  - Drag-and-drop provider list with visual feedback
  - Hover effects and drag-over animations
  - Color-coded numbering system
  - Responsive layout optimized for settings page

### Changed
- Results in sidepanel now appear in user-defined provider order
- Provider tabs maintain custom ordering for better UX consistency
- Complete i18n support for English and Turkish
  - General Settings > Provider Display Order section
  - Drag hints, reset confirmation, and success messages
- Version bumped to 2.5.0 (MINOR update - new feature)
  - Updated in package.json, manifest.json, and i18n footer

### Technical
- Added `src/utils/providerOrderStorage.ts` utility module
- Enhanced options page with drag-and-drop event handlers
- Implemented `sortResultsByProviderOrder()` helper function
- Added CSS animations for drag states (dragging, drag-over)
- Provider order state management in both options and sidepanel components

## [2.4.0] - 2025-11-13

### Added
- **URLhaus Integration** - Malicious URL and malware distribution database by abuse.ch
  - Unlimited free API access with account
  - URL status monitoring (online/offline/unknown)
  - Payload and threat classification
  - Malware distribution tracking
  - Supports: URL, Domain, IPv4, IPv6, MD5, SHA256
- **IBM X-Force Exchange Integration** - Enterprise threat intelligence platform
  - Free tier: 5,000 requests/month
  - Risk scoring system (1-10 scale)
  - Historical threat data and trends
  - Malware family identification
  - Category classification
  - Supports: IP, Domain, URL, MD5, SHA1, SHA256
- **Pulsedive Integration** - Threat intelligence with IOC enrichment
  - Free tier: 250 requests/day (2,500/month)
  - Risk level assessment (none/low/medium/high/critical)
  - Threat feed tracking
  - Risk factor analysis
  - Community-driven intelligence
  - Supports: IP, Domain, URL, MD5, SHA1, SHA256
- **Scamalytics Integration** - IP fraud detection and scam prevention
  - Free tier: 5,000 requests/month
  - Fraud score (0-100)
  - Risk level classification (very low to very high)
  - Fraud indicator tracking
  - Supports: IPv4, IPv6
- Provider display order configuration system with default sorting
- Custom result cards for all new providers with provider-specific UI
- Comprehensive i18n support (EN & TR) for all new integrations

### Changed
- Enhanced API key validation with support for new authentication methods (Basic Auth, Bearer Token)
- Improved provider status badges with all 11 providers
- Updated provider mappings and service registry
- Version updated across all locations (package.json, manifest.json, i18n footer)

### Technical
- Added TypeScript type definitions for all new providers
- Created 4 new service implementations following BaseToolService pattern
- Implemented provider-specific result card components
- Enhanced API validator with multiple authentication methods
- Updated ServiceRegistry with lazy initialization for new providers

## [2.3.2] - 2025-10-25

### Added
- Custom Ahtapot logo loading spinner with vertical rotation animation
- Enhanced provider-specific "no results" card with better UX/UI design
- Searched IOCs display in no-results state for better user feedback
- Informative empty state cards with color-coded sections (orange for issues, blue for supported types)

### Fixed
- OTX adversaries and industries object mapping issues
- Vertical layout gap during IOC analysis - replaced with custom loading spinner
- AbuseIPDB Overview tab section ordering (Abuse Categories now appears before Location & Network)

### Changed
- OTX threat summary section now collapsible (default closed) for cleaner UI
- Improved i18n coverage for provider no-results messages
- Enhanced loading state visual feedback with branded animation
- Better user communication about unsupported IOC types per provider

## [2.3.1] - 2025-10-25

### Added
- Chrome Web Store "Rate Us" button in popup menu for easy user reviews
- Dynamic version display system - version automatically synced from manifest.json
- Comprehensive version synchronization guidelines in VERSIONING.md

### Fixed
- AbuseIPDB provider card theme styling issues
- Popup footer text to accurately reflect extension usage methods
- Version display inconsistencies across UI components

### Changed
- Enhanced documentation structure with dedicated CHANGELOG.md

## [2.3.0] - 2025-10-21

### Added
- **GreyNoise Integration** - Internet-wide noise detection and threat classification
- Rate limit protection system with user confirmation prompts
- Smart provider confirmations for GreyNoise (50 searches/week) and Shodan (100 results/month)
- User control over rate-limited API usage

### Changed
- Complete i18n localization for new features in English and Turkish
- Enhanced provider management with quota protection

## [2.2.0] - 2025-10-19

### Added
- **Shodan Integration** - Internet-connected device search and vulnerability analysis
  - Open port and service detection
  - CVE vulnerability identification
  - Device banners and service versions
  - Geographic location and ISP data
  - Historical scan data
  - Subdomain discovery for domains
- **ARIN WHOIS Integration** - IP address registration and network information
  - Network registration details
  - Organization information
  - IP allocation ranges and CIDR notation
  - Registration and update dates
  - No API key required (public access)

### Changed
- Enhanced network analysis capabilities with multiple authoritative sources
- Expanded IOC coverage for IPv4, IPv6, and Domain types

## [2.1.0] - 2025-10-15

### Added
- **AbuseIPDB Integration** - IP reputation analysis
  - Abuse confidence scoring (0-100%)
  - Detailed abuse reports and categories
  - Geographic and network information
  - ISP and usage type detection
  - Community-reported abuse data
- **MalwareBazaar Integration** - Malware hash database
  - Malware sample information and metadata
  - File type and signature detection
  - Malware family classification
  - No API key required for basic lookups

### Changed
- Optimized API usage to only query providers supporting the IOC type
- Enhanced provider support indicators with badge-based display

## [2.0.0] - 2025-10-10

### Added
- **OTX AlienVault Integration** - Comprehensive threat intelligence
  - Community-driven threat intelligence with pulse-based analysis
  - Malware family identification
  - Targeted countries and adversary information
  - Custom threat scoring algorithm
- Enhanced tab navigation system for seamless provider switching
- Live API validation - test keys before saving
- Smart cache management with configurable retention periods (1-30 days)
- Per-field save buttons for each API provider
- Provider support indicators showing compatible providers per IOC
- Full internationalization (i18n) support with Turkish and English

### Changed
- Major UI/UX overhaul with improved tab-based navigation
- Enhanced settings page with live validation
- Improved cache management with detailed statistics

### Breaking Changes
- Restructured settings storage format (migration automatic)
- New tab-based result display system

## [1.0.0] - 2025-10-01

### Added
- Initial release with VirusTotal integration
- IOC detection for IPv4, IPv6, Domain, URL, File Hashes (MD5, SHA1, SHA256)
- Google Translate-style floating button for text selection
- Side panel for result display
- Context menu integration
- Chrome Storage API for secure API key storage
- Basic caching system
- Dark mode optimized UI

### Security
- All API keys stored locally with Chrome's encrypted storage
- HTTPS-only connections
- Content Security Policy compliant
- No data collection or tracking

---

## Version History Summary

- **2.8.x** - AI structured JSON responses, caching, full localization, export features
- **2.7.x** - Provider enable/disable config system, Scamalytics re-enabled
- **2.6.x** - Enhanced provider cards (Pulsedive, URLhaus, Scamalytics), X-Force removal, UI improvements
- **2.5.x** - Customizable provider display order, drag-and-drop reordering
- **2.4.x** - URLhaus, Pulsedive, Scamalytics integrations
- **2.3.x** - UX enhancements, rate limit protection, GreyNoise integration
- **2.2.x** - Shodan and ARIN WHOIS integrations, enhanced network analysis
- **2.1.x** - AbuseIPDB and MalwareBazaar integrations
- **2.0.x** - Major rewrite with OTX AlienVault, enhanced UI/UX, i18n support
- **1.0.x** - Initial release with VirusTotal

---

## Upgrade Notes

### Upgrading to 2.3.x
- No breaking changes
- New GreyNoise and enhanced Shodan features require API keys
- Rate limit confirmations are automatic for protected providers

### Upgrading to 2.2.x
- No breaking changes
- ARIN WHOIS works without API key configuration
- Shodan requires API key for full functionality

### Upgrading to 2.1.x
- No breaking changes
- New providers require API keys for enhanced analysis

### Upgrading to 2.0.0
- Settings will be automatically migrated
- Review new provider settings in options page
- Configure cache retention period if desired
- Test API keys with new live validation feature
