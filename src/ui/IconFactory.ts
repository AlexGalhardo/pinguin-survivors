import type Phaser from 'phaser';
import { iconKey } from '../art/manifest';

/** Adds a 16x16 code-drawn icon (icon.<id>) at an integer scale. */
export function addIcon(
	scene: Phaser.Scene,
	x: number,
	y: number,
	id: string,
	scale = 1,
): Phaser.GameObjects.Image {
	const key = scene.textures.exists(iconKey(id)) ? iconKey(id) : iconKey('unknown');
	return scene.add.image(x, y, key).setScale(Math.max(1, Math.round(scale)));
}
