/**
 * Floating Button Module
 * Metin seçimi sonrası görünen analiz butonu
 */

import ReactDOM from 'react-dom/client';
import FloatingButton from '@/components/FloatingButton';
import { detectIOCs } from '@/utils/ioc-detector';
import { MessageType } from '@/types/messages';
import { DetectedIOC } from '@/types/ioc';
import { ELEMENT_IDS, TIMING, POSITIONING } from '../constants';
import { floatingButtonContainerStyle } from '../styles';

// Module state
let floatingButtonRoot: ReactDOM.Root | null = null;
let floatingButtonContainer: HTMLDivElement | null = null;
let currentSelection: string = '';
let detectedIOCs: DetectedIOC[] = [];
let selectionDebounceTimer: number | undefined;

/**
 * Create the floating button container
 */
function createContainer(): HTMLDivElement {
  if (floatingButtonContainer) {
    return floatingButtonContainer;
  }

  const container = document.createElement('div');
  container.id = ELEMENT_IDS.FLOATING_BUTTON_ROOT;
  container.style.cssText = floatingButtonContainerStyle;
  document.body.appendChild(container);

  floatingButtonContainer = container;
  floatingButtonRoot = ReactDOM.createRoot(container);

  return container;
}

/**
 * Show the floating button
 */
function show(rect: DOMRect, iocs: DetectedIOC[]): void {
  if (!floatingButtonRoot) {
    createContainer();
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
      onClose={hide}
    />
  );
}

/**
 * Hide the floating button
 */
function hide(): void {
  if (floatingButtonRoot && floatingButtonContainer) {
    floatingButtonRoot.render(null);
  }
}

/**
 * Handle analyze button click
 */
async function handleAnalyze(): Promise<void> {
  try {
    await chrome.runtime.sendMessage({
      type: MessageType.OPEN_SIDEPANEL,
      payload: { iocs: detectedIOCs },
    });
    hide();
  } catch (error) {
    console.error('Analiz başlatılamadı:', error);
  }
}

/**
 * Handle text selection change
 */
function handleSelectionChange(): void {
  if (selectionDebounceTimer) {
    clearTimeout(selectionDebounceTimer);
  }

  selectionDebounceTimer = window.setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';

    if (!selectedText) {
      if (currentSelection) {
        hide();
        currentSelection = '';
      }
      return;
    }

    if (selectedText === currentSelection) {
      return;
    }

    currentSelection = selectedText;

    const iocs = detectIOCs(selectedText);

    if (iocs.length > 0) {
      const range = selection!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      show(rect, iocs);
    } else {
      hide();
    }
  }, TIMING.SELECTION_DEBOUNCE);
}

/**
 * Handle mousedown to hide button when clicking outside
 */
function handleMouseDown(e: MouseEvent): void {
  const target = e.target as HTMLElement;

  if (!target.closest(`#${ELEMENT_IDS.FLOATING_BUTTON_ROOT}`)) {
    const selection = window.getSelection();
    if (!selection?.toString().trim()) {
      hide();
      currentSelection = '';
    }
  }
}

/**
 * Handle keyup for keyboard selection
 */
function handleKeyUp(e: KeyboardEvent): void {
  if (e.shiftKey || (e.ctrlKey && e.key === 'a')) {
    handleSelectionChange();
  }
}

/**
 * Initialize floating button event listeners
 */
export function initFloatingButton(): void {
  document.addEventListener('mouseup', handleSelectionChange);
  document.addEventListener('keyup', handleKeyUp);
  document.addEventListener('mousedown', handleMouseDown);
}

/**
 * Cleanup floating button event listeners
 */
export function cleanupFloatingButton(): void {
  document.removeEventListener('mouseup', handleSelectionChange);
  document.removeEventListener('keyup', handleKeyUp);
  document.removeEventListener('mousedown', handleMouseDown);

  if (floatingButtonContainer) {
    floatingButtonContainer.remove();
    floatingButtonContainer = null;
    floatingButtonRoot = null;
  }
}
