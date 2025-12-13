import ReactDOM from 'react-dom/client';
import FloatingButton from '@/components/FloatingButton';
import { detectIOCs } from '@/utils/ioc-detector';
import { MessageType } from '@/types/messages';
import { DetectedIOC } from '@/types/ioc';
import {
  Z_INDEX,
  TIMING,
  POSITIONING,
  ELEMENT_IDS,
  CSS_CLASSES,
  EXCLUDED_TAGS,
} from './constants';

/**
 * Content Script - Sayfa içinde çalışır
 * Metin seçimlerini dinler ve floating button gösterir
 */

let floatingButtonRoot: ReactDOM.Root | null = null;
let floatingButtonContainer: HTMLDivElement | null = null;
let currentSelection: string = '';
let detectedIOCs: DetectedIOC[] = [];

// Detect if running on Mac
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

// Floating button container'ını oluştur
function createFloatingButtonContainer(): HTMLDivElement {
  if (floatingButtonContainer) {
    return floatingButtonContainer;
  }

  const container = document.createElement('div');
  container.id = ELEMENT_IDS.FLOATING_BUTTON_ROOT;
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: ${Z_INDEX.FLOATING_BUTTON};
    pointer-events: none;
  `;
  document.body.appendChild(container);

  floatingButtonContainer = container;
  floatingButtonRoot = ReactDOM.createRoot(container);

  return container;
}

function showFloatingButton(rect: DOMRect, iocs: DetectedIOC[]) {
  if (!floatingButtonRoot) {
    createFloatingButtonContainer();
  }

  const position = {
    top: rect.top + POSITIONING.FLOATING_BUTTON_OFFSET_TOP,
    left: rect.right + POSITIONING.FLOATING_BUTTON_OFFSET_LEFT,
  };

  detectedIOCs = iocs;

  floatingButtonRoot!.render(
    <FloatingButton
      position={position}
      iocs={iocs}
      onAnalyze={handleAnalyze}
      onClose={hideFloatingButton}
    />
  );
}

// Floating button'ı gizle
function hideFloatingButton() {
  if (floatingButtonRoot && floatingButtonContainer) {
    floatingButtonRoot.render(null);
  }
}

// Analiz butonuna tıklandığında
async function handleAnalyze() {
  try {
    // Side panel'i aç
    await chrome.runtime.sendMessage({
      type: MessageType.OPEN_SIDEPANEL,
      payload: { iocs: detectedIOCs },
    });

    hideFloatingButton();
  } catch (error) {
    console.error('Analiz başlatılamadı:', error);
  }
}

// Debounce timer for selection changes
let selectionDebounceTimer: number | undefined;

function handleSelectionChange() {
  // Clear previous timer
  if (selectionDebounceTimer) {
    clearTimeout(selectionDebounceTimer);
  }

  // Debounce with requestIdleCallback for better performance
  selectionDebounceTimer = window.setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';

    // Early return if no text or same as before
    if (!selectedText) {
      if (currentSelection) {
        hideFloatingButton();
        currentSelection = '';
      }
      return;
    }

    if (selectedText === currentSelection) {
      return;
    }

    currentSelection = selectedText;

    // OPTIMIZED: Single detection call instead of hasIOCs + detectIOCs
    const iocs = detectIOCs(selectedText);

    if (iocs.length > 0) {
      const range = selection!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      showFloatingButton(rect, iocs);
    } else {
      hideFloatingButton();
    }
  }, TIMING.SELECTION_DEBOUNCE);
}

// Mouse up olayını dinle (seçim tamamlandığında)
document.addEventListener('mouseup', handleSelectionChange);

document.addEventListener('keyup', (e) => {
  if (e.shiftKey || (e.ctrlKey && e.key === 'a')) {
    handleSelectionChange();
  }
});

document.addEventListener('mousedown', (e) => {
  const target = e.target as HTMLElement;

  if (!target.closest(`#${ELEMENT_IDS.FLOATING_BUTTON_ROOT}`)) {
    const selection = window.getSelection();
    if (!selection?.toString().trim()) {
      hideFloatingButton();
      currentSelection = '';
    }
  }
});

// IOC Detection Highlight System
let uiContainer: HTMLDivElement | null = null;
let isHighlightActive = false;
let highlightedElements: HTMLElement[] = [];

// Find all text nodes in the document
function getTextNodes(): Text[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tagName = parent.tagName.toLowerCase();
        if (EXCLUDED_TAGS.includes(tagName as typeof EXCLUDED_TAGS[number])) {
          return NodeFilter.FILTER_REJECT;
        }

        // Skip our own elements
        if (parent.closest(`#${ELEMENT_IDS.HIGHLIGHT_UI}, .${CSS_CLASSES.IOC_MARK}`)) {
          return NodeFilter.FILTER_REJECT;
        }

        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return NodeFilter.FILTER_REJECT;
        }

        if (!node.textContent?.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    textNodes.push(node);
  }

  return textNodes;
}

// Wrap IOC occurrences in highlight elements directly in the DOM
function wrapIOCsInHighlights(iocs: DetectedIOC[]): { count: number; uniqueCount: number } {
  const textNodes = getTextNodes();
  let totalCount = 0;
  const foundIOCs = new Set<string>();

  // Process each text node
  for (const textNode of textNodes) {
    const text = textNode.textContent || '';
    if (!text.trim()) continue;

    // Find all IOC matches in this text node
    const matches: { start: number; end: number; ioc: DetectedIOC }[] = [];

    for (const ioc of iocs) {
      const iocLower = ioc.value.toLowerCase();
      const textLower = text.toLowerCase();
      let startIndex = 0;
      let index: number;

      while ((index = textLower.indexOf(iocLower, startIndex)) !== -1) {
        matches.push({
          start: index,
          end: index + ioc.value.length,
          ioc
        });
        startIndex = index + 1;
      }
    }

    if (matches.length === 0) continue;

    // Sort by position (reverse order to process from end to start)
    matches.sort((a, b) => b.start - a.start);

    // Remove overlapping matches (keep longer ones)
    const filteredMatches: typeof matches = [];
    for (const match of matches) {
      const overlaps = filteredMatches.some(
        m => (match.start < m.end && match.end > m.start)
      );
      if (!overlaps) {
        filteredMatches.push(match);
      }
    }

    // Wrap each match
    for (const match of filteredMatches) {
      try {
        const range = document.createRange();
        range.setStart(textNode, match.start);
        range.setEnd(textNode, match.end);

        const mark = document.createElement('mark');
        mark.className = CSS_CLASSES.IOC_MARK;
        mark.dataset.iocType = match.ioc.type;
        mark.dataset.iocValue = match.ioc.value;
        mark.title = `${match.ioc.type.toUpperCase()} - Click to analyze`;
        mark.style.cssText = `
          all: unset !important;
          background: linear-gradient(135deg, #C7F54D 0%, #a8e000 100%) !important;
          color: #1A1A1F !important;
          padding: 1px 5px !important;
          border-radius: 3px !important;
          cursor: pointer !important;
          display: inline !important;
          font: inherit !important;
          font-weight: 600 !important;
          line-height: inherit !important;
          vertical-align: baseline !important;
          text-decoration: none !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
        `;

        // Click handler - analyze this IOC without closing detection mode
        mark.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          chrome.runtime.sendMessage({
            type: MessageType.OPEN_SIDEPANEL,
            payload: { iocs: [match.ioc] },
          }).catch(console.debug);
        });

        // Hover effects - text glows bright
        mark.addEventListener('mouseenter', () => {
          mark.style.setProperty('color', '#C7F54D', 'important');
          mark.style.setProperty('background', '#1A1A1F', 'important');
          mark.style.setProperty('box-shadow', '0 0 12px rgba(199, 245, 77, 0.8), 0 0 24px rgba(199, 245, 77, 0.4)', 'important');
          mark.style.setProperty('text-shadow', '0 0 8px rgba(199, 245, 77, 0.9)', 'important');
        });
        mark.addEventListener('mouseleave', () => {
          mark.style.setProperty('color', '#1A1A1F', 'important');
          mark.style.setProperty('background', 'linear-gradient(135deg, #C7F54D 0%, #a8e000 100%)', 'important');
          mark.style.setProperty('box-shadow', '0 1px 3px rgba(0,0,0,0.3)', 'important');
          mark.style.setProperty('text-shadow', 'none', 'important');
        });

        range.surroundContents(mark);
        highlightedElements.push(mark);
        totalCount++;
        foundIOCs.add(match.ioc.value);
      } catch (e) {
        // surroundContents can fail if range crosses element boundaries
        console.debug('Could not wrap IOC:', match.ioc.value, e);
      }
    }
  }

  return { count: totalCount, uniqueCount: foundIOCs.size };
}

// Remove all highlight wrappers and restore original text
function unwrapHighlights() {
  for (const mark of highlightedElements) {
    try {
      const parent = mark.parentNode;
      if (parent) {
        // Move all children out of the mark element
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
        // Normalize to merge adjacent text nodes
        parent.normalize();
      }
    } catch (e) {
      console.debug('Could not unwrap highlight:', e);
    }
  }
  highlightedElements = [];
}

// Show IOC highlights on page
function showIOCHighlights(iocs: DetectedIOC[]) {
  if (isHighlightActive) {
    hideIOCHighlights();
  }

  // Wrap IOCs in highlights
  const { count, uniqueCount } = wrapIOCsInHighlights(iocs);

  if (count === 0) {
    return;
  }

  isHighlightActive = true;

  // Create UI container for info badge and close button
  uiContainer = document.createElement('div');
  uiContainer.id = ELEMENT_IDS.HIGHLIGHT_UI;
  uiContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: ${Z_INDEX.HIGHLIGHT_UI};
  `;

  // Add close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '✕';
  closeButton.style.cssText = `
    position: fixed;
    top: ${POSITIONING.CLOSE_BUTTON_TOP}px;
    right: ${POSITIONING.CLOSE_BUTTON_RIGHT}px;
    width: ${POSITIONING.CLOSE_BUTTON_SIZE}px;
    height: ${POSITIONING.CLOSE_BUTTON_SIZE}px;
    background: #1A1A1F;
    border: 2px solid #C7F54D;
    border-radius: 50%;
    color: #C7F54D;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: ${Z_INDEX.CLOSE_BUTTON};
    transition: all 0.2s ease;
    pointer-events: auto;
  `;
  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.background = '#C7F54D';
    closeButton.style.color = '#1A1A1F';
  });
  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.background = '#1A1A1F';
    closeButton.style.color = '#C7F54D';
  });
  closeButton.addEventListener('click', () => {
    hideIOCHighlights();
    notifySidepanelHighlightState(false);
  });
  uiContainer.appendChild(closeButton);

  // Add info badge
  const infoBadge = document.createElement('div');
  infoBadge.style.cssText = `
    position: fixed;
    bottom: ${POSITIONING.INFO_BADGE_BOTTOM}px;
    left: 50%;
    transform: translateX(-50%);
    background: #1A1A1F;
    border: 1px solid #C7F54D;
    border-radius: 8px;
    padding: 12px 24px;
    color: #C7F54D;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    z-index: ${Z_INDEX.INFO_BADGE};
    display: flex;
    align-items: center;
    gap: 12px;
    pointer-events: auto;
  `;
  const shortcutKey = isMac ? '⌘⇧D' : 'Ctrl+Shift+D';
  const uniqueLabel = getLocalizedMessage('uniqueIOCs');
  const occurrenceLabel = getLocalizedMessage('occurrences');
  const clickLabel = getLocalizedMessage('clickToAnalyze');
  const closeLabel = getLocalizedMessage('escToClose');

  infoBadge.innerHTML = `
    <span style="font-weight: 600;">${uniqueCount} ${uniqueLabel}${uniqueCount > 1 ? 's' : ''} (${count} ${occurrenceLabel}${count > 1 ? 's' : ''})</span>
    <span style="opacity: 0.7;">${clickLabel} • ESC / ${shortcutKey} ${closeLabel}</span>
  `;
  uiContainer.appendChild(infoBadge);

  document.body.appendChild(uiContainer);
}

// Global keyboard shortcut handler
function handleGlobalKeydown(e: KeyboardEvent) {
  // ESC to close highlights
  if (e.key === 'Escape' && isHighlightActive) {
    e.preventDefault();
    hideIOCHighlights();
    notifySidepanelHighlightState(false);
    return;
  }

  // Command+Shift+D (Mac) or Ctrl+Shift+D (Windows/Linux) to toggle
  const modifierKey = isMac ? e.metaKey : e.ctrlKey;
  if (modifierKey && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
    e.preventDefault();
    toggleIOCHighlights();
  }
}

// Toggle IOC highlights
function toggleIOCHighlights() {
  if (isHighlightActive) {
    hideIOCHighlights();
    notifySidepanelHighlightState(false);
  } else {
    const pageText = document.body.innerText || '';
    const iocs = detectIOCs(pageText);
    if (iocs.length > 0) {
      showIOCHighlights(iocs);
      notifySidepanelHighlightState(true);
    } else {
      showNoIOCsFoundToast();
    }
  }
}

// Show toast when no IOCs found
let noIOCsToast: HTMLDivElement | null = null;
let noIOCsToastTimeout: number | null = null;

function showNoIOCsFoundToast() {
  // Remove existing toast if any
  if (noIOCsToast) {
    noIOCsToast.remove();
    noIOCsToast = null;
  }
  if (noIOCsToastTimeout) {
    clearTimeout(noIOCsToastTimeout);
  }

  // Get localized message
  const message = getLocalizedMessage('noIOCsFound');

  noIOCsToast = document.createElement('div');
  noIOCsToast.id = ELEMENT_IDS.NO_IOCS_TOAST;
  noIOCsToast.style.cssText = `
    position: fixed;
    bottom: ${POSITIONING.INFO_BADGE_BOTTOM}px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: #1A1A1F;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 12px 24px;
    color: rgba(255, 255, 255, 0.9);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    z-index: ${Z_INDEX.TOAST};
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
  `;

  // Info icon
  const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  iconSvg.setAttribute('width', '18');
  iconSvg.setAttribute('height', '18');
  iconSvg.setAttribute('viewBox', '0 0 24 24');
  iconSvg.setAttribute('fill', 'none');
  iconSvg.setAttribute('stroke', '#C7F54D');
  iconSvg.setAttribute('stroke-width', '2');
  iconSvg.setAttribute('stroke-linecap', 'round');
  iconSvg.setAttribute('stroke-linejoin', 'round');
  iconSvg.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>';

  const textSpan = document.createElement('span');
  textSpan.textContent = message;

  noIOCsToast.appendChild(iconSvg);
  noIOCsToast.appendChild(textSpan);
  document.body.appendChild(noIOCsToast);

  // Animate in
  requestAnimationFrame(() => {
    if (noIOCsToast) {
      noIOCsToast.style.transform = 'translateX(-50%) translateY(0)';
      noIOCsToast.style.opacity = '1';
    }
  });

  // Auto hide after toast duration
  noIOCsToastTimeout = window.setTimeout(() => {
    hideNoIOCsFoundToast();
  }, TIMING.TOAST_DURATION);
}

function hideNoIOCsFoundToast() {
  if (noIOCsToast) {
    noIOCsToast.style.transform = 'translateX(-50%) translateY(100px)';
    noIOCsToast.style.opacity = '0';

    setTimeout(() => {
      if (noIOCsToast) {
        noIOCsToast.remove();
        noIOCsToast = null;
      }
    }, TIMING.TOAST_FADE_OUT);
  }
}

// Get localized message based on browser language
function getLocalizedMessage(key: string): string {
  const lang = navigator.language.toLowerCase();
  const isTurkish = lang.startsWith('tr');

  const messages: Record<string, Record<string, string>> = {
    noIOCsFound: {
      en: 'No IOCs detected on this page',
      tr: 'Bu sayfada IOC tespit edilemedi'
    },
    clickToAnalyze: {
      en: 'Click to analyze',
      tr: 'Analiz etmek için tıklayın'
    },
    escToClose: {
      en: 'to close',
      tr: 'kapatmak için'
    },
    uniqueIOCs: {
      en: 'unique IOC',
      tr: 'benzersiz IOC'
    },
    occurrences: {
      en: 'occurrence',
      tr: 'bulgu'
    }
  };

  return messages[key]?.[isTurkish ? 'tr' : 'en'] || messages[key]?.['en'] || key;
}

// Notify sidepanel about highlight state change
function notifySidepanelHighlightState(isActive: boolean) {
  chrome.runtime.sendMessage({
    type: 'IOC_HIGHLIGHT_STATE_CHANGED',
    payload: { isActive }
  }).catch(console.debug);
}

// Register global shortcut
document.addEventListener('keydown', handleGlobalKeydown);

// Hide the highlights
function hideIOCHighlights() {
  // Remove highlight wrappers from DOM
  unwrapHighlights();

  if (uiContainer) {
    uiContainer.remove();
    uiContainer = null;
  }
  isHighlightActive = false;
}

// Listen for DETECT_IOCS_ON_PAGE message from sidepanel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === MessageType.DETECT_IOCS_ON_PAGE) {
    // Toggle highlights - if active, close it; otherwise open it
    if (isHighlightActive) {
      hideIOCHighlights();
      sendResponse({ success: true, count: 0, isActive: false });
    } else {
      const pageText = document.body.innerText || '';
      const iocs = detectIOCs(pageText);

      if (iocs.length > 0) {
        showIOCHighlights(iocs);
        sendResponse({ success: true, count: iocs.length, isActive: true });
      } else {
        showNoIOCsFoundToast();
        sendResponse({ success: true, count: 0, isActive: false });
      }
    }
  }
  return true;
});
