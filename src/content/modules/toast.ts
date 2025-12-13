/**
 * Toast Module
 * Sayfa içi bildirim toast'ları
 */

import { ELEMENT_IDS, TIMING } from '../constants';
import { toastStyle, toastAnimationStyles } from '../styles';
import { createInfoIcon } from '../utils/dom-helpers';
import { t } from '../locales';

// Module state
let toastElement: HTMLDivElement | null = null;
let toastTimeout: number | null = null;

/**
 * Show "No IOCs Found" toast message
 */
export function showNoIOCsFoundToast(): void {
  // Remove existing toast if any
  hideToast();

  const message = t('noIOCsFound');

  toastElement = document.createElement('div');
  toastElement.id = ELEMENT_IDS.NO_IOCS_TOAST;
  toastElement.style.cssText = toastStyle;

  // Add info icon
  const iconSvg = createInfoIcon();
  toastElement.appendChild(iconSvg);

  // Add text
  const textSpan = document.createElement('span');
  textSpan.textContent = message;
  toastElement.appendChild(textSpan);

  document.body.appendChild(toastElement);

  // Animate in
  requestAnimationFrame(() => {
    if (toastElement) {
      toastElement.style.transform = toastAnimationStyles.visible.transform;
      toastElement.style.opacity = toastAnimationStyles.visible.opacity;
    }
  });

  // Auto hide after duration
  toastTimeout = window.setTimeout(() => {
    hideToast();
  }, TIMING.TOAST_DURATION);
}

/**
 * Hide the toast with animation
 */
export function hideToast(): void {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }

  if (toastElement) {
    toastElement.style.transform = toastAnimationStyles.hidden.transform;
    toastElement.style.opacity = toastAnimationStyles.hidden.opacity;

    const element = toastElement;
    setTimeout(() => {
      element.remove();
    }, TIMING.TOAST_FADE_OUT);

    toastElement = null;
  }
}
