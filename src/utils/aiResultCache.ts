/**
 * AI Result Cache Utility
 * Caches AI analysis results to avoid duplicate queries
 * Cache key format: {provider}-{ioc}-{mode}-{language}
 */

import { AIAnalysisResult, AIProvider, AIAnalysisMode } from '@/types/ai';
import { storage } from '@/platform';

const CACHE_KEY_PREFIX = 'ahtapot_ai_cache_';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedAIResult {
  result: AIAnalysisResult;
  timestamp: number;
  expiresAt: number;
}

/**
 * Generate cache key for AI result
 */
export function generateCacheKey(
  provider: AIProvider,
  iocValue: string,
  mode: AIAnalysisMode,
  language: string
): string {
  // Normalize IOC value (lowercase for case-insensitive matching)
  const normalizedIOC = iocValue.toLowerCase().trim();
  return `${CACHE_KEY_PREFIX}${provider}_${normalizedIOC}_${mode}_${language}`;
}

/**
 * Get cached AI result
 */
export async function getCachedAIResult(
  provider: AIProvider,
  iocValue: string,
  mode: AIAnalysisMode,
  language: string
): Promise<AIAnalysisResult | null> {
  try {
    const key = generateCacheKey(provider, iocValue, mode, language);
    const result = await storage.local.get(key) as Record<string, CachedAIResult | undefined>;

    const cached = result[key];
    if (cached) {
      // Check if expired
      if (Date.now() > cached.expiresAt) {
        // Remove expired cache
        await storage.local.remove(key);
        return null;
      }

      return cached.result;
    }

    return null;
  } catch (error) {
    console.error('Error reading AI cache:', error);
    return null;
  }
}

/**
 * Save AI result to cache
 */
export async function cacheAIResult(
  provider: AIProvider,
  iocValue: string,
  mode: AIAnalysisMode,
  language: string,
  result: AIAnalysisResult
): Promise<void> {
  try {
    // Don't cache error results
    if (result.error) {
      return;
    }
    
    const key = generateCacheKey(provider, iocValue, mode, language);
    const now = Date.now();
    
    const cachedData: CachedAIResult = {
      result,
      timestamp: now,
      expiresAt: now + CACHE_EXPIRY_MS,
    };
    
    await storage.local.set({ [key]: cachedData });
  } catch (error) {
    console.error('Error saving AI cache:', error);
  }
}

/**
 * Clear cached result for specific IOC
 */
export async function clearCachedAIResult(
  provider: AIProvider,
  iocValue: string,
  mode: AIAnalysisMode,
  language: string
): Promise<void> {
  try {
    const key = generateCacheKey(provider, iocValue, mode, language);
    await storage.local.remove(key);
  } catch (error) {
    console.error('Error clearing AI cache:', error);
  }
}

/**
 * Clear all AI cache
 */
export async function clearAllAICache(): Promise<void> {
  try {
    const allData = await storage.local.get(null);
    const keysToRemove = Object.keys(allData).filter(key => 
      key.startsWith(CACHE_KEY_PREFIX)
    );
    
    if (keysToRemove.length > 0) {
      await storage.local.remove(keysToRemove);
    }
  } catch (error) {
    console.error('Error clearing all AI cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getAICacheStats(): Promise<{
  totalEntries: number;
  totalSize: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}> {
  try {
    const allData = await storage.local.get(null);
    const cacheEntries = Object.entries(allData).filter(([key]) => 
      key.startsWith(CACHE_KEY_PREFIX)
    );
    
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;
    let totalSize = 0;
    
    cacheEntries.forEach(([_, value]) => {
      const cached = value as CachedAIResult;
      totalSize += JSON.stringify(cached).length;
      
      if (oldestEntry === null || cached.timestamp < oldestEntry) {
        oldestEntry = cached.timestamp;
      }
      if (newestEntry === null || cached.timestamp > newestEntry) {
        newestEntry = cached.timestamp;
      }
    });
    
    return {
      totalEntries: cacheEntries.length,
      totalSize,
      oldestEntry,
      newestEntry,
    };
  } catch (error) {
    console.error('Error getting AI cache stats:', error);
    return {
      totalEntries: 0,
      totalSize: 0,
      oldestEntry: null,
      newestEntry: null,
    };
  }
}

/**
 * Clean expired cache entries
 */
export async function cleanExpiredAICache(): Promise<number> {
  try {
    const allData = await storage.local.get(null);
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    Object.entries(allData).forEach(([key, value]) => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        const cached = value as CachedAIResult;
        if (now > cached.expiresAt) {
          keysToRemove.push(key);
        }
      }
    });
    
    if (keysToRemove.length > 0) {
      await storage.local.remove(keysToRemove);
    }
    
    return keysToRemove.length;
  } catch (error) {
    console.error('Error cleaning expired AI cache:', error);
    return 0;
  }
}

