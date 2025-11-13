/**
 * Scamalytics API Response Types
 * Based on https://scamalytics.com/ip/api
 */

/**
 * IP fraud score response
 */
export interface ScamalyticsResponse {
  ip: string;
  score: number; // 0-100, higher = more risky
  risk: 'very high' | 'high' | 'medium' | 'low' | 'very low';
  entries?: Array<{
    type: string;
    value: string;
    description?: string;
  }>;
}

/**
 * Error response
 */
export interface ScamalyticsErrorResponse {
  error?: string;
  message?: string;
}
