/**
 * Platform Abstraction Layer
 *
 * Provides unified browser APIs for cross-browser extension development.
 * Supports Chrome, Firefox, and Edge browsers.
 *
 * @module platform
 *
 * @example
 * ```typescript
 * import { browser, storage, Platform, SidePanel, ContextMenus } from '@/platform';
 *
 * // Check browser type
 * if (Platform.isFirefox) {
 *   console.log('Running on Firefox');
 * }
 *
 * // Use storage API
 * const data = await storage.local.get('key');
 *
 * // Open side panel
 * await SidePanel.open({ tabId: 123 });
 *
 * // Create context menu
 * ContextMenus.create({
 *   id: 'my-menu',
 *   title: 'My Menu Item',
 *   contexts: ['selection'],
 * });
 * ```
 */

// Types
export type {
  BrowserType,
  PlatformInfo,
  SidePanelOpenOptions,
  ContextMenuCreateOptions,
  StorageChange,
  StorageChangeListener,
} from './types';

// Browser API
export {
  browser,
  Platform,
  storage,
  runtime,
  tabs,
  windows,
  action,
} from './browser-api';

// Side Panel
export { SidePanel } from './sidepanel';

// Context Menus
export { ContextMenus } from './menus';
export type { MenuClickInfo, MenuClickHandler } from './menus';
