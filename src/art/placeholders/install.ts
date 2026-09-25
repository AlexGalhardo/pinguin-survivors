import Phaser from 'phaser';
import { PALETTE } from '../../config/palette';
import { FONT, iconKey, type TextureKey } from '../manifest';
import { CELL_H, CELL_W, CHARS_PER_ROW, FONT_CHARS, renderFontAtlas } from './font-5x7';
import { ICONS, renderIcon } from './icons';
import type { PixelCanvas } from './pixel-canvas';
import { PLACEHOLDERS, renderPlaceholder } from './textures';

function toTexture(scene: Phaser.Scene, key: string, pixels: PixelCanvas): void {
	if (scene.textures.exists(key)) scene.textures.remove(key);
	const tex = scene.textures.createCanvas(key, pixels.width, pixels.height);
	if (!tex) throw new Error(`Could not create canvas texture ${key}`);
	const image = new ImageData(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height);
	tex.putData(image, 0, 0);
	tex.refresh();
}

/** Generates every placeholder texture of the manifest (skips keys already loaded from real assets). */
export function installPlaceholders(scene: Phaser.Scene): void {
	for (const key of Object.keys(PLACEHOLDERS) as TextureKey[]) {
		if (!scene.textures.exists(key)) toTexture(scene, key, renderPlaceholder(key));
	}
}

/** Generates every 16x16 icon (icon.<id>). */
export function installIcons(scene: Phaser.Scene): void {
	for (const id of [...Object.keys(ICONS), 'unknown'])
		installPixels(scene, iconKey(id), renderIcon(id));
}

/** Registers any extra generated texture (e.g. icons) under a manifest-style key. */
export function installPixels(scene: Phaser.Scene, key: string, pixels: PixelCanvas): void {
	if (!scene.textures.exists(key)) toTexture(scene, key, pixels);
}

/** Builds the 5x7 bitmap font texture and registers it as a RetroFont (BitmapText). */
export function installPixelFont(scene: Phaser.Scene): void {
	const imageKey = `${FONT.pixel}.image`;
	toTexture(scene, imageKey, renderFontAtlas(PALETTE.white, PALETTE.void));
	// Phaser's typings say Parse returns BitmapFontData, but it returns the full cache entry.
	const entry: unknown = Phaser.GameObjects.RetroFont.Parse(scene, {
		image: imageKey,
		width: CELL_W,
		height: CELL_H,
		chars: FONT_CHARS,
		charsPerRow: CHARS_PER_ROW,
		'offset.x': 0,
		'offset.y': 0,
		'spacing.x': 0,
		'spacing.y': 0,
		lineSpacing: 2,
	});
	scene.cache.bitmapFont.add(FONT.pixel, entry);
}
