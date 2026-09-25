import type Phaser from 'phaser';
import { FONT } from '../art/manifest';
import { CELL_W } from '../art/placeholders/font-5x7';
import { PALETTE } from '../config/palette';

export interface TextOptions {
	color?: number;
	/** Integer scale (1 = 5x7 glyphs). */
	scale?: number;
	/** Origin shortcut: 0 = left, 0.5 = center, 1 = right. */
	originX?: number;
	originY?: number;
	align?: 'left' | 'center' | 'right';
}

/** Pixel-font text (BitmapText). Always integer scale. */
export function addText(
	scene: Phaser.Scene,
	x: number,
	y: number,
	text: string,
	opts: TextOptions = {},
): Phaser.GameObjects.BitmapText {
	const scale = Math.max(1, Math.round(opts.scale ?? 1));
	const t = scene.add.bitmapText(x, y, FONT.pixel, text, CELL_W * scale);

	if (opts.align === 'center') t.setCenterAlign();
	else if (opts.align === 'right') t.setRightAlign();
	t.setOrigin(opts.originX ?? 0, opts.originY ?? 0);
	t.setTint(opts.color ?? PALETTE.white);
	return t;
}
