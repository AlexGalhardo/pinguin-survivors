import { PALETTE as P } from '../../config/palette';
import { GLYPH_H, GLYPH_W, glyphFor } from './font-5x7';
import type { PixelCanvas } from './pixel-canvas';

export const LOGO_W = 176;
export const LOGO_H = 58;
export const KEYART_W = 640;
export const KEYART_H = 150;

/** Checkerboard dither mask: blends two palette colors without leaving the palette. */
function dither(x: number, y: number): boolean {
	return ((x + y) & 1) === 0;
}

/**
 * Draws a word with the 5x7 font where each glyph pixel becomes a `block` x `block` square.
 * `rowColor(v)` picks the fill by vertical position (0..1) for a banded metal gradient.
 */
function blockWord(
	c: PixelCanvas,
	text: string,
	x0: number,
	y0: number,
	block: number,
	gap: number,
	rowColor: (v: number) => number,
): void {
	const h = GLYPH_H * block;
	[...text].forEach((ch, i) => {
		const glyph = glyphFor(ch);
		const ox = x0 + i * (GLYPH_W * block + gap);
		for (let gy = 0; gy < GLYPH_H; gy++) {
			for (let gx = 0; gx < GLYPH_W; gx++) {
				if (glyph[gy]?.[gx] !== '#') continue;
				for (let by = 0; by < block; by++) {
					const y = y0 + gy * block + by;
					const color = rowColor((y - y0) / (h - 1));
					for (let bx = 0; bx < block; bx++) c.px(ox + gx * block + bx, y, color);
				}
			}
		}
	});
}

function wordWidth(text: string, block: number, gap: number): number {
	return text.length * (GLYPH_W * block + gap) - gap;
}

/** Recolors every opaque pixel whose upper neighbor is empty (a 1 px top highlight). */
function topHighlight(c: PixelCanvas, from: number, color: number): void {
	const marks: [number, number][] = [];
	for (let y = 1; y < c.height; y++) {
		for (let x = 0; x < c.width; x++) {
			if (c.colorAt(x, y) === from && c.alphaAt(x, y - 1) === 0) marks.push([x, y]);
		}
	}
	for (const [x, y] of marks) c.px(x, y, color);
}

/** Copies the opaque silhouette 2 px down-right in `color`, under what is already drawn. */
function dropShadow(c: PixelCanvas, dx: number, dy: number, color: number): void {
	const opaque: [number, number][] = [];
	for (let y = 0; y < c.height; y++) {
		for (let x = 0; x < c.width; x++) if (c.alphaAt(x, y) > 0) opaque.push([x, y]);
	}
	const taken = new Set(opaque.map(([x, y]) => y * c.width + x));
	for (const [x, y] of opaque) {
		const tx = x + dx;
		const ty = y + dy;
		if (!taken.has(ty * c.width + tx)) c.px(tx, ty, color);
	}
}

/**
 * Falling star heading down-right: a bright sparkle head and a 2 px tail that cools from yellow
 * to orange. `faint` draws only the dithered far end (after the outline pass, so it stays soft).
 */
function fallingStar(c: PixelCanvas, hx: number, hy: number, length: number, faint: boolean): void {
	for (let i = length; i >= 4; i--) {
		const t = i / length;
		const x = hx - i;
		const y = hy - Math.round(i * 0.3);
		if (t > 0.7) {
			if (faint && dither(x, y)) c.px(x, y, P.slate);
			continue;
		}
		if (faint) continue;
		const color = t > 0.45 ? P.orange : t > 0.2 ? P.amber : P.yellow;
		c.px(x, y, color);
		if (t < 0.55) c.px(x, y + 1, color);
	}
	if (faint) return;
	c.pattern(
		hx - 3,
		hy - 3,
		['...#...', '..#Y#..', '.#YWY#.', '#YWWWY#', '.#YWY#.', '..#Y#..', '...#...'],
		{
			'#': P.amber,
			Y: P.yellow,
			W: P.white,
		},
	);
}

/** Title logo: STARFALL in banded gold block letters, SURVIVORS in cyan, a falling star. */
export function drawLogo(c: PixelCanvas): void {
	const block = 3;
	const gap = 3;
	const top = 16;
	const w = wordWidth('STARFALL', block, gap);
	const x0 = Math.floor((LOGO_W - w) / 2);
	blockWord(c, 'STARFALL', x0, top, block, gap, (v) =>
		v < 0.3 ? P.yellow : v < 0.62 ? P.amber : v < 0.86 ? P.orange : P.rust,
	);
	topHighlight(c, P.yellow, P.white);

	const sub = 'SURVIVORS';
	const subGap = 3;
	const sw = wordWidth(sub, 1, subGap);
	const sx = Math.floor((LOGO_W - sw) / 2);
	const sy = top + GLYPH_H * block + 7;
	blockWord(c, sub, sx, sy, 1, subGap, () => P.cyan);
	// Thin rules on both sides of the subtitle, darker at the far ends.
	const ruleY = sy + 3;
	for (let i = 0; i < 24; i++) {
		const color = i < 18 ? P.blue : P.navy;
		c.px(sx - 6 - i, ruleY, color);
		c.px(sx + sw + 5 + i, ruleY, color);
	}

	// The star falls toward the first A; its solid part shares the letters' outline and shadow.
	const starX = x0 + 2 * (GLYPH_W * block + gap) + 7;
	fallingStar(c, starX, 9, 64, false);
	c.outline(P.void);
	dropShadow(c, 2, 2, P.plum);
	fallingStar(c, starX, 9, 64, true);
}

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Ordered 4x4 Bayer threshold in [0, 1): smooth ramps with palette colors only. */
function bayer(x: number, y: number): number {
	return ((BAYER4[(y & 3) * 4 + (x & 3)] ?? 0) + 0.5) / 16;
}

/** Night-to-day ramp of the planet surface (all Endesga 32). */
const SURFACE = [P.void, P.midnight, P.darkSlate, P.navy, P.blue] as const;

/** Picks a ramp color for a light level in [0, 1] with ordered dithering between steps. */
function rampAt(level: number, x: number, y: number): number {
	const v = Math.max(0, Math.min(0.999, level)) * (SURFACE.length - 1);
	const i = Math.floor(v);
	const next = v - i > bayer(x, y) ? i + 1 : i;
	return SURFACE[Math.min(SURFACE.length - 1, next)] ?? P.void;
}

/** Menu key art: the horizon of a cold planet with an atmosphere rim and meteors falling in. */
export function drawKeyArt(c: PixelCanvas): void {
	const cx = KEYART_W / 2;
	const r = 520;
	const cy = 40 + r;
	// Light from the upper left and slightly toward the viewer.
	const lx = -0.55;
	const ly = -0.45;
	const lz = 0.7;
	for (let y = 0; y < KEYART_H; y++) {
		for (let x = 0; x < KEYART_W; x++) {
			const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
			if (d > r + 3) continue;
			// 0 on the lit (left) limb, 1 deep on the night side: the atmosphere fades with it.
			const night = Math.max(0, Math.min(1, ((x - cx) / cx) * 1.6 - 0.2));
			if (d > r) {
				// Atmosphere halo: 1 px blue, then a dithered navy fringe.
				if (d <= r + 1) c.px(x, y, night > bayer(x, y) ? P.navy : P.blue);
				else if (dither(x, y) && night < 0.8) c.px(x, y, P.navy);
				continue;
			}
			const depth = r - d;
			if (depth < 1) {
				c.px(x, y, night > bayer(x, y) + 0.3 ? P.blue : P.cyan);
				continue;
			}
			// Only a thin cap is visible, so the normal is mostly "up" (-y) with a side tilt.
			const nx = (x + 0.5 - cx) / r;
			const ny = -0.35 - Math.min(1, depth / 110) * 0.4;
			const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
			const light = Math.max(0, nx * lx + ny * ly + nz * lz);
			// Atmospheric scattering brightens the limb.
			const limb = Math.max(0, 1 - depth / 10) * 0.35 * (1 - night);
			c.px(x, y, rampAt(light * 0.72 + limb, x, y));
		}
	}
	// Craters: shaded upper-left wall, lit lower-right rim (perspective squashes them).
	const craters: [number, number, number][] = [
		[232, 80, 8],
		[378, 72, 5],
		[292, 114, 13],
		[170, 128, 7],
		[456, 120, 9],
	];
	for (const [x, y, s] of craters) {
		const ry = Math.max(2, Math.round(s * (0.3 + (y - 40) / 300)));
		const floor = c.colorAt(x, y);
		c.ellipse(x, y, s, ry, P.void);
		c.ellipse(x + 1, y + 1, s - 1, ry - 1, floor);
		for (let i = -s + 3; i <= s - 2; i++) {
			const t = i / s;
			const edge = Math.round(ry * Math.sqrt(Math.max(0, 1 - t * t)));
			if (i > -s / 3) c.px(x + i, y + edge, P.steel);
		}
	}
	// Meteors on their way down: faint dithered tails, hot 2x2 heads, all falling down-right.
	const meteors: [number, number, number][] = [
		[100, 30, 44],
		[528, 18, 30],
		[604, 60, 20],
		[44, 96, 18],
	];
	for (const [hx, hy, len] of meteors) {
		for (let i = len; i >= 2; i--) {
			const t = i / len;
			const x = hx - i;
			const y = hy - Math.round(i * 0.3);
			if (t > 0.55) {
				if (dither(x, y)) c.px(x, y, P.slate);
				continue;
			}
			c.px(x, y, t > 0.25 ? P.orange : P.amber);
		}
		c.rect(hx - 1, hy - 1, 2, 2, P.yellow);
		c.px(hx, hy - 1, P.white);
	}
}

export const FAVICON_SIZE = 32;

/** Browser tab icon: the logo's falling star over a night tile with a sliver of planet. */
export function drawFavicon(c: PixelCanvas): void {
	const s = FAVICON_SIZE;
	c.rect(1, 0, s - 2, s, P.void);
	c.rect(0, 1, s, s - 2, P.void);
	c.ellipse(s / 2, s + 20, 30, 28, P.navy);
	c.ellipse(s / 2, s + 21, 29, 27, P.midnight);
	for (let x = 0; x < s; x++) {
		for (let y = 0; y < s; y++) if (c.colorAt(x, y) === P.navy && y > 20) c.px(x, y, P.blue);
	}
	for (let i = 16; i >= 3; i--) {
		const t = i / 16;
		const x = 20 - i;
		const y = 14 - Math.round(i * 0.55);
		const color = t > 0.6 ? P.orange : t > 0.3 ? P.amber : P.yellow;
		c.px(x, y, color);
		c.px(x, y + 1, color);
	}
	c.pattern(
		17,
		11,
		['...#...', '..#Y#..', '.#YWY#.', '#YWWWY#', '.#YWY#.', '..#Y#..', '...#...'],
		{
			'#': P.amber,
			Y: P.yellow,
			W: P.white,
		},
	);
}
