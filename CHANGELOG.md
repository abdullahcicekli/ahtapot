# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
