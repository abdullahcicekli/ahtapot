/**
 * Context Menus Abstraction Layer
 *
 * Handles context menu functionality across different browsers:
 * - Chrome/Edge: Uses chrome.contextMenus
 * - Firefox: Uses browser.menus (with fallback to contextMenus)
 *
 * @module platform/menus
 */

import type Browser from 'webextension-polyfill';
import { browser, Platform } from './browser-api';
import type { ContextMenuCreateOptions } from './types';

/**
 * Normalized context menu click info
 */
export interface MenuClickInfo {
  menuItemId: string | number;
  parentMenuItemId?: string | number;
  selectionText?: string;
  linkUrl?: string;
  srcUrl?: string;
  pageUrl?: string;
  frameUrl?: string;
  editable: boolean;
}

/**
 * Menu click handler type
 */
export type MenuClickHandler = (
  info: MenuClickInfo,
  tab?: Browser.Tabs.Tab
) => void | Promise<void>;

/**
 * Context Menus Manager
 * Provides unified context menu functionality across browsers
 */
class ContextMenusManager {
  private static instance: ContextMenusManager;
  private clickHandlers: Map<string, MenuClickHandler> = new Map();

  private constructor() {
    this.initializeListener();
  }

  public static getInstance(): ContextMenusManager {
    if (!ContextMenusManager.instance) {
      ContextMenusManager.instance = new ContextMenusManager();
    }
    return ContextMenusManager.instance;
  }

  /**
   * Get the appropriate menus API
   */
  private getMenusApi(): typeof browser.menus | typeof browser.contextMenus {
    // Firefox uses browser.menus, Chrome uses contextMenus
    if (Platform.isFirefox && browser.menus) {
      return browser.menus;
    }
    return browser.contextMenus || (browser as any).menus;
  }

  /**
   * Initialize click listener
   */
  private initializeListener(): void {
    const menusApi = this.getMenusApi();

    if (menusApi?.onClicked) {
      menusApi.onClicked.addListener((info, tab) => {
        const menuId = String(info.menuItemId);
        const handler = this.clickHandlers.get(menuId);

        if (handler) {
          const normalizedInfo: MenuClickInfo = {
            menuItemId: info.menuItemId,
            parentMenuItemId: info.parentMenuItemId,
            selectionText: info.selectionText,
            linkUrl: info.linkUrl,
            srcUrl: info.srcUrl,
            pageUrl: info.pageUrl,
            frameUrl: info.frameUrl,
            editable: info.editable ?? false,
          };

          handler(normalizedInfo, tab);
        }
      });
    }
  }

  /**
   * Create a context menu item
   *
   * @param options - Menu item options
   * @param onClick - Optional click handler
   * @returns The created menu item ID
   */
  public create(
    options: ContextMenuCreateOptions,
    onClick?: MenuClickHandler
  ): string | number | undefined {
    const menusApi = this.getMenusApi();

    if (!menusApi) {
      console.warn('[Menus] Context menus API not available');
      return undefined;
    }

    try {
      // Store handler if provided
      if (onClick) {
        this.clickHandlers.set(options.id, onClick);
      }

      // Create the menu item
      return menusApi.create({
        id: options.id,
        title: options.title,
        contexts: options.contexts as any,
        parentId: options.parentId,
        documentUrlPatterns: options.documentUrlPatterns,
        targetUrlPatterns: options.targetUrlPatterns,
        enabled: options.enabled,
        checked: options.checked,
        type: options.type,
      });
    } catch (error) {
      console.error('[Menus] Error creating menu item:', error);
      return undefined;
    }
  }

  /**
   * Update a context menu item
   *
   * @param id - Menu item ID
   * @param options - Updated options
   */
  public async update(
    id: string,
    options: Partial<ContextMenuCreateOptions>
  ): Promise<void> {
    const menusApi = this.getMenusApi();

    if (!menusApi) {
      return;
    }

    try {
      await menusApi.update(id, options as any);
    } catch (error) {
      console.error('[Menus] Error updating menu item:', error);
    }
  }

  /**
   * Remove a context menu item
   *
   * @param id - Menu item ID
   */
  public async remove(id: string): Promise<void> {
    const menusApi = this.getMenusApi();

    if (!menusApi) {
      return;
    }

    try {
      await menusApi.remove(id);
      this.clickHandlers.delete(id);
    } catch (error) {
      console.error('[Menus] Error removing menu item:', error);
    }
  }

  /**
   * Remove all context menu items
   */
  public async removeAll(): Promise<void> {
    const menusApi = this.getMenusApi();

    if (!menusApi) {
      return;
    }

    try {
      await menusApi.removeAll();
      this.clickHandlers.clear();
    } catch (error) {
      console.error('[Menus] Error removing all menu items:', error);
    }
  }

  /**
   * Register a click handler for a menu item
   *
   * @param id - Menu item ID
   * @param handler - Click handler
   */
  public onClick(id: string, handler: MenuClickHandler): void {
    this.clickHandlers.set(id, handler);
  }

  /**
   * Unregister a click handler
   *
   * @param id - Menu item ID
   */
  public offClick(id: string): void {
    this.clickHandlers.delete(id);
  }
}

/**
 * Singleton instance of ContextMenusManager
 */
export const ContextMenus = ContextMenusManager.getInstance();
