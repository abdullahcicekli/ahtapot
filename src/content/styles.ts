/**
 * Content Script Styles
 * Tüm inline CSS stilleri tek dosyada
 */

import { Z_INDEX, POSITIONING } from './constants';

// Brand Colors
export const COLORS = {
  primary: '#C7F54D',
  primaryDark: '#a8e000',
  background: '#1A1A1F',
  textLight: 'rgba(255, 255, 255, 0.9)',
  textMuted: 'rgba(255, 255, 255, 0.7)',
  border: 'rgba(255, 255, 255, 0.2)',
} as const;

/**
 * Floating button container style
 */
export const floatingButtonContainerStyle = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: ${Z_INDEX.FLOATING_BUTTON};
  pointer-events: none;
`;

/**
 * IOC Mark (highlight) base style
 */
export const iocMarkStyle = `
  all: unset !important;
  background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%) !important;
  color: ${COLORS.background} !important;
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

/**
 * IOC Mark hover state styles
 */
export const iocMarkHoverStyles = {
  enter: {
    color: COLORS.primary,
    background: COLORS.background,
    boxShadow: `0 0 12px rgba(199, 245, 77, 0.8), 0 0 24px rgba(199, 245, 77, 0.4)`,
    textShadow: '0 0 8px rgba(199, 245, 77, 0.9)',
  },
  leave: {
    color: COLORS.background,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    textShadow: 'none',
  },
} as const;

/**
 * Highlight UI container style
 */
export const highlightUIContainerStyle = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: ${Z_INDEX.HIGHLIGHT_UI};
`;

/**
 * Close button style
 */
export const closeButtonStyle = `
  position: fixed;
  top: ${POSITIONING.CLOSE_BUTTON_TOP}px;
  right: ${POSITIONING.CLOSE_BUTTON_RIGHT}px;
  width: ${POSITIONING.CLOSE_BUTTON_SIZE}px;
  height: ${POSITIONING.CLOSE_BUTTON_SIZE}px;
  background: ${COLORS.background};
  border: 2px solid ${COLORS.primary};
  border-radius: 50%;
  color: ${COLORS.primary};
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${Z_INDEX.CLOSE_BUTTON};
  transition: all 0.2s ease;
  pointer-events: auto;
`;

/**
 * Close button hover styles
 */
export const closeButtonHoverStyles = {
  enter: {
    background: COLORS.primary,
    color: COLORS.background,
  },
  leave: {
    background: COLORS.background,
    color: COLORS.primary,
  },
} as const;

/**
 * Info badge style
 */
export const infoBadgeStyle = `
  position: fixed;
  bottom: ${POSITIONING.INFO_BADGE_BOTTOM}px;
  left: 50%;
  transform: translateX(-50%);
  background: ${COLORS.background};
  border: 1px solid ${COLORS.primary};
  border-radius: 8px;
  padding: 12px 24px;
  color: ${COLORS.primary};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  z-index: ${Z_INDEX.INFO_BADGE};
  display: flex;
  align-items: center;
  gap: 12px;
  pointer-events: auto;
`;

/**
 * Toast style
 */
export const toastStyle = `
  position: fixed;
  bottom: ${POSITIONING.INFO_BADGE_BOTTOM}px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: ${COLORS.background};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  padding: 12px 24px;
  color: ${COLORS.textLight};
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

/**
 * Toast animation styles
 */
export const toastAnimationStyles = {
  visible: {
    transform: 'translateX(-50%) translateY(0)',
    opacity: '1',
  },
  hidden: {
    transform: 'translateX(-50%) translateY(100px)',
    opacity: '0',
  },
} as const;
