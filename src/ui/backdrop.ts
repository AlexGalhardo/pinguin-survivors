import type Phaser from 'phaser';
import { TEX } from '../art/manifest';
import { PALETTE } from '../config/palette';

const STAR_COLORS = [PALETTE.white, PALETTE.silver, PALETTE.steel, PALETTE.cyan, PALETTE.amber];

/** Twinkling pixel starfield for menus (covers up to 1280x1280 logical px). */
export function addStarfield(scene: Phaser.Scene, count = 180): void {
	for (let i = 0; i < count; i++) {
		const star = scene.add
			.image(Math.floor(Math.random() * 1280), Math.floor(Math.random() * 1280), TEX.fxPixel)
			.setOrigin(0, 0)
			.setScale(Math.random() < 0.15 ? 1 : 0.5)
			.setTint(STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)] ?? PALETTE.white)
			.setAlpha(0.3 + Math.random() * 0.7);
		if (Math.random() < 0.3) {
			scene.tweens.add({
				targets: star,
				alpha: 0.1,
				duration: 600 + Math.random() * 1400,
				yoyo: true,
				repeat: -1,
			});
		}
	}
}
