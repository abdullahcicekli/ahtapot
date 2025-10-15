import ReactDOM from 'react-dom/client';
import FloatingButton from '@/components/FloatingButton';
import { detectIOCs, hasIOCs } from '@/utils/ioc-detector';
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

function handleSelectionChange() {
  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';

    if (!selectedText || selectedText === currentSelection) {
      if (!selectedText) {
        hideFloatingButton();
        currentSelection = '';
      }
      return;
    }

    currentSelection = selectedText;

    const hasIOC = hasIOCs(selectedText);

    if (hasIOC) {
      const iocs = detectIOCs(selectedText);
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
