/**
 * UI fonts, loaded in main.ts before the game boots (Text objects rasterize once).
 * Roboto everywhere (developer request: no pixel font, for readability); titles use weight 900.
 * Noto Sans SC is only a fallback in the
 * stack: its CSS is loaded on demand by `ensureLangFont` (src/ui/lang-font.ts) for zh-CN.
 */
export const UI_FONT = '"Roboto", "Noto Sans SC", "Segoe UI", sans-serif';
export const TITLE_FONT = UI_FONT;
/** Default weight for UI text (500 medium; titles and emphasis use 700). */
export const UI_WEIGHT = '500';
/**
 * Menu text scale: screens were laid out for the old tiny pixel font; Roboto at 1.3× reads well
 * at every resolution without reworking each layout.
 */
export const MENU_TEXT_SCALE = 1.3;

export const menuPx = (size: number): number => Math.round(size * MENU_TEXT_SCALE);
