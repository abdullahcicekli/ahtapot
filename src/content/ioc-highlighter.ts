import { DetectedIOC } from '@/types/ioc';
import { detectIOCsForHighlight } from '@/utils/ioc-detector';
import highlightStyles from './ioc-highlighter.css?inline';

/**
 * IOC Highlighter — sayfayı tarar, tespit ettiği IOC'leri <span> ile sarar.
 *
 * Floating button'ın seçim akışından farkı: burada tarama sayfanın tamamında
 * yapılır ve her işaret kendi IOC'sini taşır; hover edildiğinde yalnızca o
 * gösterge için analiz teklif edilir.
 *
 * İşaretler sayfanın kendi DOM'una girdiği için (Shadow DOM'a değil) stiller
 * ayrı bir <style> ile document'a enjekte edilir ve sınıf adı marka ön ekiyle
 * izole edilir.
 */

export const MARK_CLASS = 'ahtapot-ioc-mark';

const STYLE_ELEMENT_ID = 'ahtapot-ioc-highlight-styles';

/** Tek bir sayfada boyanacak azami işaret — patolojik sayfalarda fren. */
const MAX_MARKS = 500;

/** Bir idle diliminde işlenecek text node sayısı. */
const NODES_PER_CHUNK = 40;

/** DOM değişikliklerini toplayıp tek taramada işlemek için bekleme. */
const MUTATION_DEBOUNCE_MS = 400;

/** Tarama dışı bırakılan etiketler — içerikleri IOC olarak anlamlı değil. */
const SKIPPED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEXTAREA',
  'INPUT',
  'SELECT',
  'OPTION',
  'SVG',
  'CANVAS',
  'IFRAME',
  'HEAD',
  'TITLE',
  'META',
  'LINK',
]);

export interface IOCMarkEvent {
  element: HTMLElement;
  ioc: DetectedIOC;
}

interface HighlighterCallbacks {
  onMarkEnter: (event: IOCMarkEvent) => void;
  onMarkLeave: (event: IOCMarkEvent) => void;
}

let active = false;
let callbacks: HighlighterCallbacks | null = null;
let markCount = 0;
let observer: MutationObserver | null = null;
let mutationTimer: number | undefined;
let scanHandle: number | undefined;
/** Kendi DOM değişikliklerimizi observer'da tekrar işlememek için. */
let mutating = false;
const pendingRoots = new Set<Node>();

/* ------------------------------------------------------------------ */
/* Stil                                                                */
/* ------------------------------------------------------------------ */

function injectStyles(): void {
  if (document.getElementById(STYLE_ELEMENT_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = highlightStyles;
  (document.head || document.documentElement).appendChild(style);
}

function removeStyles(): void {
  document.getElementById(STYLE_ELEMENT_ID)?.remove();
}

/* ------------------------------------------------------------------ */
/* Tarama                                                              */
/* ------------------------------------------------------------------ */

function isSkippedElement(element: Element): boolean {
  if (SKIPPED_TAGS.has(element.tagName)) return true;
  if (element.id === 'ahtapot-floating-button-root') return true;
  if (element.classList.contains(MARK_CLASS)) return true;

  const html = element as HTMLElement;
  if (html.isContentEditable) return true;

  return false;
}

function shouldVisitTextNode(node: Text): boolean {
  const text = node.nodeValue;
  // En kısa anlamlı IOC (ör. "a.io") 4 karakter; altını taramaya değmez.
  if (!text || text.trim().length < 4) return false;

  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    if (isSkippedElement(parent)) return false;
  }

  return true;
}

function collectTextNodes(root: Node): Text[] {
  // Kök zaten elenmiş bir ağacın içindeyse hiç yürüme.
  if (root.nodeType === Node.ELEMENT_NODE && isSkippedElement(root as Element)) {
    return [];
  }

  const nodes: Text[] = [];

  if (root.nodeType === Node.TEXT_NODE) {
    if (shouldVisitTextNode(root as Text)) nodes.push(root as Text);
    return nodes;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      shouldVisitTextNode(node as Text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
  });

  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }

  return nodes;
}

/**
 * Tek bir text node'u IOC'lerinden bölerek <span> işaretleriyle değiştirir.
 * @returns Eklenen işaret sayısı
 */
function highlightTextNode(node: Text): number {
  const text = node.nodeValue;
  if (!text || !node.parentNode) return 0;

  const iocs = detectIOCsForHighlight(text);
  if (iocs.length === 0) return 0;

  const fragment = document.createDocumentFragment();
  let cursor = 0;
  let added = 0;

  for (const ioc of iocs) {
    if (markCount + added >= MAX_MARKS) break;

    const { start, end } = ioc.source;
    if (start < cursor || end > text.length || end <= start) continue;

    if (start > cursor) {
      fragment.appendChild(document.createTextNode(text.slice(cursor, start)));
    }

    const mark = document.createElement('span');
    mark.className = MARK_CLASS;
    mark.dataset.ahtapotIocType = ioc.type;
    mark.dataset.ahtapotIocValue = ioc.value;
    mark.textContent = text.slice(start, end);
    fragment.appendChild(mark);

    cursor = end;
    added++;
  }

  if (added === 0) return 0;

  if (cursor < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(cursor)));
  }

  node.parentNode.replaceChild(fragment, node);
  return added;
}

function processNodes(nodes: Text[], index: number): void {
  if (!active) return;

  const limit = Math.min(index + NODES_PER_CHUNK, nodes.length);

  mutating = true;
  for (let i = index; i < limit; i++) {
    if (markCount >= MAX_MARKS) break;
    // Önceki dilimde ağaçtan koparılmış olabilir.
    if (!nodes[i].isConnected) continue;
    markCount += highlightTextNode(nodes[i]);
  }
  mutating = false;

  if (limit < nodes.length && markCount < MAX_MARKS) {
    scanHandle = requestIdle(() => processNodes(nodes, limit));
  } else {
    scanHandle = undefined;
  }
}

function requestIdle(callback: () => void): number {
  const idle = (window as Window & typeof globalThis & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  }).requestIdleCallback;

  return idle ? idle(callback, { timeout: 500 }) : window.setTimeout(callback, 16);
}

function scan(root: Node): void {
  if (!active || markCount >= MAX_MARKS) return;

  const nodes = collectTextNodes(root);
  if (nodes.length === 0) return;

  processNodes(nodes, 0);
}

/* ------------------------------------------------------------------ */
/* Temizlik                                                            */
/* ------------------------------------------------------------------ */

function unwrapAllMarks(): void {
  mutating = true;

  document.querySelectorAll<HTMLElement>(`.${MARK_CLASS}`).forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;

    parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
    // Bölünmüş text node'ları birleştir ki tekrar açıldığında
    // sınırda kalan IOC'ler yeniden bulunabilsin.
    parent.normalize();
  });

  mutating = false;
  markCount = 0;
}

/* ------------------------------------------------------------------ */
/* Hover                                                               */
/* ------------------------------------------------------------------ */

function markFromEvent(event: Event): HTMLElement | null {
  const target = event.target as HTMLElement | null;
  if (!target || typeof target.closest !== 'function') return null;

  return target.closest<HTMLElement>(`.${MARK_CLASS}`);
}

function iocFromMark(mark: HTMLElement): DetectedIOC | null {
  const type = mark.dataset.ahtapotIocType as DetectedIOC['type'] | undefined;
  const value = mark.dataset.ahtapotIocValue;

  if (!type || !value) return null;
  return { type, value };
}

function handleMouseOver(event: MouseEvent): void {
  const mark = markFromEvent(event);
  if (!mark || !callbacks) return;

  // Aynı işaretin içindeki alt elemanlar arasında gezinirken tekrar tetikleme.
  const related = event.relatedTarget as HTMLElement | null;
  if (related && typeof related.closest === 'function' && related.closest(`.${MARK_CLASS}`) === mark) {
    return;
  }

  const ioc = iocFromMark(mark);
  if (ioc) callbacks.onMarkEnter({ element: mark, ioc });
}

function handleMouseOut(event: MouseEvent): void {
  const mark = markFromEvent(event);
  if (!mark || !callbacks) return;

  const related = event.relatedTarget as HTMLElement | null;
  if (related && typeof related.closest === 'function' && related.closest(`.${MARK_CLASS}`) === mark) {
    return;
  }

  const ioc = iocFromMark(mark);
  if (ioc) callbacks.onMarkLeave({ element: mark, ioc });
}

/* ------------------------------------------------------------------ */
/* Dinamik içerik                                                      */
/* ------------------------------------------------------------------ */

function flushPendingRoots(): void {
  mutationTimer = undefined;

  const roots = Array.from(pendingRoots);
  pendingRoots.clear();

  for (const root of roots) {
    if (root.isConnected) scan(root);
  }
}

function handleMutations(records: MutationRecord[]): void {
  if (!active || mutating || markCount >= MAX_MARKS) return;

  for (const record of records) {
    record.addedNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
        pendingRoots.add(node);
      }
    });
  }

  if (pendingRoots.size === 0) return;

  if (mutationTimer) clearTimeout(mutationTimer);
  mutationTimer = window.setTimeout(flushPendingRoots, MUTATION_DEBOUNCE_MS);
}

/* ------------------------------------------------------------------ */
/* Genel API                                                           */
/* ------------------------------------------------------------------ */

export function startHighlighting(handlers: HighlighterCallbacks): void {
  if (active) return;

  active = true;
  callbacks = handlers;
  markCount = 0;

  injectStyles();

  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);

  observer = new MutationObserver(handleMutations);
  observer.observe(document.body, { childList: true, subtree: true });

  scan(document.body);
}

export function stopHighlighting(): void {
  if (!active) return;

  active = false;

  document.removeEventListener('mouseover', handleMouseOver, true);
  document.removeEventListener('mouseout', handleMouseOut, true);

  observer?.disconnect();
  observer = null;

  if (mutationTimer) {
    clearTimeout(mutationTimer);
    mutationTimer = undefined;
  }
  if (scanHandle !== undefined) {
    scanHandle = undefined;
  }
  pendingRoots.clear();

  unwrapAllMarks();
  removeStyles();

  callbacks = null;
}

export function isHighlighting(): boolean {
  return active;
}
