/**
 * UI fonts, loaded in main.ts before the game boots (Text objects rasterize once).
 * Body/UI text: Rubik (clean and bold, readable at small sizes, latin-ext for PT-BR accents).
 * Big titles keep the pixel font for the retro look.
 */
export const UI_FONT = '"Rubik", "Segoe UI", sans-serif';
export const TITLE_FONT = '"Pixelify Sans", monospace';
/** Default weight for UI text (500 medium; titles and emphasis use 700). */
export const UI_WEIGHT = '500';
/**
 * Menu text scale: screens were laid out for the old tiny pixel font; Rubik at 1.3× reads well
 * at every resolution without reworking each layout.
 */
export const MENU_TEXT_SCALE = 1.3;

export const menuPx = (size: number): number => Math.round(size * MENU_TEXT_SCALE);
