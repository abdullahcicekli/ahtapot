<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/ahtapot-logo-white.png">
  <source media="(prefers-color-scheme: light)" srcset="public/ahtapot-logo-black.png">
  <img alt="Ahtapot Logo" src="public/ahtapot-logo-black.png" width="200">
</picture>

# Ahtapot - IOC Analysis Extension

**Fast and secure analysis of Indicators of Compromise (IOC) directly in your browser**

[![Website](https://img.shields.io/badge/Website-ahtapot.me-purple?style=flat-square&logo=google-chrome)](https://ahtapot.me)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue?style=flat-square&logo=google-chrome)](https://chromewebstore.google.com/detail/ahtapot-ioc-analysis-tool/gmekhigahdiddngdhfdkeefcomcankpg)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.5.0-brightgreen?style=flat-square)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

[🌐 Website](https://ahtapot.me) • [Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Privacy](#-privacy) • [Development](#-development) • [API Keys](#-api-keys) • [Versioning](#-versioning)

</div>

---

## 🆕 What's New in v2.5.0

### Latest Release (November 13, 2025)
- 🎯 **Customizable Provider Order** - Drag-and-drop reordering of providers in settings
- 📊 **Personalized Results Display** - Analysis results appear in your custom provider order
- 💾 **Persistent Preferences** - Your provider order is saved and synced automatically
- 🔄 **Easy Reset** - One-click reset to default alphabetical order
- 🌍 **Full i18n Support** - Complete English and Turkish translations for the new feature

### Active Threat Intelligence Providers
- ✅ **VirusTotal** • **OTX AlienVault** • **AbuseIPDB** • **MalwareBazaar** • **ARIN** • **Shodan** • **GreyNoise**
- 🎯 **Smart API Usage** - Only queries providers supporting the IOC type
- ⚠️ **Rate Limit Protection** - Confirmation system for GreyNoise and Shodan
- 🆓 **No API Key Required** - ARIN WHOIS (always available)

📜 **[View Complete Changelog](CHANGELOG.md)** - Full version history and detailed release notes

---

## 🎯 Features

### 🔍 **Intelligent IOC Detection**
Automatically detects and analyzes various types of security indicators:

<table>
  <tr>
    <td><strong>🌐 Network</strong></td>
    <td>IPv4/IPv6 addresses, Domains, URLs</td>
  </tr>
  <tr>
    <td><strong>🔐 Hashes</strong></td>
    <td>MD5, SHA1, SHA256 file hashes</td>
  </tr>
  <tr>
    <td><strong>📧 Identity</strong></td>
    <td>Email addresses, CVE numbers</td>
  </tr>
  <tr>
    <td><strong>💰 Crypto</strong></td>
    <td>Bitcoin, Ethereum addresses</td>
  </tr>
</table>

### ⚡ **Lightning Fast Workflow**
1. Select any text on any webpage
2. Floating button appears instantly
3. One-click analysis
4. Results in beautiful side panel

### 🛡️ **Multiple Threat Intelligence Sources**

| Service | Purpose | Rate Limit |
|---------|---------|------------|
| **VirusTotal** | Malware & URL scanning | 4 req/min (free) |
| **OTX AlienVault** | Threat intelligence & IOC pulses | 10,000 req/day |
| **AbuseIPDB** | IP reputation & abuse reports | 1,000 req/day (free) |
| **MalwareBazaar** | Malware hash database & sample repository | No strict limit (free) |
| **ARIN** | IP WHOIS & network registration | 15 req/min (no key required) |
| **Shodan** | Device search & vulnerability scanning | 100 results/month (free) ⚠️ |
| **GreyNoise** | Internet noise detection & classification | 50 searches/week (free) ⚠️ |

**⚠️** = Rate-limited providers with confirmation system to protect your quota

### 🎯 **Smart Provider Matching**
- **Real-time Support Detection** - Each IOC shows compatible providers via badges
- **Optimized API Calls** - Only queries providers that support the IOC type
- **No Wasted Requests** - Saves API rate limits by skipping unsupported types
- **Clear Messaging** - Informative explanations when providers don't support an IOC type

### 🎨 **Modern & Intuitive Interface**
- Google Translate-style floating button
- **Tab-based provider results** - Switch between all providers seamlessly (VirusTotal, OTX, AbuseIPDB, MalwareBazaar, ARIN, Shodan, GreyNoise)
- **Provider support badges** - See which providers support each IOC at a glance
- **Informative empty states** - Clear explanations when providers don't support an IOC type
- Clean, professional design
- Dark mode optimized
- Smooth animations
- Non-intrusive UX

### 🔒 **Privacy First**
- ✅ All API keys stored locally on your device
- ✅ No data collection or tracking
- ✅ Secure HTTPS connections only
- ✅ Optional caching with configurable retention
- ✅ Open source and transparent
- ✅ Content Security Policy compliant
- ✅ Read our [Privacy Policy](docs/PRIVACY.md) | [Gizlilik Politikası (TR)](docs/PRIVACY_TR.md)

---

## 📦 Installation

> 🌐 **Visit our website:** [ahtapot.me](https://ahtapot.me) for detailed installation guides and documentation

### From Chrome Web Store (Recommended)

**The easiest way to install Ahtapot:**

1. Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/ahtapot-ioc-analysis-tool/gmekhigahdiddngdhfdkeefcomcankpg)
2. Click "Add to Chrome"
3. Confirm the permissions
4. Start analyzing IOCs!

### From Source

```bash
# Clone the repository
git clone https://github.com/yourusername/ahtapot-extension.git
cd ahtapot-extension

# Install dependencies
npm install

# Build the extension
npm run build
```

### Load in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" (top-right corner)
3. Click "Load unpacked"
4. Select the `dist` folder from the project directory

---

## 🔒 Privacy

We take your privacy seriously. Here's what you need to know:

### What We Store (Locally Only)
- ✅ **API Keys**: Stored securely on your device using Chrome's encrypted storage
- ✅ **Cached Results**: Previously analyzed IOCs (optional, user-configurable retention period)
- ✅ **User Preferences**: Language selection and settings

### What We DON'T Do
- ❌ **No Tracking**: Zero analytics or telemetry
- ❌ **No Servers**: We don't operate any servers
- ❌ **No Data Transmission**: Nothing leaves your device except API calls to security services
- ❌ **No Sale of Data**: Your data is yours, period
- ❌ **No Third-Party Sharing**: Only you and the security APIs you configure

### Cache Management
- Configure how long analyzed IOCs are kept (1-30 days, default: 7 days)
- Automatic cleanup of old cached data
- Manual cache clearing anytime
- All cached data stored locally only

### Full Privacy Policy
📄 **Read the complete privacy policy:**
- [English Version](docs/PRIVACY.md)
- [Türkçe Versiyon](docs/PRIVACY_TR.md)

---

## 🚀 Usage

### Quick Start Guide

#### 1️⃣ Configure Settings
- Click the Ahtapot extension icon → Settings
- **General Settings Tab:**
  - Choose your language (English/Türkçe)
  - Configure cache retention period (optional)
- **API Keys Tab:**
  - Add your API keys for enhanced analysis
  - See [API Keys section](#-api-keys) for how to obtain them

#### 2️⃣ Analyze IOCs
Choose your preferred method:

**Method A: Text Selection**
```
1. Select text containing IOCs on any webpage
2. Floating button appears automatically
3. Click "Analyze" button
4. View results in side panel
```

**Method B: Context Menu**
```
1. Select text with IOCs
2. Right-click → "Analyze with Ahtapot"
3. Results appear in side panel
```

**Method C: Manual Entry**
```
1. Click extension icon → Open side panel
2. Paste IOCs into text area
3. Click "Detect IOCs" → "Analyze"
```

#### 3️⃣ Interpret Results

Results are color-coded for quick threat assessment:

- 🟢 **Safe** - No threats detected
- 🟡 **Suspicious** - Potential threat, investigate further
- 🔴 **Malicious** - Confirmed threat, take action
- ⚪ **Unknown** - Insufficient data for assessment

---

## 🔍 Supported IOC Types

| Type | Example | Pattern |
|------|---------|---------|
| **IPv4** | `192.168.1.1` | `0-255.0-255.0-255.0-255` |
| **IPv6** | `2001:0db8:85a3::8a2e:0370:7334` | Full/compressed |
| **Domain** | `example.com` | Valid TLD required |
| **URL** | `https://example.com/path` | HTTP/HTTPS |
| **MD5** | `d41d8cd98f00b204e9800998ecf8427e` | 32 hex chars |
| **SHA1** | `da39a3ee5e6b4b0d3255bfef95601890afd80709` | 40 hex chars |
| **SHA256** | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 64 hex chars |
| **Email** | `user@example.com` | RFC 5322 |
| **CVE** | `CVE-2021-44228` | CVE-YYYY-NNNNN |
| **Bitcoin** | `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` | Base58/Bech32 |
| **Ethereum** | `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb` | 0x + 40 hex |

---

## 🛠️ Development

### Prerequisites

- Node.js 18+ and npm
- Chrome browser
- TypeScript knowledge (recommended)

### Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Styling:** CSS3 with CSS Variables
- **Icons:** Lucide React
- **Extension:** Manifest V3
- **Storage:** Chrome Storage API

### Building from Source

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Load `dist` folder in Chrome
5. Test on various websites

---

## 🔑 API Keys

Get free API keys to unlock full analysis capabilities:

### VirusTotal
- **Purpose:** Malware, file, URL, IP, and domain analysis
- **Free Tier:** 4 requests per minute
- **Supported IOCs:** IPv4, IPv6, Domain, URL, File Hashes (MD5, SHA1, SHA256)
- **Get Key:** [virustotal.com/gui/join-us](https://www.virustotal.com/gui/join-us)
- **Features:**
  - Real-time malware scanning
  - Comprehensive threat analysis
  - Detection statistics from 70+ antivirus engines

### OTX AlienVault
- **Purpose:** Threat intelligence and IOC pulse analysis
- **Free Tier:** 10,000 requests per day (10 req/sec)
- **Supported IOCs:** IPv4, IPv6, Domain, URL, File Hashes (MD5, SHA1, SHA256), CVE
- **Get Key:** [otx.alienvault.com/api](https://otx.alienvault.com/api)
- **Features:**
  - Community-driven threat intelligence
  - Pulse-based threat information
  - Malware family identification
  - Targeted countries and adversary information
  - Custom threat scoring algorithm

### AbuseIPDB
- **Purpose:** IP address reputation and abuse confidence scoring
- **Free Tier:** 1,000 requests per day
- **Supported IOCs:** IPv4, IPv6 only
- **Get Key:** [abuseipdb.com/register](https://www.abuseipdb.com/register)
- **Features:**
  - Abuse confidence scoring (0-100%)
  - Detailed abuse reports and categories
  - Geographic and network information
  - ISP and usage type detection
  - Community-reported abuse data

### MalwareBazaar
- **Purpose:** Malware sample database and hash reputation lookup
- **Free Tier:** No API key required, no strict rate limits
- **Supported IOCs:** File Hashes (MD5, SHA1, SHA256) only
- **Documentation:** [bazaar.abuse.ch/api](https://bazaar.abuse.ch/api/)
- **Features:**
  - Malware sample information and metadata
  - File type and signature detection
  - Malware family classification
  - Submission date and first seen information
  - Community-driven malware intelligence
  - No authentication required for basic lookups

### ARIN
- **Purpose:** IP address WHOIS and network registration information
- **Free Tier:** No API key required (public read-only access)
- **Supported IOCs:** IPv4, IPv6 only
- **Documentation:** [arin.net/resources/registry/whois/rws](https://www.arin.net/resources/registry/whois/rws/)
- **Features:**
  - Network registration details
  - Organization information
  - IP address allocation ranges
  - CIDR notation and network blocks
  - Registration and update dates
  - Parent network relationships
  - Always available without configuration

### Shodan
- **Purpose:** Internet-connected device search and vulnerability analysis
- **Free Tier:** 100 results per month (⚠️ rate-limited with confirmation)
- **Supported IOCs:** IPv4, IPv6, Domain
- **Get Key:** Visit [developer.shodan.io/api](https://developer.shodan.io/api) → Click "Show API Key" (top right)
- **Features:**
  - Open port and service detection
  - CVE vulnerability identification
  - Device banners and service versions
  - Geographic location data
  - ISP and organization information
  - Historical scan data
  - Subdomain discovery for domains

### GreyNoise
- **Purpose:** Internet-wide noise detection and threat classification
- **Free Tier:** 50 searches per week (⚠️ rate-limited with confirmation, combined with Visualizer usage)
- **Supported IOCs:** IPv4 only
- **Get Key:** [viz.greynoise.io/account/details](https://viz.greynoise.io/account/details)
- **Features:**
  - Internet scanner detection (mass scanning vs targeted)
  - RIOT (Rule It Out) - benign service identification
  - Classification (malicious, benign, unknown)
  - Actor information and tags
  - Last seen timestamps
  - Metadata about scanning activity

> **Privacy Note:** All API keys are stored locally in Chrome's secure storage. They never leave your device except when making API calls to the respective services.
>
> **Rate Limit Protection:** GreyNoise and Shodan require user confirmation before consuming your limited quota. You can choose to analyze or skip these providers for each request.
>
> **Live Validation:** Test your API keys directly in the settings page before saving to ensure they work correctly.
>
> **Smart Optimization:** Extension automatically detects which providers support each IOC type and only makes necessary API calls, saving your rate limits.

---

### Data Flow

1. User selects text → Content script detects IOCs
2. Content script sends IOCs to background via messages
3. Background worker makes secure API calls
4. Results returned to side panel for display
5. No sensitive data stored permanently

---

## 🤝 Contributing

Contributions are welcome! This project is actively maintained.

### How to Contribute

1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. Push to your branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

- **Website:** [ahtapot.me](https://ahtapot.me)
- **Chrome Web Store:** [Install Extension](https://chromewebstore.google.com/detail/ahtapot-ioc-analysis-tool/gmekhigahdiddngdhfdkeefcomcankpg)
- **Issues:** [GitHub Issues](https://github.com/abdullahcicekli/ahtapot/issues)
- **Discussions:** [GitHub Discussions](https://github.com/abdullahcicekli/ahtapot/discussions)
- **Privacy Questions:** See [Privacy Policy](docs/PRIVACY.md)
- **Security Vulnerabilities:** Please report security issues privately via GitHub Security tab

---

## 📋 Versioning

This project follows [Semantic Versioning 2.0.0](https://semver.org/) (SemVer).

**Version Format:** `MAJOR.MINOR.PATCH`

- **MAJOR** - Backward-incompatible changes (e.g., removing a provider)
- **MINOR** - New features, backward compatible (e.g., adding a provider)
- **PATCH** - Bug fixes and minor improvements

For detailed information:

📚 **[VERSIONING.md](docs/VERSIONING.md)** - Complete versioning strategy and contributor guidelines
📜 **[CHANGELOG.md](CHANGELOG.md)** - Full version history and release notes

**Current Version:** 2.3.1

---

<div align="center">

**Made with ❤️ for the cybersecurity community**

⭐ Star this repo if you find it useful!

[🌐 Website](https://ahtapot.me) • [Chrome Web Store](https://chromewebstore.google.com/detail/ahtapot-ioc-analysis-tool/gmekhigahdiddngdhfdkeefcomcankpg) • [Report Bug](https://github.com/abdullahcicekli/ahtapot/issues) • [Request Feature](https://github.com/abdullahcicekli/ahtapot/issues)

</div>
