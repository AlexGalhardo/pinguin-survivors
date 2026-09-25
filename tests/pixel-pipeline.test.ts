import { describe, expect, it } from 'bun:test';
import {
	anchorAndOutline,
	blockDownscale,
	chromaKey,
	makeImage,
	nearestPaletteColor,
	pixelize,
	removeOrphans,
	trim,
} from '../scripts/lib/pixel-pipeline';
import { shelfPack } from '../scripts/lib/shelf-pack';
import { PALETTE } from '../src/config/palette';

function fill(w: number, h: number, rgb: number) {
	const img = makeImage(w, h);
	for (let i = 0; i < img.data.length; i += 4) {
		img.data[i] = (rgb >> 16) & 255;
		img.data[i + 1] = (rgb >> 8) & 255;
		img.data[i + 2] = rgb & 255;
		img.data[i + 3] = 255;
	}
	return img;
}

function setPx(img: ReturnType<typeof makeImage>, x: number, y: number, rgb: number) {
	const i = (y * img.width + x) * 4;
	img.data[i] = (rgb >> 16) & 255;
	img.data[i + 1] = (rgb >> 8) & 255;
	img.data[i + 2] = rgb & 255;
	img.data[i + 3] = 255;
}

describe('pixel pipeline', () => {
	it('keys out magenta and trims to the subject', () => {
		const img = fill(40, 40, 0xff00ff);
		for (let y = 10; y < 20; y++) for (let x = 5; x < 15; x++) setPx(img, x, y, 0x3e8948);
		const t = trim(chromaKey(img));
		expect([t.width, t.height]).toEqual([10, 10]);
	});

	it('quantizes to the Endesga 32 palette', () => {
		expect(nearestPaletteColor(0xff0000)).toBe(PALETTE.magenta);
		expect(nearestPaletteColor(0xfefefe)).toBe(PALETTE.white);
	});

	it('downscales blocks by mode color', () => {
		const img = fill(64, 64, 0x0099db);
		const small = blockDownscale(img, 16);
		expect([small.width, small.height]).toEqual([16, 16]);
		expect(small.data[3]).toBe(255);
	});

	it('removes orphans and anchors with an outline', () => {
		const img = makeImage(5, 5);
		setPx(img, 2, 2, 0xffffff);
		expect(removeOrphans(img).data[(2 * 5 + 2) * 4 + 3]).toBe(0);
		const sq = fill(4, 4, 0xffffff);
		const out = anchorAndOutline(sq, 8);
		// Bottom row of the sprite sits on y = 6 (one row left for the outline).
		expect(out.data[(6 * 8 + 3) * 4 + 3]).toBe(255);
		expect(out.data[(7 * 8 + 3) * 4]).toBe((PALETTE.void >> 16) & 255);
	});

	it('runs end to end', () => {
		const img = fill(100, 100, 0xff00ff);
		for (let y = 20; y < 90; y++) for (let x = 30; x < 70; x++) setPx(img, x, y, 0x2ce8f5);
		const out = pixelize(img, 32);
		expect([out.width, out.height]).toEqual([32, 32]);
	});

	it('shelf-packs sprites without overlaps', () => {
		const items = Array.from({ length: 20 }, (_, i) => ({
			key: `k${i}`,
			file: `${i}.png`,
			w: 32,
			h: 32,
		}));
		const { width, rects } = shelfPack(items, 128, 1);
		expect(width).toBe(128);
		for (const a of rects) {
			for (const b of rects) {
				if (a === b) continue;
				const overlap =
					a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
				expect(overlap).toBe(false);
			}
		}
	});
});
