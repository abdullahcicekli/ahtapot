/**
 * Keyboard Shortcuts Module
 * Global klavye kısayolları
 */

import { isMac } from '../utils/dom-helpers';
import { isActive, hideHighlights, toggleHighlights } from './highlight-system';

/**
 * Handle global keyboard shortcuts
 */
function handleGlobalKeydown(e: KeyboardEvent): void {
  // ESC to close highlights
  if (e.key === 'Escape' && isActive()) {
    e.preventDefault();
    hideHighlights();
    notifySidepanelHighlightState(false);
    return;
  }

  // Command+Shift+D (Mac) or Ctrl+Shift+D (Windows/Linux) to toggle
  const modifierKey = isMac ? e.metaKey : e.ctrlKey;
  if (modifierKey && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
    e.preventDefault();
    toggleHighlights();
  }
}

/**
 * Notify sidepanel about highlight state change
 */
function notifySidepanelHighlightState(active: boolean): void {
  chrome.runtime.sendMessage({
    type: 'IOC_HIGHLIGHT_STATE_CHANGED',
    payload: { isActive: active }
  }).catch(console.debug);
}

/**
 * Initialize keyboard shortcut listeners
 */
export function initKeyboardShortcuts(): void {
  document.addEventListener('keydown', handleGlobalKeydown);
}

/**
 * Cleanup keyboard shortcut listeners
 */
export function cleanupKeyboardShortcuts(): void {
  document.removeEventListener('keydown', handleGlobalKeydown);
}
