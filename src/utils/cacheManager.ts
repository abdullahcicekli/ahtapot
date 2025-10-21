import { IOCAnalysisResult } from '@/types/ioc';

export interface CacheSettings {
  retentionDays: number;
  enabled: boolean;
}

export interface CacheEntry {
  ioc: string;
  type: string;
  provider: string;
  result: IOCAnalysisResult;
  cachedAt: number;
}

export interface DailyCacheData {
  [iocKey: string]: CacheEntry;
}

/**
 * Cache Manager for IOC analysis results
 * Stores results in localStorage with daily buckets
 */
export class CacheManager {
  private static readonly CACHE_PREFIX = 'ahtapot_cache_';
  private static readonly SETTINGS_KEY = 'ahtapot_cache_settings';
  private static readonly DEFAULT_RETENTION_DAYS = 5;

  /**
   * Get cache settings
   */
  static async getSettings(): Promise<CacheSettings> {
    try {
      const result = await chrome.storage.local.get(this.SETTINGS_KEY);
      return result[this.SETTINGS_KEY] || {
        retentionDays: this.DEFAULT_RETENTION_DAYS,
        enabled: true,
      };
    } catch (error) {
      console.error('Error getting cache settings:', error);
      return {
        retentionDays: this.DEFAULT_RETENTION_DAYS,
        enabled: true,
      };
    }
  }

  /**
   * Save cache settings
   */
  static async saveSettings(settings: CacheSettings): Promise<void> {
    try {
      await chrome.storage.local.set({
        [this.SETTINGS_KEY]: settings,
      });
      // Clean old cache after settings change
      await this.cleanOldCache();
    } catch (error) {
      console.error('Error saving cache settings:', error);
      throw error;
    }
  }

  /**
   * Generate cache key for a specific date
   */
  private static getCacheKey(date: Date): string {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    return `${this.CACHE_PREFIX}${dateStr}`;
  }

  /**
   * Generate IOC key for storage
   */
  private static getIOCKey(
    provider: string,
    iocType: string,
    iocValue: string
  ): string {
    return `${provider}_${iocType}_${iocValue}`;
  }

  /**
   * Store an analysis result in cache
   */
  static async storeResult(result: IOCAnalysisResult): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled) {
      return;
    }

    try {
      const today = new Date();
      const cacheKey = this.getCacheKey(today);
      const iocKey = this.getIOCKey(
        result.source,
        result.ioc.type,
        result.ioc.value
      );

      // Get today's cache data
      const storageResult = await chrome.storage.local.get(cacheKey);
      const dailyCache: DailyCacheData = storageResult[cacheKey] || {};

      // Store the result
      const cacheEntry: CacheEntry = {
        ioc: result.ioc.value,
        type: result.ioc.type,
        provider: result.source,
        result,
        cachedAt: Date.now(),
      };

      dailyCache[iocKey] = cacheEntry;

      // Save back to storage
      await chrome.storage.local.set({
        [cacheKey]: dailyCache,
      });

      console.log(`[CacheManager] Stored result for ${iocKey} in ${cacheKey}`);
    } catch (error) {
      console.error('Error storing cache:', error);
    }
  }

  /**
   * Retrieve a cached result
   * OPTIMIZED: Batch fetch all relevant cache keys at once instead of sequential lookups
   */
  static async getResult(
    provider: string,
    iocType: string,
    iocValue: string
  ): Promise<IOCAnalysisResult | null> {
    const settings = await this.getSettings();
    if (!settings.enabled) {
      return null;
    }

    try {
      const iocKey = this.getIOCKey(provider, iocType, iocValue);

      // Generate all cache keys for retention period
      const cacheKeys: string[] = [];
      for (let i = 0; i < settings.retentionDays; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        cacheKeys.push(this.getCacheKey(date));
      }

      // OPTIMIZED: Single storage call instead of N sequential calls
      const storageResult = await chrome.storage.local.get(cacheKeys);

      // Check all retrieved caches
      for (const cacheKey of cacheKeys) {
        const dailyCache: DailyCacheData = storageResult[cacheKey];
        if (dailyCache && dailyCache[iocKey]) {
          console.log(`[CacheManager] Cache hit for ${iocKey} in ${cacheKey}`);
          return dailyCache[iocKey].result;
        }
      }

      console.log(`[CacheManager] Cache miss for ${iocKey}`);
      return null;
    } catch (error) {
      console.error('Error retrieving from cache:', error);
      return null;
    }
  }

  /**
   * Clean cache older than retention period
   */
  static async cleanOldCache(): Promise<void> {
    try {
      const settings = await this.getSettings();
      const allKeys = await chrome.storage.local.get(null);
      const cacheKeys = Object.keys(allKeys).filter((key) =>
        key.startsWith(this.CACHE_PREFIX)
      );

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - settings.retentionDays);
      const cutoffKey = this.getCacheKey(cutoffDate);

      const keysToRemove = cacheKeys.filter((key) => key < cutoffKey);

      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        console.log(
          `[CacheManager] Cleaned ${keysToRemove.length} old cache entries`
        );
      }
    } catch (error) {
      console.error('Error cleaning cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getStatistics(): Promise<{
    totalEntries: number;
    totalSize: number;
    oldestDate: string | null;
    newestDate: string | null;
  }> {
    try {
      const allKeys = await chrome.storage.local.get(null);
      const cacheKeys = Object.keys(allKeys).filter((key) =>
        key.startsWith(this.CACHE_PREFIX)
      );

      let totalEntries = 0;
      let totalSize = 0;

      for (const key of cacheKeys) {
        const dailyCache: DailyCacheData = allKeys[key];
        const entries = Object.keys(dailyCache).length;
        totalEntries += entries;

        // Approximate size calculation
        const dataStr = JSON.stringify(dailyCache);
        totalSize += dataStr.length;
      }

      const sortedKeys = cacheKeys.sort();

      return {
        totalEntries,
        totalSize,
        oldestDate:
          sortedKeys.length > 0
            ? sortedKeys[0].replace(this.CACHE_PREFIX, '')
            : null,
        newestDate:
          sortedKeys.length > 0
            ? sortedKeys[sortedKeys.length - 1].replace(
                this.CACHE_PREFIX,
                ''
              )
            : null,
      };
    } catch (error) {
      console.error('Error getting cache statistics:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestDate: null,
        newestDate: null,
      };
    }
  }

  /**
   * Clear all cache
   */
  static async clearAll(): Promise<void> {
    try {
      const allKeys = await chrome.storage.local.get(null);
      const cacheKeys = Object.keys(allKeys).filter((key) =>
        key.startsWith(this.CACHE_PREFIX)
      );

      if (cacheKeys.length > 0) {
        await chrome.storage.local.remove(cacheKeys);
        console.log(`[CacheManager] Cleared all cache (${cacheKeys.length} entries)`);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }
}
