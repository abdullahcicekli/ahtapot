/**
 * Content Script Constants
 * Magic numbers ve z-index değerleri için tek kaynak
 */

// Z-index values - Extension elementlerinin sayfa üzerinde görünmesi için
export const Z_INDEX = {
  FLOATING_BUTTON: 9999999,
  HIGHLIGHT_UI: 9999999,
  CLOSE_BUTTON: 9999999,
  INFO_BADGE: 9999999,
  TOAST: 9999999,
} as const;

// Timing constants (milliseconds)
export const TIMING = {
  SELECTION_DEBOUNCE: 100,
  TOAST_DURATION: 3000,
  TOAST_FADE_OUT: 300,
} as const;

// UI positioning
export const POSITIONING = {
  FLOATING_BUTTON_OFFSET_TOP: -2,
  FLOATING_BUTTON_OFFSET_LEFT: 5,
  CLOSE_BUTTON_TOP: 20,
  CLOSE_BUTTON_RIGHT: 20,
  CLOSE_BUTTON_SIZE: 40,
  INFO_BADGE_BOTTOM: 20,
} as const;

// CSS colors - Ahtapot brand
export const COLORS = {
  PRIMARY: '#C7F54D',
  PRIMARY_DARK: '#a8e000',
  BACKGROUND: '#1A1A1F',
  TEXT_LIGHT: 'rgba(255, 255, 255, 0.9)',
} as const;

// Element IDs
export const ELEMENT_IDS = {
  FLOATING_BUTTON_ROOT: 'ahtapot-floating-button-root',
  HIGHLIGHT_UI: 'ahtapot-highlight-ui',
  NO_IOCS_TOAST: 'ahtapot-no-iocs-toast',
} as const;

// CSS class names
export const CSS_CLASSES = {
  IOC_MARK: 'ahtapot-ioc-mark',
} as const;

// Excluded tags for text node traversal
export const EXCLUDED_TAGS = [
  'script',
  'style',
  'noscript',
  'iframe',
  'textarea',
  'input',
] as const;
