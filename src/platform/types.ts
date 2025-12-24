/**
 * Platform Types
 * Type definitions for cross-browser compatibility layer
 */

/**
 * Supported browser types
 */
export type BrowserType = 'chrome' | 'firefox' | 'edge';

/**
 * Platform detection result
 */
export interface PlatformInfo {
  browser: BrowserType;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  supportsServiceWorker: boolean;
  supportsSidePanel: boolean;
  supportsSidebar: boolean;
}

/**
 * Side panel open options
 */
export interface SidePanelOpenOptions {
  tabId?: number;
  windowId?: number;
}

/**
 * Context menu create options (normalized)
 */
export interface ContextMenuCreateOptions {
  id: string;
  title: string;
  contexts: Array<'selection' | 'page' | 'link' | 'image' | 'video' | 'audio' | 'all'>;
  parentId?: string;
  documentUrlPatterns?: string[];
  targetUrlPatterns?: string[];
  enabled?: boolean;
  checked?: boolean;
  type?: 'normal' | 'checkbox' | 'radio' | 'separator';
}

/**
 * Storage change event
 */
export interface StorageChange<T = unknown> {
  oldValue?: T;
  newValue?: T;
}

/**
 * Storage change listener callback
 */
export type StorageChangeListener = (
  changes: Record<string, StorageChange>,
  areaName: string
) => void;
