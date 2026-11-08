import type Phaser from 'phaser';
import { PALETTE, toCss } from '../../config/palette';
import type { ViewSize } from '../../logic/viewport';
import { UI_FONT } from '../../ui/font';
import { buildLabel } from '../../ui/version-label';

export { buildLabel };

/**
 * Build version centered in the footer (main menu and HUD), so whoever is testing knows which
 * build is running. Call `layout` from the scene's resize handler.
 */
export function addVersionFooter(scene: Phaser.Scene): { layout: (view: ViewSize) => void } {
	const text = scene.add
		.text(0, 0, buildLabel(__APP_VERSION__, import.meta.env.DEV, __BUILD_NAME__), {
			fontFamily: UI_FONT,
			fontSize: '10px',
			color: toCss(PALETTE.textDim),
			stroke: toCss(PALETTE.night),
			strokeThickness: 2,
		})
		.setOrigin(0.5, 1)
		.setAlpha(0.8);
	return { layout: (view) => text.setPosition(Math.round(view.width / 2), view.height - 2) };
}
