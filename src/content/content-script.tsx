/**
 * Content Script - Entry Point
 * Sayfa içinde çalışan ana script
 *
 * Bu dosya sadece modülleri birbirine bağlar.
 * Tüm iş mantığı modüller içindedir.
 */

import { MessageType } from '@/types/messages';
import { initFloatingButton } from './modules/floating-button';
import { initKeyboardShortcuts } from './modules/keyboard';
import { handleDetectionRequest } from './modules/highlight-system';

/**
 * Initialize all content script modules
 */
function init(): void {
  // Initialize floating button (text selection)
  initFloatingButton();

  // Initialize keyboard shortcuts
  initKeyboardShortcuts();

  // Listen for messages from sidepanel/background
  chrome.runtime.onMessage.addListener(handleMessages);
}

/**
 * Handle messages from sidepanel and background
 */
function handleMessages(
  message: { type: string },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
): boolean {
  if (message.type === MessageType.DETECT_IOCS_ON_PAGE) {
    const result = handleDetectionRequest();
    sendResponse(result);
  }
  return true;
}

// Initialize when script loads
init();
