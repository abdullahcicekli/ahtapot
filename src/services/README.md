# Services Architecture

This directory contains the modular service architecture for integrating various security tools.

## Structure

```
services/
├── base/
│   └── BaseToolService.ts       # Base class and interface for all tool services
├── tools/
│   ├── VirusTotalService.ts     # VirusTotal integration
│   ├── ShodanService.ts         # (Future) Shodan integration
│   ├── AbuseIPDBService.ts      # (Future) AbuseIPDB integration
│   └── ...                      # Other tool services
├── ServiceRegistry.ts           # Service registry and management
├── api-service.ts               # Main API service (facade)
└── README.md                    # This file
```

## Adding a New Tool Integration

### 1. Create Type Definitions

Create a new file in `src/types/` for the tool's API response types:

```typescript
// src/types/mytool.ts
export interface MyToolResponse {
  data: {
    // Define response structure
  };
}
```

### 2. Create Service Class

Create a new service file in `src/services/tools/`:

```typescript
// src/services/tools/MyToolService.ts
import { BaseToolService, ToolServiceConfig } from '../base/BaseToolService';
import { DetectedIOC, IOCAnalysisResult, IOCType } from '@/types/ioc';
import { MyToolResponse } from '@/types/mytool';

export class MyToolService extends BaseToolService {
  private readonly baseURL = 'https://api.mytool.com';

  constructor(config: ToolServiceConfig) {
    super(config);
  }

  get name(): string {
    return 'MyTool';
  }

  get supportedIOCTypes(): IOCType[] {
    return [IOCType.IPV4, IOCType.DOMAIN]; // Specify supported types
  }

  async analyze(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    if (!this.isConfigured()) {
      return this.createErrorResult(ioc, 'MyTool API key not configured');
    }

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}/analyze/${ioc.value}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: MyToolResponse = await response.json();

      // Process response and return result
      return {
        ioc,
        source: this.name,
        status: 'safe', // Determine from data
        details: {
          // Extract relevant details
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.createErrorResult(ioc, error instanceof Error ? error : 'Unknown error');
    }
  }
}
```

### 3. Register in ServiceRegistry

Add the new service to `ServiceRegistry.ts`:

```typescript
// In ServiceRegistry.ts, add to initializeService method:
case APIProvider.MYTOOL:
  this.services.set(
    provider,
    new MyToolService({
      apiKey,
      timeout: 30000,
    })
  );
  break;
```

### 4. Update Type Definitions

Add the provider to `src/types/ioc.ts` if needed:

```typescript
export enum APIProvider {
  // ... existing providers
  MYTOOL = 'mytool',
}
```

### 5. Update Service Name Mapping

Add mapping in `api-service.ts`:

```typescript
private findProviderForService(serviceName: string): APIProvider | null {
  const mapping: Record<string, APIProvider> = {
    // ... existing mappings
    'MyTool': APIProvider.MYTOOL,
  };
  return mapping[serviceName] || null;
}
```

## Usage Example

### Basic Usage

```typescript
import { APIService } from '@/services/api-service';
import { IOCType } from '@/types/ioc';

// Initialize with API keys
const apiService = new APIService({
  virustotal: 'your-vt-api-key',
  mytool: 'your-mytool-api-key',
});

// Analyze an IOC
const results = await apiService.analyzeIOC({
  type: IOCType.IPV4,
  value: '8.8.8.8',
});

console.log(results);
// [
//   { source: 'VirusTotal', status: 'safe', details: {...} },
//   { source: 'MyTool', status: 'safe', details: {...} }
// ]
```

### Advanced Usage with ServiceRegistry

```typescript
import { serviceRegistry } from '@/services/ServiceRegistry';
import { APIProvider, IOCType } from '@/types/ioc';

// Configure services
serviceRegistry.setAPIKey(APIProvider.VIRUSTOTAL, 'your-api-key');

// Get specific service
const vtService = serviceRegistry.getService(APIProvider.VIRUSTOTAL);

if (vtService) {
  const result = await vtService.analyze({
    type: IOCType.IPV4,
    value: '1.1.1.1',
  });

  console.log(result);
}

// Get all configured services
const services = serviceRegistry.getConfiguredServices();
console.log(`Configured: ${services.map(s => s.name).join(', ')}`);
```

## VirusTotal Integration

### Supported IOC Types

- IPv4 addresses
- IPv6 addresses
- Domains
- URLs
- File hashes (MD5, SHA1, SHA256)

### Example Response

```typescript
{
  ioc: { type: 'ipv4', value: '8.8.8.8' },
  source: 'VirusTotal',
  status: 'safe',
  details: {
    malicious: 0,
    suspicious: 0,
    harmless: 75,
    undetected: 20,
    total: 95,
    reputation: 1500,
    country: 'US',
    asn: 15169,
    as_owner: 'GOOGLE',
    network: '8.8.8.0/24',
    continent: 'NA',
    regional_internet_registry: 'ARIN',
    total_votes: { harmless: 100, malicious: 0 },
    tags: [],
    last_analysis_date: '2025-01-15T10:30:00.000Z'
  },
  timestamp: 1736936400000
}
```

## API Response Types

All services return `IOCAnalysisResult`:

```typescript
interface IOCAnalysisResult {
  ioc: DetectedIOC;              // The analyzed IOC
  source: string;                // Service name (e.g., 'VirusTotal')
  status: 'safe' | 'suspicious' | 'malicious' | 'unknown' | 'error';
  details?: Record<string, any>; // Service-specific details
  error?: string;                // Error message if status is 'error'
  timestamp: number;             // Unix timestamp
}
```

## Error Handling

All services implement consistent error handling:

1. **Configuration errors**: Returned as error results when API key is missing
2. **Network errors**: Caught and returned as error results with descriptive messages
3. **API errors**: HTTP error codes are caught and returned with status codes
4. **Timeout errors**: Requests timeout after 30 seconds (configurable)

## Rate Limiting

Each service can implement its own rate limiting in the configuration:

```typescript
new MyToolService({
  apiKey: 'key',
  rateLimit: {
    maxRequests: 4,
    perMilliseconds: 60000, // 4 requests per minute
  },
});
```

## Testing

Test individual services:

```typescript
import { VirusTotalService } from '@/services/tools/VirusTotalService';

const service = new VirusTotalService({
  apiKey: process.env.VT_API_KEY,
});

const result = await service.analyze({
  type: IOCType.IPV4,
  value: '8.8.8.8',
});

console.assert(result.status !== 'error');
console.assert(result.source === 'VirusTotal');
```

## Future Enhancements

- [ ] Implement caching layer to reduce API calls
- [ ] Add retry logic with exponential backoff
- [ ] Implement batch analysis optimization for services that support it
- [ ] Add telemetry and analytics
- [ ] Create service health monitoring
- [ ] Implement request queuing for rate limit management
