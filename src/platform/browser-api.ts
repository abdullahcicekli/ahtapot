/**
 * Browser API Abstraction Layer
 *
 * Provides a unified API across Chrome, Firefox, and Edge browsers.
 * Uses webextension-polyfill for cross-browser compatibility.
 *
 * @module platform/browser-api
 */

import Browser from 'webextension-polyfill';
import type { BrowserType, PlatformInfo } from './types';

/**
 * Detect current browser type
 */
function detectBrowser(): BrowserType {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('firefox')) {
    return 'firefox';
  }

  if (userAgent.includes('edg/')) {
    return 'edge';
  }

  return 'chrome';
}

/**
 * Platform information singleton
 * Provides information about the current browser environment
 */
class PlatformDetector implements PlatformInfo {
  private static instance: PlatformDetector;

  public readonly browser: BrowserType;
  public readonly isChrome: boolean;
  public readonly isFirefox: boolean;
  public readonly isEdge: boolean;
  public readonly supportsServiceWorker: boolean;
  public readonly supportsSidePanel: boolean;
  public readonly supportsSidebar: boolean;

  private constructor() {
    this.browser = detectBrowser();
    this.isChrome = this.browser === 'chrome';
    this.isFirefox = this.browser === 'firefox';
    this.isEdge = this.browser === 'edge';

    // Firefox < 120 doesn't support service workers in extensions
    this.supportsServiceWorker = !this.isFirefox;

    // Side panel is Chrome/Edge only (Chrome 114+)
    this.supportsSidePanel = !this.isFirefox && 'sidePanel' in (chrome || {});

    // Sidebar is Firefox only
    this.supportsSidebar = this.isFirefox;
  }

  public static getInstance(): PlatformDetector {
    if (!PlatformDetector.instance) {
      PlatformDetector.instance = new PlatformDetector();
    }
    return PlatformDetector.instance;
  }
}

/**
 * Platform detection utility
 */
export const Platform = PlatformDetector.getInstance();

/**
 * Unified browser API
 * Re-exports webextension-polyfill for consistent cross-browser access
 */
export const browser = Browser;

/**
 * Storage API wrapper with additional type safety
 */
export const storage = {
  local: {
    async get<T = Record<string, unknown>>(keys?: string | string[] | null): Promise<T> {
      const result = await Browser.storage.local.get(keys);
      return result as T;
    },

    async set(items: Record<string, unknown>): Promise<void> {
      await Browser.storage.local.set(items);
    },

    async remove(keys: string | string[]): Promise<void> {
      await Browser.storage.local.remove(keys);
    },

    async clear(): Promise<void> {
      await Browser.storage.local.clear();
    },
  },

  onChanged: Browser.storage.onChanged,
};

/**
 * Runtime API wrapper
 */
export const runtime = {
  sendMessage: Browser.runtime.sendMessage.bind(Browser.runtime),
  onMessage: Browser.runtime.onMessage,
  onInstalled: Browser.runtime.onInstalled,
  getURL: Browser.runtime.getURL.bind(Browser.runtime),
  getManifest: Browser.runtime.getManifest.bind(Browser.runtime),
  openOptionsPage: Browser.runtime.openOptionsPage.bind(Browser.runtime),
  get id() {
    return Browser.runtime.id;
  },
};

/**
 * Tabs API wrapper
 */
export const tabs = {
  query: Browser.tabs.query.bind(Browser.tabs),
  create: Browser.tabs.create.bind(Browser.tabs),
  update: Browser.tabs.update.bind(Browser.tabs),
  get: Browser.tabs.get.bind(Browser.tabs),
  remove: Browser.tabs.remove.bind(Browser.tabs),
  onActivated: Browser.tabs.onActivated,
  onUpdated: Browser.tabs.onUpdated,
};

/**
 * Windows API wrapper
 */
export const windows = {
  get: Browser.windows.get.bind(Browser.windows),
  getAll: Browser.windows.getAll.bind(Browser.windows),
  getCurrent: Browser.windows.getCurrent.bind(Browser.windows),
  update: Browser.windows.update.bind(Browser.windows),
  create: Browser.windows.create.bind(Browser.windows),
};

/**
 * Action API wrapper (browser action / page action)
 */
export const action = Browser.action || Browser.browserAction;
