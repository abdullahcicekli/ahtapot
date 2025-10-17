# AbuseIPDB Integration Documentation

## Overview

This document provides comprehensive information about the AbuseIPDB integration into the Ahtapot Chrome Extension for IOC (Indicator of Compromise) analysis.

## Integration Summary

**Service**: AbuseIPDB IP Reputation Database
**API Version**: v2
**Documentation**: https://docs.abuseipdb.com/
**Integration Date**: October 2025
**Status**: ✅ Complete and Functional

## What is AbuseIPDB?

AbuseIPDB is a project dedicated to helping combat the spread of hackers, spammers, and abusive activity on the internet. It provides a centralized database for IP addresses that have been reported for malicious activity, offering IP reputation scores based on community reports.

## API Features & Limitations

### Free Tier Limits
- **Daily Checks**: 1,000 requests per day
- **Supported Operations**: Check endpoint only
- **Report Window**: Last 90 days of abuse reports
- **Rate Limiting**: Enforced via HTTP 429 responses
- **Authentication**: API key via `Key` header

### Premium Tiers
- **Basic Plan**: 10,000 daily checks ($25/month)
- **Premium Plan**: 50,000 daily checks ($99/month)
- **Features**: Blacklist downloads, IP range checks, extended history

## Files Created/Modified

### New Files

1. **src/types/abuseipdb.ts**
   - TypeScript type definitions for AbuseIPDB API
   - Category enums (23 abuse categories)
   - Request/response interfaces
   - Analysis statistics types

2. **src/services/tools/AbuseIPDBService.ts**
   - Main service implementation
   - Extends BaseToolService for consistency
   - Implements IP reputation checking
   - Handles rate limiting and error responses
   - Supports IPv4 and IPv6 addresses

3. **src/components/results/AbuseIPDBResultCard.tsx**
   - React component for displaying AbuseIPDB results
   - Three-tab interface: Overview, Reports, Details
   - Abuse confidence score visualization
   - Geographic and network information display
   - Recent abuse reports with pagination

4. **src/components/results/AbuseIPDBResultCard.css**
   - Comprehensive styling for result card
   - Responsive design for mobile/desktop
   - Color-coded threat levels
   - Smooth animations and transitions

### Modified Files

1. **src/types/ioc.ts**
   - Added `ABUSEIPDB` to `APIProvider` enum

2. **src/services/ServiceRegistry.ts**
   - Imported AbuseIPDBService
   - Added service initialization for ABUSEIPDB provider
   - Integrated into service registry pattern

3. **src/services/api-service.ts**
   - Added AbuseIPDB to provider-service name mapping
   - Enables automatic API selection for IP addresses

4. **src/components/ProviderStatusBadges.tsx**
   - Added AbuseIPDB label to provider labels mapping
   - Status badge now displays for AbuseIPDB operations

5. **src/pages/sidepanel/sidepanel.tsx**
   - Imported AbuseIPDBResultCard component
   - Added conditional rendering for AbuseIPDB results
   - Integrated into provider tab system

6. **src/utils/apiValidator.ts**
   - Added AbuseIPDB test endpoint configuration
   - Enables API key validation during setup

## Implementation Details

### Architecture Pattern

The integration follows the existing service architecture:

```
BaseToolService (Abstract)
    ↓
AbuseIPDBService (Concrete Implementation)
    ↓
ServiceRegistry (Registration)
    ↓
APIService (Orchestration)
    ↓
SidePanel UI (Display)
```

### Service Class Structure

```typescript
class AbuseIPDBService extends BaseToolService {
  // Configuration
  baseURL: 'https://api.abuseipdb.com/api/v2'
  maxAgeInDays: 90

  // Core Methods
  analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult>
  checkIP(ioc: DetectedIOC): Promise<IOCAnalysisResult>

  // Helper Methods
  calculateStats(data: AbuseIPDBCheckResponse): Stats
  determineStatusFromScore(score: number, isWhitelisted: boolean): Status
}
```

### API Request Flow

1. User inputs IP address
2. IOC detection identifies IPv4/IPv6
3. ServiceRegistry initializes AbuseIPDBService
4. Service makes GET request to `/check` endpoint
5. Response parsed and statistics calculated
6. Results cached (if enabled)
7. UI component renders formatted results

### Request Example

```http
GET /api/v2/check?ipAddress=8.8.8.8&maxAgeInDays=90&verbose
Host: api.abuseipdb.com
Key: YOUR_API_KEY
Accept: application/json
```

### Response Processing

The service processes the following data:
- **Abuse Confidence Score** (0-100%)
- **Total Reports** (lifetime count)
- **Distinct Reporters** (unique users)
- **IP Information** (version, ISP, domain, hostnames)
- **Geographic Data** (country, location)
- **Abuse Categories** (port scan, hacking, brute force, etc.)
- **Recent Reports** (last 90 days with details)
- **Special Flags** (Tor exit node, whitelisted)

### Threat Classification

The service uses abuse confidence score thresholds:

- **0-25%**: Clean (Safe)
- **26-75%**: Suspicious (Caution)
- **76-100%**: Malicious (High Risk)
- **Whitelisted**: Always Safe (override)

## UI Components

### Result Card Features

**Overview Tab**:
- Abuse confidence score with circular progress indicator
- Color-coded threat level (green/yellow/red)
- Key metrics: reports, reporters, last reported date
- Geographic information: country, ISP, domain
- Abuse category tags

**Reports Tab**:
- Recent abuse reports (last 90 days)
- Report timestamp and reporter country
- Comment/description of abuse
- Category labels for each report
- Pagination for multiple reports

**Details Tab**:
- Complete IP information (version, public/private)
- Whitelisted status
- Tor exit node detection
- Associated hostnames
- Link to full AbuseIPDB report

### Visual Design

- **Responsive Layout**: Works on all screen sizes
- **Color Coding**:
  - Green: Safe/Clean (confidence < 26%)
  - Yellow: Suspicious (26-75%)
  - Red: Malicious (> 75%)
  - Blue: Whitelisted
- **Icons**: Lucide React icons for consistency
- **Animations**: Smooth fade-in transitions
- **Typography**: Clear hierarchy with Monaco font for IP addresses

## Configuration

### API Key Setup

1. Navigate to Options page (chrome extension settings)
2. Add AbuseIPDB API key in "API Keys" section
3. Key is validated automatically
4. Saved securely in Chrome storage

### Getting an API Key

1. Visit https://www.abuseipdb.com/
2. Create free account
3. Navigate to API section
4. Generate API key (v2)
5. Copy key to extension settings

## Caching Strategy

AbuseIPDB results are cached using the existing cache manager:

- **Cache Key**: `${serviceName}:${iocType}:${iocValue}`
- **Default TTL**: 24 hours (configurable)
- **Storage**: Chrome local storage
- **Benefits**: Reduces API calls, faster responses, respects rate limits

## Error Handling

The service handles multiple error scenarios:

1. **No API Key**: Returns error result, prompts configuration
2. **Invalid API Key**: Validation fails, shows error message
3. **Rate Limit (429)**: Returns error with retry-after information
4. **Network Timeout**: 30-second timeout with clear error
5. **Unsupported IOC**: Only IP addresses supported, clear error message
6. **Malformed Response**: JSON parsing errors handled gracefully

## Security Considerations

- **API Key Storage**: Stored in Chrome local storage (encrypted by browser)
- **HTTPS Only**: All API requests use TLS encryption
- **Header Authentication**: API key sent in header (not URL)
- **No Logging**: API keys never logged to console
- **Permission Model**: Extension requests only necessary permissions

## Testing

### Manual Testing Checklist

- [x] Service initialization
- [x] API key validation
- [x] IPv4 address analysis
- [x] IPv6 address analysis
- [x] Clean IP display (low score)
- [x] Suspicious IP display (medium score)
- [x] Malicious IP display (high score)
- [x] Whitelisted IP handling
- [x] Tor exit node detection
- [x] Report pagination
- [x] Cache functionality
- [x] Error handling (no key, invalid key, rate limit)
- [x] UI responsiveness
- [x] Provider status badge
- [x] TypeScript compilation
- [x] Production build

### Test IP Addresses

**Clean IPs** (for testing):
- `8.8.8.8` (Google DNS)
- `1.1.1.1` (Cloudflare DNS)

**Known Malicious IPs** (for testing):
- Check AbuseIPDB database for current examples
- Use IP addresses with high abuse confidence scores

## Performance Considerations

### Optimization Strategies

1. **Caching**: Reduces redundant API calls
2. **Parallel Requests**: Multiple providers analyzed simultaneously
3. **Lazy Loading**: Results rendered only when tab is active
4. **Pagination**: Large report lists split into pages
5. **Timeout Handling**: 30-second timeout prevents hanging

### Bundle Size Impact

- **Types**: ~2KB (minified)
- **Service**: ~8KB (minified)
- **Component**: ~15KB (minified)
- **CSS**: ~8KB (minified)
- **Total Addition**: ~33KB to bundle

## Future Enhancements

### Potential Improvements

1. **Bulk Check Support**: Analyze multiple IPs in single request (requires premium)
2. **Historical Data**: Chart abuse score over time
3. **Geographic Visualization**: Map of reporter countries
4. **Category Filtering**: Filter reports by abuse category
5. **Export Functionality**: Download reports as CSV/JSON
6. **Notification System**: Alert for high-confidence malicious IPs
7. **Custom Thresholds**: User-configurable score thresholds
8. **Report Submission**: Allow users to report abuse (requires separate flow)

### Known Limitations

1. **IP Addresses Only**: Does not support domains, URLs, hashes
2. **Rate Limits**: Free tier limited to 1,000 daily checks
3. **Report Window**: Only 90 days of historical data
4. **No Bulk Operations**: Each IP requires separate request
5. **Language**: API responses in English only

## Troubleshooting

### Common Issues

**Issue**: No results displayed
- Check API key is configured
- Verify IOC is IPv4 or IPv6 address
- Check browser console for errors

**Issue**: Rate limit errors
- Wait for rate limit reset (check Retry-After header)
- Consider upgrading to paid tier
- Enable caching to reduce API calls

**Issue**: Validation fails
- Verify API key is correct (copy from AbuseIPDB dashboard)
- Check API key has not expired
- Ensure network connectivity

**Issue**: UI not updating
- Clear browser cache
- Reload extension
- Check sidepanel is open

## API Reference

### Check Endpoint

**Endpoint**: `GET /api/v2/check`

**Parameters**:
- `ipAddress` (required): IPv4 or IPv6 address
- `maxAgeInDays` (optional): Report window (default: 90, max: 365)
- `verbose` (optional): Include detailed reports

**Response**:
```json
{
  "data": {
    "ipAddress": "8.8.8.8",
    "isPublic": true,
    "ipVersion": 4,
    "isWhitelisted": false,
    "abuseConfidenceScore": 0,
    "countryCode": "US",
    "usageType": "Data Center/Web Hosting/Transit",
    "isp": "Google LLC",
    "domain": "google.com",
    "hostnames": ["dns.google"],
    "isTor": false,
    "totalReports": 0,
    "numDistinctUsers": 0,
    "lastReportedAt": null,
    "reports": []
  }
}
```

### Rate Limit Headers

- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp for reset
- `Retry-After`: Seconds to wait (on 429 error)

## Resources

### Official Documentation
- **API Docs**: https://docs.abuseipdb.com/
- **Category Reference**: https://www.abuseipdb.com/categories
- **Pricing**: https://www.abuseipdb.com/pricing
- **API Dashboard**: https://www.abuseipdb.com/account/api

### Related Files
- **Service Implementation**: `/src/services/tools/AbuseIPDBService.ts`
- **Type Definitions**: `/src/types/abuseipdb.ts`
- **UI Component**: `/src/components/results/AbuseIPDBResultCard.tsx`
- **Styles**: `/src/components/results/AbuseIPDBResultCard.css`

## Support

For issues related to:
- **Extension Integration**: Check GitHub issues
- **API Questions**: Contact AbuseIPDB support
- **Rate Limits**: Upgrade plan or enable caching
- **Bug Reports**: Submit with console logs and screenshots

## Changelog

### v1.0.0 (October 2025)
- Initial AbuseIPDB integration
- IPv4 and IPv6 support
- Three-tab result display
- Abuse confidence scoring
- Report pagination
- Cache support
- API key validation
- Responsive UI design

---

**Integration Status**: ✅ Complete
**Build Status**: ✅ Passing
**Test Coverage**: ✅ Manual tests passed
**Production Ready**: ✅ Yes
