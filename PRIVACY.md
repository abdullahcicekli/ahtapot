# Privacy Policy for Ahtapot Security Extension

**Last Updated:** October 15, 2025

[Türkçe versiyonu için tıklayın / Click here for Turkish version](./PRIVACY_TR.md)

## Overview
Ahtapot Security Extension is committed to protecting your privacy. This extension analyzes cybersecurity indicators (IOCs) using third-party security APIs to help security professionals assess potential threats.

## Data Collection and Storage

### What We Store Locally
All data is stored **exclusively on your local device** using Chrome's secure storage API. We do not have any servers, and no data is transmitted to us.

1. **API Keys**
   - Your API keys for security services (VirusTotal, Shodan, AbuseIPDB, URLScan.io, Have I Been Pwned)
   - Stored securely in Chrome's local storage
   - Never transmitted to our servers (we don't have any)
   - Only used to authenticate with respective security services

2. **Cached Analysis Results**
   - Previously analyzed IOCs (IP addresses, domains, URLs, file hashes, email addresses)
   - Cached to avoid redundant API calls and respect rate limits
   - Automatically deleted based on user-configured retention period
   - Improves performance and reduces API usage

3. **User Preferences**
   - Language preference (English/Turkish)
   - Cache retention period (user-configurable)
   - Extension settings and configurations

### Cache Retention and Management
- **User Control**: You configure how long cached IOC results are retained
- **Automatic Cleanup**: Data older than the configured threshold is automatically deleted
- **Default Period**: 7 days (adjustable by user)
- **Manual Clearing**: You can clear the cache manually at any time from settings
- **Configurable Threshold**: Set retention period from 1 to 30 days

## Data We Do NOT Collect

We want to be crystal clear about what we **DO NOT** do:

- ❌ We do NOT collect any personal information
- ❌ We do NOT track your browsing history beyond selected text analysis
- ❌ We do NOT transmit any data to our servers (we don't operate any servers)
- ❌ We do NOT sell or share your data with anyone
- ❌ We do NOT use analytics or tracking services
- ❌ We do NOT display advertisements
- ❌ We do NOT monitor your activity

## How the Extension Works

1. **User-Initiated Analysis**: You select text or right-click on a webpage
2. **Local Processing**: The extension extracts IOCs (IP addresses, domains, etc.) locally
3. **API Requests**: Using YOUR API keys, requests are sent directly to security services
4. **Results Display**: Analysis results are displayed in the side panel
5. **Optional Caching**: Results are cached locally if you enable this feature

## Third-Party Security Services

When you analyze IOCs, the extension sends requests **directly** to third-party security APIs using your API keys. We act as a client only:

### Services Supported
- **VirusTotal** - File, URL, and IP address analysis
- **Shodan** - IP address and network device analysis
- **AbuseIPDB** - IP address abuse detection
- **URLScan.io** - URL and website analysis
- **Have I Been Pwned** - Email data breach check

### Third-Party Privacy Policies
Each service has its own privacy policy and data handling practices. We strongly recommend reviewing their policies:

- [VirusTotal Privacy Policy](https://support.virustotal.com/hc/en-us/articles/115002168385-Privacy-Policy)
- [Shodan Privacy Policy](https://account.shodan.io/privacy)
- [AbuseIPDB Privacy Policy](https://www.abuseipdb.com/privacy)
- [URLScan Privacy Policy](https://urlscan.io/about/#privacy)
- [Have I Been Pwned Privacy Policy](https://haveibeenpwned.com/Privacy)

**Important**: We do not control these services. Data you send to them is subject to their privacy policies, not ours.

## Your Control and Rights

You have **complete control** over your data:

### Data Management
- ✅ **View**: See what API keys are configured
- ✅ **Modify**: Change or update API keys anytime
- ✅ **Delete**: Remove API keys from settings
- ✅ **Clear Cache**: Delete all cached IOC results instantly
- ✅ **Configure Retention**: Set how long cache is kept (1-30 days)
- ✅ **Export**: No export needed - all data stays on your device

### Complete Removal
Uninstalling the extension automatically removes:
- All API keys
- All cached data
- All user preferences
- All extension data

No data remains after uninstallation.

## Data Security

We take security seriously:

- 🔒 **Secure Storage**: API keys stored using Chrome's secure storage API
- 🔒 **Encrypted Communication**: All API requests use HTTPS
- 🔒 **No Transmission**: No data sent to our servers (we don't have any)
- 🔒 **Local Processing**: All IOC extraction happens on your device
- 🔒 **No Tracking**: No analytics, no tracking, no telemetry
- 🔒 **Open Source**: Code is available for review (when published)

## Permissions Explained

The extension requires the following Chrome permissions:

### storage
- **Purpose**: Store API keys and cache IOC results locally
- **Scope**: Local device only
- **Access**: Extension only

### contextMenus
- **Purpose**: Add "Analyze IOCs" option to right-click menu
- **Scope**: Right-click menu only
- **Access**: User-initiated only

### activeTab
- **Purpose**: Read selected text when user clicks "Analyze IOCs"
- **Scope**: Current tab only, when user explicitly triggers analysis
- **Access**: User-initiated only

### sidePanel
- **Purpose**: Display analysis results in a side panel
- **Scope**: Extension UI only
- **Access**: User-initiated only

**No broad permissions**: We do not request access to all websites or browsing history.

## Children's Privacy

This extension is designed for security professionals and is not intended for children under 13. We do not knowingly collect information from children.

## International Users

This extension can be used worldwide. All data processing happens locally on your device, regardless of your location.

## Changes to Privacy Policy

We may update this privacy policy to reflect changes in:
- Extension functionality
- Legal requirements
- Best practices

**Notification**: Changes will be posted on this page with an updated "Last Updated" date. Significant changes will be highlighted in extension update notes.

**Version History**: Available on our [GitHub repository](https://github.com/YOUR_USERNAME/ahtapot-extension).

## Data Breach Notification

Since we don't collect or store any user data on servers, there is no risk of a data breach on our end. Your data security depends on:
1. Chrome's security (your local storage)
2. Third-party security services you use

If you suspect your API keys are compromised, revoke them immediately through the respective service providers.

## Compliance

### GDPR Compliance (EU Users)
- **Data Controller**: You are the data controller (data stays on your device)
- **Data Processor**: Third-party security services process your API requests
- **Right to Access**: Access your data anytime in extension settings
- **Right to Erasure**: Delete data anytime or uninstall extension
- **Right to Portability**: Data stays on your device
- **Data Minimization**: We only store what's necessary

### CCPA Compliance (California Users)
- **No Sale of Data**: We do not sell personal information
- **No Sharing**: We do not share personal information
- **Access Rights**: You can access all your data in settings
- **Deletion Rights**: You can delete all data anytime

## Contact and Support

### Questions About Privacy
For privacy-related questions, please:
- Open an issue on our [GitHub repository](https://github.com/YOUR_USERNAME/ahtapot-extension/issues)
- Label it with "privacy" tag
- We typically respond within 48 hours

### Security Concerns
If you discover a security vulnerability:
- **DO NOT** post it publicly
- Email: [your-email@example.com] (if you want to provide one)
- Or use GitHub's private security reporting feature

### General Support
For general questions and support:
- Check our [FAQ](https://github.com/YOUR_USERNAME/ahtapot-extension#faq)
- Open a GitHub issue
- Review documentation

## Transparency Commitment

We believe in complete transparency:

- 🔓 **Open Source**: Code will be published on GitHub (when ready)
- 🔓 **No Hidden Features**: All functionality is documented
- 🔓 **No Telemetry**: Zero tracking or analytics
- 🔓 **Clear Communication**: Privacy policy in plain language
- 🔓 **User Control**: You decide what to store and for how long

## Third-Party Links

This extension may provide links to third-party websites (API documentation, service homepages). We are not responsible for the privacy practices of these websites. Review their privacy policies independently.

## Legal Basis for Processing (GDPR)

If you are in the EU, our legal basis for processing is:
- **Consent**: You provide API keys voluntarily
- **Legitimate Interest**: Caching improves performance and respects API limits
- **Contract**: Using the extension constitutes acceptance of these terms

You can withdraw consent anytime by removing API keys or uninstalling the extension.

## Your Acceptance

By using Ahtapot Security Extension, you acknowledge that you have read and understood this privacy policy and agree to its terms.

---

**Summary**: We don't collect your data. Everything stays on your device. You're in control.

For the complete source code and updates, visit our [GitHub repository](https://github.com/YOUR_USERNAME/ahtapot-extension).

---

*This privacy policy is effective as of October 15, 2025, and will remain in effect except with respect to any changes in its provisions in the future, which will be in effect immediately after being posted on this page.*
