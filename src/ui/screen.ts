import type Phaser from 'phaser';
import { PALETTE, toCss } from '../config/palette';
import { trackZoom } from '../core/viewport';
import type { ViewSize } from '../logic/viewport';
import { UI_FONT } from './font';
import { addVersionFooter } from './version-footer';

export const text = (size: number, color: number = PALETTE.textLight, wrap?: number) => ({
	fontFamily: UI_FONT,
	fontSize: `${size}px`,
	color: toCss(color),
	align: 'center',
	wordWrap: wrap ? { width: wrap } : undefined,
});

/**
 * Standard full-screen menu: night background, centered title, version footer and a layout
 * callback on every resize (logical size varies with the window).
 */
export function setupScreen(
	scene: Phaser.Scene,
	title: string,
	layout: (view: ViewSize, cx: number) => void,
): Phaser.GameObjects.Text {
	const cam = scene.cameras.main;
	cam.setBackgroundColor(PALETTE.night);
	const heading = scene.add.text(0, 0, title, text(20, PALETTE.crit)).setOrigin(0.5, 0);
	const footer = addVersionFooter(scene);
	trackZoom(scene, cam, (view) => {
		cam.centerOn(view.width / 2, view.height / 2);
		const cx = Math.round(view.width / 2);
		heading.setPosition(cx, 24);
		footer.layout(view);
		layout(view, cx);
	});
	return heading;
}
