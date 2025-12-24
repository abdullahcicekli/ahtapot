/**
 * Side Panel Abstraction Layer
 *
 * Handles side panel functionality across different browsers:
 * - Chrome/Edge: Uses native sidePanel API
 * - Firefox: Opens sidepanel in a new tab (sidebar_action is browser-controlled)
 *
 * @module platform/sidepanel
 */

import { Platform, browser, tabs } from './browser-api';
import type { SidePanelOpenOptions } from './types';

/**
 * Side Panel Manager
 * Provides unified side panel functionality across browsers
 */
class SidePanelManager {
  private static instance: SidePanelManager;
  private readonly SIDEPANEL_PATH = 'src/pages/sidepanel/index.html';

  private constructor() {}

  public static getInstance(): SidePanelManager {
    if (!SidePanelManager.instance) {
      SidePanelManager.instance = new SidePanelManager();
    }
    return SidePanelManager.instance;
  }

  /**
   * Open the side panel
   *
   * @param options - Options for opening the side panel
   * @returns Promise that resolves when the panel is opened
   */
  public async open(options?: SidePanelOpenOptions): Promise<void> {
    if (Platform.isFirefox) {
      return this.openAsTab();
    }

    // Chrome/Edge: Use native sidePanel API
    return this.openNativeSidePanel(options);
  }

  /**
   * Open side panel using Chrome's native API
   */
  private async openNativeSidePanel(options?: SidePanelOpenOptions): Promise<void> {
    try {
      // Access chrome.sidePanel directly for Chrome/Edge
      const sidePanel = (chrome as any).sidePanel;

      if (!sidePanel) {
        // Fallback to tab if sidePanel not available
        return this.openAsTab();
      }

      if (options?.tabId) {
        await sidePanel.open({ tabId: options.tabId });
      } else if (options?.windowId) {
        await sidePanel.open({ windowId: options.windowId });
      } else {
        // Get current tab and open side panel
        const [tab] = await tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          await sidePanel.open({ tabId: tab.id });
        }
      }
    } catch (error) {
      console.error('[SidePanel] Error opening native side panel:', error);
      // Fallback to tab
      return this.openAsTab();
    }
  }

  /**
   * Open side panel content as a new tab (Firefox fallback)
   */
  private async openAsTab(): Promise<void> {
    const url = browser.runtime.getURL(this.SIDEPANEL_PATH);

    // Check if sidepanel tab already exists
    const existingTabs = await tabs.query({ url: `*://*/*${this.SIDEPANEL_PATH}*` });

    if (existingTabs.length > 0 && existingTabs[0].id) {
      // Focus existing tab
      await tabs.update(existingTabs[0].id, { active: true });
    } else {
      // Create new tab
      await tabs.create({ url });
    }
  }

  /**
   * Check if side panel is supported in current browser
   */
  public isSupported(): boolean {
    return Platform.supportsSidePanel;
  }

  /**
   * Set side panel options (Chrome/Edge only)
   */
  public async setOptions(options: { enabled?: boolean; path?: string }): Promise<void> {
    if (!Platform.supportsSidePanel) {
      return;
    }

    try {
      const sidePanel = (chrome as any).sidePanel;
      if (sidePanel?.setOptions) {
        await sidePanel.setOptions(options);
      }
    } catch (error) {
      console.error('[SidePanel] Error setting options:', error);
    }
  }
}

/**
 * Singleton instance of SidePanelManager
 */
export const SidePanel = SidePanelManager.getInstance();
