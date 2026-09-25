/**
 * Pure image steps of the asset pipeline (docs/art-and-assets.md): chroma key, trim,
 * block downscale by mode color, Endesga 32 quantization in Lab, orphan cleanup,
 * 1 px outline and bottom-center anchoring. Works on raw RGBA buffers (no sharp here).
 */
import { PALETTE } from '../../src/config/palette';

export interface Rgba {
	width: number;
	height: number;
	data: Uint8ClampedArray;
}

export function makeImage(width: number, height: number): Rgba {
	return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

const idx = (img: Rgba, x: number, y: number) => (y * img.width + x) * 4;

/** Clears pixels close to the key color (default magenta #FF00FF). */
export function chromaKey(img: Rgba, key = 0xff00ff, tolerance = 90): Rgba {
	const kr = (key >> 16) & 255;
	const kg = (key >> 8) & 255;
	const kb = key & 255;
	const out = { ...img, data: new Uint8ClampedArray(img.data) };
	for (let i = 0; i < out.data.length; i += 4) {
		const d = Math.hypot(
			(out.data[i] ?? 0) - kr,
			(out.data[i + 1] ?? 0) - kg,
			(out.data[i + 2] ?? 0) - kb,
		);
		if (d <= tolerance) out.data[i + 3] = 0;
	}
	return out;
}

/** Crops to the opaque bounding box (returns a 1x1 transparent image when empty). */
export function trim(img: Rgba): Rgba {
	let x0 = img.width;
	let y0 = img.height;
	let x1 = -1;
	let y1 = -1;
	for (let y = 0; y < img.height; y++) {
		for (let x = 0; x < img.width; x++) {
			if ((img.data[idx(img, x, y) + 3] ?? 0) > 0) {
				x0 = Math.min(x0, x);
				y0 = Math.min(y0, y);
				x1 = Math.max(x1, x);
				y1 = Math.max(y1, y);
			}
		}
	}
	if (x1 < 0) return makeImage(1, 1);
	const out = makeImage(x1 - x0 + 1, y1 - y0 + 1);
	for (let y = 0; y < out.height; y++) {
		for (let x = 0; x < out.width; x++) {
			const s = idx(img, x + x0, y + y0);
			const d = idx(out, x, y);
			for (let c = 0; c < 4; c++) out.data[d + c] = img.data[s + c] ?? 0;
		}
	}
	return out;
}

/**
 * Downscales so the longest side fits `target`, sampling each block by its most common
 * opaque color (AI "pixel art" has soft, uneven pixels).
 */
export function blockDownscale(img: Rgba, target: number): Rgba {
	const scale = Math.max(img.width, img.height) / target;
	const w = Math.max(1, Math.round(img.width / scale));
	const h = Math.max(1, Math.round(img.height / scale));
	const out = makeImage(w, h);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const counts = new Map<number, number>();
			let opaque = 0;
			let total = 0;
			for (let sy = Math.floor(y * scale); sy < Math.floor((y + 1) * scale); sy++) {
				for (let sx = Math.floor(x * scale); sx < Math.floor((x + 1) * scale); sx++) {
					if (sx >= img.width || sy >= img.height) continue;
					const i = idx(img, sx, sy);
					total++;
					if ((img.data[i + 3] ?? 0) < 128) continue;
					opaque++;
					const rgb =
						((img.data[i] ?? 0) << 16) |
						((img.data[i + 1] ?? 0) << 8) |
						(img.data[i + 2] ?? 0);
					counts.set(rgb, (counts.get(rgb) ?? 0) + 1);
				}
			}
			if (opaque * 2 < total || counts.size === 0) continue;
			let best = 0;
			let bestN = -1;
			for (const [c, n] of counts) if (n > bestN) [best, bestN] = [c, n];
			const d = idx(out, x, y);
			out.data[d] = (best >> 16) & 255;
			out.data[d + 1] = (best >> 8) & 255;
			out.data[d + 2] = best & 255;
			out.data[d + 3] = 255;
		}
	}
	return out;
}

function toLab(rgb: number): [number, number, number] {
	const lin = (c: number) => {
		const v = c / 255;
		return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92;
	};
	const r = lin((rgb >> 16) & 255);
	const g = lin((rgb >> 8) & 255);
	const b = lin(rgb & 255);
	const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
	const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
	const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
	const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
	return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

const PALETTE_LAB = Object.values(PALETTE).map((c) => ({ c, lab: toLab(c) }));

/** Nearest Endesga 32 color in Lab space. */
export function nearestPaletteColor(rgb: number): number {
	const [l, a, b] = toLab(rgb);
	let best = PALETTE_LAB[0]?.c ?? 0;
	let bestD = Infinity;
	for (const p of PALETTE_LAB) {
		const d = (p.lab[0] - l) ** 2 + (p.lab[1] - a) ** 2 + (p.lab[2] - b) ** 2;
		if (d < bestD) {
			bestD = d;
			best = p.c;
		}
	}
	return best;
}

export function quantize(img: Rgba): Rgba {
	const out = { ...img, data: new Uint8ClampedArray(img.data) };
	for (let i = 0; i < out.data.length; i += 4) {
		if ((out.data[i + 3] ?? 0) === 0) continue;
		const c = nearestPaletteColor(
			((out.data[i] ?? 0) << 16) | ((out.data[i + 1] ?? 0) << 8) | (out.data[i + 2] ?? 0),
		);
		out.data[i] = (c >> 16) & 255;
		out.data[i + 1] = (c >> 8) & 255;
		out.data[i + 2] = c & 255;
		out.data[i + 3] = 255;
	}
	return out;
}

/** Removes isolated pixels (no opaque 4-neighbor). */
export function removeOrphans(img: Rgba): Rgba {
	const out = { ...img, data: new Uint8ClampedArray(img.data) };
	const a = (x: number, y: number) =>
		x >= 0 && y >= 0 && x < img.width && y < img.height
			? (img.data[idx(img, x, y) + 3] ?? 0)
			: 0;
	for (let y = 0; y < img.height; y++) {
		for (let x = 0; x < img.width; x++) {
			if (a(x, y) === 0) continue;
			if (!a(x - 1, y) && !a(x + 1, y) && !a(x, y - 1) && !a(x, y + 1))
				out.data[idx(img, x, y) + 3] = 0;
		}
	}
	return out;
}

/** Places the sprite on a size x size canvas, feet at the bottom center, with a 1 px outline. */
export function anchorAndOutline(img: Rgba, size: number, outline = PALETTE.void): Rgba {
	const out = makeImage(size, size);
	const ox = Math.floor((size - img.width) / 2);
	const oy = size - 1 - img.height;
	for (let y = 0; y < img.height; y++) {
		for (let x = 0; x < img.width; x++) {
			const s = idx(img, x, y);
			if ((img.data[s + 3] ?? 0) === 0) continue;
			const tx = x + ox;
			const ty = y + oy;
			if (tx < 0 || ty < 0 || tx >= size || ty >= size) continue;
			const d = idx(out, tx, ty);
			for (let c = 0; c < 4; c++) out.data[d + c] = img.data[s + c] ?? 0;
		}
	}
	const marks: number[] = [];
	const a = (x: number, y: number) =>
		x >= 0 && y >= 0 && x < size && y < size ? (out.data[idx(out, x, y) + 3] ?? 0) : 0;
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			if (a(x, y)) continue;
			if (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1)) marks.push(x, y);
		}
	}
	for (let i = 0; i < marks.length; i += 2) {
		const d = idx(out, marks[i] ?? 0, marks[i + 1] ?? 0);
		out.data[d] = (outline >> 16) & 255;
		out.data[d + 1] = (outline >> 8) & 255;
		out.data[d + 2] = outline & 255;
		out.data[d + 3] = 255;
	}
	return out;
}

/** Full pipeline for one sprite. `target` is the sprite size (16/32/64). */
export function pixelize(img: Rgba, target: number): Rgba {
	const keyed = trim(chromaKey(img));
	const small = blockDownscale(keyed, target - 2);
	return anchorAndOutline(removeOrphans(quantize(small)), target);
}
