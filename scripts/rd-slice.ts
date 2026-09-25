/**
 * Native-resolution AI pixel art (Retro Diffusion, PixelLab) -> art-src/processed/<key>.png.
 * Unlike pixelize.ts (which downsamples big "pixel-style" images), these sources are already
 * on the target grid, so frames are only cut, quantized to Endesga 32 and optionally mirrored.
 * Recipes live in art-src/rd-slices.json:
 *   { "out": "player.mage.walk", "src": "art-src/rd/.../x.png", "cell": [32, 32],
 *     "frames": [[0, 1], [1, 1]], "flip": true, "anchor": false, "size": 32 }
 * frames are [column, row] cells; flip mirrors each frame horizontally (the game assumes
 * sprites face right); anchor trims a single sprite and puts its feet at the bottom center
 * of a size x size canvas; outline adds the 1 px dark contour of the style guide (with anchor);
 * replace maps palette colors after quantization ({"e43b44": "3a4466"}), e.g. to keep red
 * (reserved for enemy shots) out of floors. Usage: bun scripts/rd-slice.ts [outKey]
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import {
	anchorAndOutline,
	makeImage,
	quantize,
	type Rgba,
	removeOrphans,
	trim,
} from './lib/pixel-pipeline';

interface Recipe {
	out: string;
	src: string;
	cell: [number, number];
	frames: [number, number][];
	flip?: boolean;
	anchor?: boolean;
	outline?: boolean;
	size?: number;
	replace?: Record<string, string>;
}

const OUT = 'art-src/processed';

async function load(path: string): Promise<Rgba> {
	const { data, info } = await sharp(path)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	return { width: info.width, height: info.height, data: new Uint8ClampedArray(data) };
}

function crop(img: Rgba, x0: number, y0: number, w: number, h: number, flip: boolean): Rgba {
	const out = makeImage(w, h);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const sx = x0 + (flip ? w - 1 - x : x);
			const s = ((y0 + y) * img.width + sx) * 4;
			const d = (y * w + x) * 4;
			for (let c = 0; c < 4; c++) out.data[d + c] = img.data[s + c] ?? 0;
		}
	}
	return out;
}

/** Semi-transparent edge pixels become fully opaque or fully clear (no soft alpha in pixel art). */
function hardAlpha(img: Rgba): Rgba {
	const out = { ...img, data: new Uint8ClampedArray(img.data) };
	for (let i = 3; i < out.data.length; i += 4) out.data[i] = (out.data[i] ?? 0) >= 128 ? 255 : 0;
	return out;
}

function recolor(img: Rgba, map: Record<string, string>): Rgba {
	const out = { ...img, data: new Uint8ClampedArray(img.data) };
	const table = new Map(Object.entries(map).map(([a, b]) => [parseInt(a, 16), parseInt(b, 16)]));
	for (let i = 0; i < out.data.length; i += 4) {
		if ((out.data[i + 3] ?? 0) === 0) continue;
		const c =
			((out.data[i] ?? 0) << 16) | ((out.data[i + 1] ?? 0) << 8) | (out.data[i + 2] ?? 0);
		const to = table.get(c);
		if (to === undefined) continue;
		out.data[i] = (to >> 16) & 255;
		out.data[i + 1] = (to >> 8) & 255;
		out.data[i + 2] = to & 255;
	}
	return out;
}

function anchor(img: Rgba, size: number): Rgba {
	const t = trim(img);
	const out = makeImage(size, size);
	const ox = Math.floor((size - t.width) / 2);
	const oy = size - t.height;
	for (let y = 0; y < t.height; y++) {
		for (let x = 0; x < t.width; x++) {
			const tx = x + ox;
			const ty = y + oy;
			if (tx < 0 || ty < 0 || tx >= size || ty >= size) continue;
			const s = (y * t.width + x) * 4;
			const d = (ty * size + tx) * 4;
			for (let c = 0; c < 4; c++) out.data[d + c] = t.data[s + c] ?? 0;
		}
	}
	return out;
}

async function run(r: Recipe): Promise<void> {
	const src = await load(r.src);
	const [cw, ch] = r.cell;
	const frames = r.frames.map(([c, row]) => {
		let f = hardAlpha(crop(src, c * cw, row * ch, cw, ch, r.flip ?? false));
		f = removeOrphans(quantize(f));
		if (r.replace) f = recolor(f, r.replace);
		if (r.anchor && r.outline) return anchorAndOutline(trim(f), r.size ?? cw);
		return r.anchor ? anchor(f, r.size ?? cw) : f;
	});
	const fw = frames[0]?.width ?? cw;
	const fh = frames[0]?.height ?? ch;
	const strip = makeImage(fw * frames.length, fh);
	frames.forEach((f, i) => {
		for (let y = 0; y < fh; y++) {
			for (let x = 0; x < fw; x++) {
				const s = (y * fw + x) * 4;
				const d = (y * strip.width + i * fw + x) * 4;
				for (let c = 0; c < 4; c++) strip.data[d + c] = f.data[s + c] ?? 0;
			}
		}
	});
	mkdirSync(OUT, { recursive: true });
	const file = join(OUT, `${r.out}.png`);
	await sharp(Buffer.from(strip.data), {
		raw: { width: strip.width, height: strip.height, channels: 4 },
	})
		.png()
		.toFile(file);
	console.log(`${r.src} -> ${file} (${frames.length} frame(s) ${fw}x${fh})`);
}

const recipes = JSON.parse(readFileSync('art-src/rd-slices.json', 'utf8')) as Recipe[];
const only = process.argv[2];
for (const r of recipes) if (!only || r.out === only) await run(r);
