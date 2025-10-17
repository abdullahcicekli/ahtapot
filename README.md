<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/ahtapot-logo-white.png">
  <source media="(prefers-color-scheme: light)" srcset="public/ahtapot-logo-black.png">
  <img alt="Ahtapot Logo" src="public/ahtapot-logo-black.png" width="200">
</picture>

# Ahtapot - IOC Analysis Extension

**Fast and secure analysis of Indicators of Compromise (IOC) directly in your browser**

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue?style=flat-square&logo=google-chrome)](https://chrome.google.com)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-brightgreen?style=flat-square)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Privacy](#-privacy) • [Development](#-development) • [API Keys](#-api-keys)

</div>

---

## 🆕 What's New in v2.0.0

### Major Updates
- ✨ **OTX AlienVault Integration** - Comprehensive threat intelligence with pulse-based analysis
- 🔍 **AbuseIPDB Integration** - IP reputation analysis with abuse confidence scoring
- 🎯 **Smart Provider Support** - See which providers support each IOC type before analysis
- 🎨 **Enhanced Tab Navigation** - Seamless switching between provider results with improved UX
- 📊 **Provider Support Indicators** - Badge-based display showing compatible providers for each IOC
- ✅ **Live API Validation** - Test and validate API keys before saving
- 💾 **Smart Cache Management** - Configurable retention periods with detailed statistics
- 🌍 **Full i18n Support** - Complete Turkish and English translations
- ⚡ **Per-Field Save** - Individual save buttons for each API provider

### Provider Changes
- ❌ **Removed**: Shodan, URLScan.io, Have I Been Pwned
- ✅ **Active**: VirusTotal, OTX AlienVault, AbuseIPDB
- 🎯 **Optimized API Usage** - Only sends requests to providers that support the analyzed IOC type

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

### 🎯 **Smart Provider Matching**
- **Real-time Support Detection** - Each IOC shows compatible providers via badges
- **Optimized API Calls** - Only queries providers that support the IOC type
- **No Wasted Requests** - Saves API rate limits by skipping unsupported types
- **Clear Messaging** - Informative explanations when providers don't support an IOC type

### 🎨 **Modern & Intuitive Interface**
- Google Translate-style floating button
- **Tab-based provider results** - Switch between VirusTotal, OTX AlienVault, and AbuseIPDB seamlessly
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
- ✅ Read our [Privacy Policy](PRIVACY.md) | [Gizlilik Politikası (TR)](PRIVACY_TR.md)

---

## 📦 Installation

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
- [English Version](PRIVACY.md)
- [Türkçe Versiyon](PRIVACY_TR.md)

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

### Project Structure

```
ahtapot-extension/
├── src/
│   ├── background/          # Service worker & API management
│   │   └── service-worker.ts
│   ├── content/            # Content scripts & page interaction
│   │   ├── content-script.tsx
│   │   └── content-script.css
│   ├── components/         # React components
│   │   └── FloatingButton.tsx
│   ├── pages/
│   │   ├── popup/          # Extension popup
│   │   ├── options/        # Settings page
│   │   └── sidepanel/      # Analysis panel
│   ├── services/           # API service layer
│   │   └── api-service.ts
│   ├── utils/              # Utility functions
│   │   └── ioc-detector.ts # IOC detection logic
│   ├── types/              # TypeScript type definitions
│   │   ├── ioc.ts
│   │   └── messages.ts
│   └── manifest.json       # Extension manifest
├── public/                 # Static assets
│   ├── icons/             # Extension icons
│   └── ahtapot-logo-*.png # Brand assets
├── dist/                   # Build output (generated)
└── README.md
```

### Development Commands

```bash
# Install dependencies
npm install

# Build for development
npm run build

# Build with watch mode
npm run build -- --watch

# Type checking
npx tsc --noEmit

# Production build
npm run build
```

### Building from Source

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Load `dist` folder in Chrome
5. Test on various websites

---

## 🔑 API Keys

Get free API keys to unlock full analysis capabilities:

### VirusTotal (Required)
- **Purpose:** Malware, file, URL, IP, and domain analysis
- **Free Tier:** 4 requests per minute
- **Supported IOCs:** IPv4, IPv6, Domain, URL, File Hashes (MD5, SHA1, SHA256)
- **Get Key:** [virustotal.com/gui/join-us](https://www.virustotal.com/gui/join-us)
- **Features:**
  - Real-time malware scanning
  - Comprehensive threat analysis
  - Detection statistics from 70+ antivirus engines

### OTX AlienVault (Required)
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

### AbuseIPDB (Optional)
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

> **Privacy Note:** All API keys are stored locally in Chrome's secure storage. They never leave your device except when making API calls to the respective services.
>
> **Live Validation:** Test your API keys directly in the settings page before saving to ensure they work correctly.
>
> **Smart Optimization:** Extension automatically detects which providers support each IOC type and only makes necessary API calls, saving your rate limits.

---

## 🏗️ Architecture

### Security Design

```
┌─────────────────────────────────────────────────────┐
│                   Web Page                          │
│  ┌───────────────────────────────────────────────┐  │
│  │         Content Script (Isolated)             │  │
│  │  - IOC Detection                              │  │
│  │  - Floating Button UI                         │  │
│  │  - No API Key Access                          │  │
│  └────────────────┬──────────────────────────────┘  │
└───────────────────┼──────────────────────────────────┘
                    │ Message Passing
                    ▼
┌─────────────────────────────────────────────────────┐
│         Background Service Worker                   │
│  - API Key Storage (Encrypted)                      │
│  - Secure API Calls                                 │
│  - Rate Limiting                                    │
│  - Error Handling                                   │
└─────────────────────────────────────────────────────┘
```

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

### Code Style

- Use TypeScript for type safety
- Follow existing code patterns
- Add comments for complex logic
- Update README for new features
- Test thoroughly before submitting

---

## 🐛 Troubleshooting

### Floating Button Not Appearing

- ✓ Ensure you're selecting valid IOC text
- ✓ Check browser console for errors
- ✓ Reload the extension
- ✓ Verify content script is injected

### API Results Not Showing

- ✓ Verify API keys are correctly entered
- ✓ Check if you've exceeded rate limits
- ✓ Review network tab for API call errors
- ✓ Ensure stable internet connection

### Extension Not Loading

- ✓ Run `npm run build` first
- ✓ Verify `dist` folder exists
- ✓ Check Chrome console for errors
- ✓ Try restarting Chrome

### Build Errors

- ✓ Ensure Node.js 18+ is installed
- ✓ Delete `node_modules` and reinstall
- ✓ Clear build cache: `rm -rf dist`
- ✓ Check TypeScript errors: `npx tsc --noEmit`

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Acknowledgments

- Built with modern web technologies
- Inspired by the cybersecurity community
- Icons from [Lucide](https://lucide.dev)
- Designed for security professionals

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/ahtapot-extension/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/ahtapot-extension/discussions)
- **Privacy Questions:** See [Privacy Policy](PRIVACY.md)
- **Security Vulnerabilities:** Please report security issues privately via GitHub Security tab

---

<div align="center">

**Made with ❤️ for the cybersecurity community**

⭐ Star this repo if you find it useful!

[Report Bug](https://github.com/yourusername/ahtapot-extension/issues) · [Request Feature](https://github.com/yourusername/ahtapot-extension/issues)

</div>
