/**
 * IOC Highlight System Module
 * Sayfa içindeki IOC'leri highlight eder
 */

import { detectIOCs } from '@/utils/ioc-detector';
import { MessageType } from '@/types/messages';
import { DetectedIOC } from '@/types/ioc';
import { ELEMENT_IDS, CSS_CLASSES } from '../constants';
import {
  iocMarkStyle,
  iocMarkHoverStyles,
  highlightUIContainerStyle,
  closeButtonStyle,
  closeButtonHoverStyles,
  infoBadgeStyle,
} from '../styles';
import { getTextNodes, getShortcutKey } from '../utils/dom-helpers';
import { t } from '../locales';
import { showNoIOCsFoundToast } from './toast';

// Module state
let uiContainer: HTMLDivElement | null = null;
let isHighlightActive = false;
let highlightedElements: HTMLElement[] = [];

/**
 * Get current highlight state
 */
export function isActive(): boolean {
  return isHighlightActive;
}

/**
 * Wrap IOC occurrences in highlight elements directly in the DOM
 */
function wrapIOCsInHighlights(iocs: DetectedIOC[]): { count: number; uniqueCount: number } {
  const textNodes = getTextNodes();
  let totalCount = 0;
  const foundIOCs = new Set<string>();

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

        const mark = createMarkElement(match.ioc);
        range.surroundContents(mark);
        highlightedElements.push(mark);
        totalCount++;
        foundIOCs.add(match.ioc.value);
      } catch (e) {
        console.debug('Could not wrap IOC:', match.ioc.value, e);
      }
    }
  }

  return { count: totalCount, uniqueCount: foundIOCs.size };
}

/**
 * Create a mark element for an IOC
 */
function createMarkElement(ioc: DetectedIOC): HTMLElement {
  const mark = document.createElement('mark');
  mark.className = CSS_CLASSES.IOC_MARK;
  mark.dataset.iocType = ioc.type;
  mark.dataset.iocValue = ioc.value;
  mark.title = `${ioc.type.toUpperCase()} - Click to analyze`;
  mark.style.cssText = iocMarkStyle;

  // Click handler
  mark.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    chrome.runtime.sendMessage({
      type: MessageType.OPEN_SIDEPANEL,
      payload: { iocs: [ioc] },
    }).catch(console.debug);
  });

  // Hover effects
  mark.addEventListener('mouseenter', () => {
    mark.style.setProperty('color', iocMarkHoverStyles.enter.color, 'important');
    mark.style.setProperty('background', iocMarkHoverStyles.enter.background, 'important');
    mark.style.setProperty('box-shadow', iocMarkHoverStyles.enter.boxShadow, 'important');
    mark.style.setProperty('text-shadow', iocMarkHoverStyles.enter.textShadow, 'important');
  });

  mark.addEventListener('mouseleave', () => {
    mark.style.setProperty('color', iocMarkHoverStyles.leave.color, 'important');
    mark.style.setProperty('background', iocMarkHoverStyles.leave.background, 'important');
    mark.style.setProperty('box-shadow', iocMarkHoverStyles.leave.boxShadow, 'important');
    mark.style.setProperty('text-shadow', iocMarkHoverStyles.leave.textShadow, 'important');
  });

  return mark;
}

/**
 * Remove all highlight wrappers and restore original text
 */
function unwrapHighlights(): void {
  for (const mark of highlightedElements) {
    try {
      const parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
        parent.normalize();
      }
    } catch (e) {
      console.debug('Could not unwrap highlight:', e);
    }
  }
  highlightedElements = [];
}

/**
 * Create close button element
 */
function createCloseButton(onClose: () => void): HTMLButtonElement {
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '✕';
  closeButton.style.cssText = closeButtonStyle;

  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.background = closeButtonHoverStyles.enter.background;
    closeButton.style.color = closeButtonHoverStyles.enter.color;
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.background = closeButtonHoverStyles.leave.background;
    closeButton.style.color = closeButtonHoverStyles.leave.color;
  });

  closeButton.addEventListener('click', onClose);

  return closeButton;
}

/**
 * Create info badge element
 */
function createInfoBadge(uniqueCount: number, count: number): HTMLDivElement {
  const infoBadge = document.createElement('div');
  infoBadge.style.cssText = infoBadgeStyle;

  const shortcutKey = getShortcutKey();
  const uniqueLabel = t('uniqueIOCs');
  const occurrenceLabel = t('occurrences');
  const clickLabel = t('clickToAnalyze');
  const closeLabel = t('escToClose');

  infoBadge.innerHTML = `
    <span style="font-weight: 600;">${uniqueCount} ${uniqueLabel}${uniqueCount > 1 ? 's' : ''} (${count} ${occurrenceLabel}${count > 1 ? 's' : ''})</span>
    <span style="opacity: 0.7;">${clickLabel} • ESC / ${shortcutKey} ${closeLabel}</span>
  `;

  return infoBadge;
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
 * Show IOC highlights on page
 */
export function showHighlights(iocs: DetectedIOC[]): void {
  if (isHighlightActive) {
    hideHighlights();
  }

  const { count, uniqueCount } = wrapIOCsInHighlights(iocs);

  if (count === 0) {
    return;
  }

  isHighlightActive = true;

  // Create UI container
  uiContainer = document.createElement('div');
  uiContainer.id = ELEMENT_IDS.HIGHLIGHT_UI;
  uiContainer.style.cssText = highlightUIContainerStyle;

  // Add close button
  const closeButton = createCloseButton(() => {
    hideHighlights();
    notifySidepanelHighlightState(false);
  });
  uiContainer.appendChild(closeButton);

  // Add info badge
  const infoBadge = createInfoBadge(uniqueCount, count);
  uiContainer.appendChild(infoBadge);

  document.body.appendChild(uiContainer);
}

/**
 * Hide the highlights
 */
export function hideHighlights(): void {
  unwrapHighlights();

  if (uiContainer) {
    uiContainer.remove();
    uiContainer = null;
  }
  isHighlightActive = false;
}

/**
 * Toggle IOC highlights
 */
export function toggleHighlights(): void {
  if (isHighlightActive) {
    hideHighlights();
    notifySidepanelHighlightState(false);
  } else {
    const pageText = document.body.innerText || '';
    const iocs = detectIOCs(pageText);
    if (iocs.length > 0) {
      showHighlights(iocs);
      notifySidepanelHighlightState(true);
    } else {
      showNoIOCsFoundToast();
    }
  }
}

/**
 * Handle detection request from sidepanel
 */
export function handleDetectionRequest(): { success: boolean; count: number; isActive: boolean } {
  if (isHighlightActive) {
    hideHighlights();
    return { success: true, count: 0, isActive: false };
  } else {
    const pageText = document.body.innerText || '';
    const iocs = detectIOCs(pageText);

    if (iocs.length > 0) {
      showHighlights(iocs);
      return { success: true, count: iocs.length, isActive: true };
    } else {
      showNoIOCsFoundToast();
      return { success: true, count: 0, isActive: false };
    }
  }
}
