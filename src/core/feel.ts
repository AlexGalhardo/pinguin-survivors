import type Phaser from 'phaser';
import { getSave } from './context';

/** Camera shake that respects Settings → Screen shake. */
export function shake(scene: Phaser.Scene, durationMs: number, intensity: number): void {
	if (getSave(scene).settings.screenShake) scene.cameras.main.shake(durationMs, intensity);
}
