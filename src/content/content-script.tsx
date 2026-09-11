import ReactDOM from 'react-dom/client';
import FloatingButton from '@/components/FloatingButton';
import { detectIOCs } from '@/utils/ioc-detector';
import { MessageType } from '@/types/messages';
import { DetectedIOC } from '@/types/ioc';
import {
  HIGHLIGHT_SETTINGS_KEY,
  HighlightSettings,
  getHighlightSettings,
} from '@/utils/highlightSettings';
import { IOCMarkEvent, isHighlighting, startHighlighting, stopHighlighting } from './ioc-highlighter';
import floatingButtonStyles from './content-script.css?inline';

/**
 * Content Script - Sayfa içinde çalışır
 *
 * İki akış aynı butonu paylaşır:
 *  - Seçim: kullanıcı metin seçtiğinde seçimdeki tüm IOC'ler
 *  - Hover: highlight açıkken bir işaretin üstüne gelindiğinde yalnızca o IOC
 * Seçim akışı önceliklidir; aktif bir seçim varken hover butonu açmaz.
 */

let floatingButtonRoot: ReactDOM.Root | null = null;
let floatingButtonContainer: HTMLDivElement | null = null;
let currentSelection: string = '';
let detectedIOCs: DetectedIOC[] = [];

type ButtonOwner = 'selection' | 'hover' | null;
let buttonOwner: ButtonOwner = null;

/** Hover'da işaretten butona giderken imleç boşluğa düşer; bu gecikme onu tolere eder. */
const HOVER_HIDE_DELAY_MS = 180;
let hoverHideTimer: number | undefined;

// Floating button container'ını oluştur.
// Shadow DOM: sayfanın kendi button/pseudo-element stilleri balona sızmasın,
// bizim stillerimiz de sayfayı etkilemesin diye tam izolasyon.
function createFloatingButtonContainer(): HTMLDivElement {
  if (floatingButtonContainer) {
    return floatingButtonContainer;
  }

  const host = document.createElement('div');
  host.id = 'ahtapot-floating-button-root';
  host.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    z-index: 2147483647;
  `;

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = floatingButtonStyles;
  shadow.appendChild(style);

  const mount = document.createElement('div');
  shadow.appendChild(mount);
  document.body.appendChild(host);

  // Shadow DOM içindeki butonun olayları host'a retarget edilir; hover akışında
  // imleç butona geçtiğinde gizleme zamanlayıcısını iptal etmek için dinliyoruz.
  host.addEventListener('mouseenter', cancelHoverHide, true);
  host.addEventListener('mouseover', cancelHoverHide, true);
  host.addEventListener('mouseleave', scheduleHoverHide, true);

  floatingButtonContainer = host;
  floatingButtonRoot = ReactDOM.createRoot(mount);

  return host;
}

/** Buton kompakt ~44px, hover'da ~180px'e genişler; viewport dışına taşırma. */
const BUTTON_WIDTH = 44;
const BUTTON_EXPANDED_WIDTH = 180;

function anchorToRect(rect: DOMRect): { top: number; left: number } {
  return {
    top: Math.min(rect.bottom + 6, window.innerHeight - BUTTON_WIDTH - 8),
    left: Math.min(Math.max(rect.right + 6, 8), window.innerWidth - BUTTON_EXPANDED_WIDTH),
  };
}

/**
 * Seçim okuma yönünde biter: buton, seçim çokgeninin en alt satırının
 * sağ ucunda (bitiş noktasında) çıkmalı — ilk satırın sağında değil.
 */
function selectionAnchor(range: Range): { top: number; left: number } {
  let anchor: DOMRect | null = null;

  for (const rect of Array.from(range.getClientRects())) {
    if (rect.width === 0 && rect.height === 0) continue;
    if (
      !anchor ||
      rect.bottom > anchor.bottom + 1 ||
      (Math.abs(rect.bottom - anchor.bottom) <= 1 && rect.right > anchor.right)
    ) {
      anchor = rect;
    }
  }

  return anchorToRect(anchor ?? range.getBoundingClientRect());
}

function renderFloatingButton(
  position: { top: number; left: number },
  iocs: DetectedIOC[],
  owner: Exclude<ButtonOwner, null>
) {
  if (!floatingButtonRoot) {
    createFloatingButtonContainer();
  }

  detectedIOCs = iocs;
  buttonOwner = owner;

  floatingButtonRoot!.render(
    <FloatingButton
      position={position}
      iocs={iocs}
      onAnalyze={handleAnalyze}
      onClose={hideFloatingButton}
    />
  );
}

function showFloatingButton(range: Range, iocs: DetectedIOC[]) {
  renderFloatingButton(selectionAnchor(range), iocs, 'selection');
}

// Floating button'ı gizle
function hideFloatingButton() {
  cancelHoverHide();
  buttonOwner = null;

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
        if (buttonOwner === 'selection') hideFloatingButton();
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
      const range = selection!.getRangeAt(selection!.rangeCount - 1);
      showFloatingButton(range, iocs);
    } else if (buttonOwner === 'selection') {
      hideFloatingButton();
    }
  }, 100);
}

/* ------------------------------------------------------------------ */
/* Highlight akışı                                                     */
/* ------------------------------------------------------------------ */

function cancelHoverHide() {
  if (hoverHideTimer) {
    clearTimeout(hoverHideTimer);
    hoverHideTimer = undefined;
  }
}

function scheduleHoverHide() {
  if (buttonOwner !== 'hover') return;

  cancelHoverHide();
  hoverHideTimer = window.setTimeout(() => {
    hoverHideTimer = undefined;
    if (buttonOwner === 'hover') hideFloatingButton();
  }, HOVER_HIDE_DELAY_MS);
}

function handleMarkEnter({ element, ioc }: IOCMarkEvent) {
  // Kullanıcı metin seçmişse seçim butonu öncelikli — üstüne yazma.
  if (window.getSelection()?.toString().trim()) return;

  cancelHoverHide();
  renderFloatingButton(anchorToRect(element.getBoundingClientRect()), [ioc], 'hover');
}

function handleMarkLeave() {
  scheduleHoverHide();
}

async function applyHighlightSetting(enabled: boolean) {
  if (enabled === isHighlighting()) return;

  if (enabled) {
    startHighlighting({ onMarkEnter: handleMarkEnter, onMarkLeave: handleMarkLeave });
  } else {
    if (buttonOwner === 'hover') hideFloatingButton();
    stopHighlighting();
  }
}

async function initHighlighting() {
  const settings = await getHighlightSettings();
  await applyHighlightSetting(settings.enabled);
}

// Ayar değişince açık sekmeler kendini günceller; yenileme gerekmez.
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes[HIGHLIGHT_SETTINGS_KEY]) return;

  const next = changes[HIGHLIGHT_SETTINGS_KEY].newValue as HighlightSettings | undefined;
  void applyHighlightSetting(next?.enabled ?? false);
});

void initHighlighting();

/* ------------------------------------------------------------------ */
/* Seçim olayları                                                      */
/* ------------------------------------------------------------------ */

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
      if (buttonOwner === 'selection') hideFloatingButton();
      currentSelection = '';
    }
  }
});
