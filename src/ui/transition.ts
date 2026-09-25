import type Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { getView } from '../core/viewport';
import { TRANSITION } from '../data/juice';

/**
 * Pixel block transition: random blocks cover the screen (out) or uncover it (in).
 * Only for UI scenes (logical pixel coordinates).
 */
function blocks(scene: Phaser.Scene, cover: boolean, onDone?: () => void): void {
	// UI scenes use logical coordinates with (0, 0) at the top-left (fitUiCamera).
	const view = getView(scene);
	const left = 0;
	const top = 0;
	const cell = TRANSITION.cell;
	const cols = Math.ceil(view.width / cell) + 1;
	const rows = Math.ceil(view.height / cell) + 1;
	const total = cols * rows;
	let finished = 0;
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const r = scene.add
				.rectangle(left + x * cell, top + y * cell, cell, cell, PALETTE.void)
				.setOrigin(0, 0)
				.setDepth(10_000)
				.setAlpha(cover ? 0 : 1);
			scene.tweens.add({
				targets: r,
				alpha: cover ? 1 : 0,
				duration: 60,
				delay: Math.random() * TRANSITION.durationMs,
				onComplete: () => {
					if (!cover) r.destroy();
					finished++;
					if (finished === total) onDone?.();
				},
			});
		}
	}
}

/** Covers the screen with pixel blocks, then runs `onDone` (e.g. scene.start). */
export function pixelOut(scene: Phaser.Scene, onDone: () => void): void {
	if (scene.data.get('transitioning')) return;
	scene.data.set('transitioning', true);
	// scene.data survives a stop/start; scenes without pixelIn (GameOver) would stay locked forever.
	scene.events.once('shutdown', () => scene.data.set('transitioning', false));
	blocks(scene, true, onDone);
}

/** Uncovers the screen (call at the end of create()). */
export function pixelIn(scene: Phaser.Scene): void {
	scene.data.set('transitioning', false);
	blocks(scene, false);
}
