/**
 * DOM Helper Utilities
 * DOM manipülasyonu için yardımcı fonksiyonlar
 */

import { ELEMENT_IDS, CSS_CLASSES, EXCLUDED_TAGS } from '../constants';
import { COLORS } from '../styles';

/**
 * Find all text nodes in the document
 * Sayfa içindeki tüm metin düğümlerini bulur
 */
export function getTextNodes(): Text[] {
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

/**
 * Create info icon SVG element
 * Bilgi ikonu SVG elementi oluşturur
 */
export function createInfoIcon(): SVGSVGElement {
  const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  iconSvg.setAttribute('width', '18');
  iconSvg.setAttribute('height', '18');
  iconSvg.setAttribute('viewBox', '0 0 24 24');
  iconSvg.setAttribute('fill', 'none');
  iconSvg.setAttribute('stroke', COLORS.primary);
  iconSvg.setAttribute('stroke-width', '2');
  iconSvg.setAttribute('stroke-linecap', 'round');
  iconSvg.setAttribute('stroke-linejoin', 'round');
  iconSvg.innerHTML = `
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  `;
  return iconSvg;
}

/**
 * Detect if running on Mac
 */
export const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/**
 * Get keyboard shortcut text based on platform
 */
export function getShortcutKey(): string {
  return isMac ? '⌘⇧D' : 'Ctrl+Shift+D';
}
