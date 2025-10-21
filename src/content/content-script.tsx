import ReactDOM from 'react-dom/client';
import FloatingButton from '@/components/FloatingButton';
import { detectIOCs } from '@/utils/ioc-detector';
import { MessageType } from '@/types/messages';
import { DetectedIOC } from '@/types/ioc';

/**
 * Content Script - Sayfa içinde çalışır
 * Metin seçimlerini dinler ve floating button gösterir
 */

let floatingButtonRoot: ReactDOM.Root | null = null;
let floatingButtonContainer: HTMLDivElement | null = null;
let currentSelection: string = '';
let detectedIOCs: DetectedIOC[] = [];

// Floating button container'ını oluştur
function createFloatingButtonContainer(): HTMLDivElement {
  if (floatingButtonContainer) {
    return floatingButtonContainer;
  }

  const container = document.createElement('div');
  container.id = 'ahtapot-floating-button-root';
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2147483647;
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
    top: rect.top - 2,
    left: rect.right + 5,
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
  }, 100);
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

  if (!target.closest('#ahtapot-floating-button-root')) {
    const selection = window.getSelection();
    if (!selection?.toString().trim()) {
      hideFloatingButton();
      currentSelection = '';
    }
  }
});
