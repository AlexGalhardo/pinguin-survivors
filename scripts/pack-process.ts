// Normalizes the chosen PixelLab images into the key contract before packing:
// art-src/selection.json maps each manifest key to its raw source file (and atlas group), and
// this writes art-src/processed/<group>/<key>.png trimmed to the visible pixels.
// Usage: bun scripts/pack-process.ts && bun scripts/pack-atlas.ts
//   selection.json = { "<key>": { "src": "art-src/pixellab/…png", "group": "core", "trim": true,
//                      "crop": [x, y, w, h], "scale": 0.5 } }

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

interface Pick {
	src: string;
	/** Atlas file the key goes into (public/assets/atlas/<group>.png). Default "core". */
	group?: string;
	/** Trim transparent borders (default true). Tiles keep their canvas. */
	trim?: boolean;
	/** Optional crop [x, y, w, h] applied before trimming. */
	crop?: [number, number, number, number];
	/** Nearest-neighbor scale after trimming (0.5 halves big PixelLab sprites for small props). */
	scale?: number;
}

const SELECTION = 'art-src/selection.json';
const OUT = 'art-src/processed';
const picks = JSON.parse(readFileSync(SELECTION, 'utf-8')) as Record<string, Pick>;
rmSync(OUT, { recursive: true, force: true });
for (const [key, p] of Object.entries(picks)) {
	if (!existsSync(p.src)) throw new Error(`${key}: missing ${p.src}`);
	const dir = join(OUT, p.group ?? 'core');
	mkdirSync(dir, { recursive: true });
	let img = sharp(p.src).ensureAlpha();
	if (p.crop) {
		const [left, top, width, height] = p.crop;
		img = sharp(await img.extract({ left, top, width, height }).png().toBuffer());
	}
	if (p.trim ?? true) img = img.trim({ threshold: 1 });
	if (p.scale && p.scale !== 1) {
		const buf = await img.png().toBuffer();
		const m = await sharp(buf).metadata();
		const w = Math.max(1, Math.round((m.width ?? 1) * p.scale));
		const h = Math.max(1, Math.round((m.height ?? 1) * p.scale));
		img = sharp(buf).resize(w, h, { kernel: 'nearest' });
	}
	await img.png().toFile(join(dir, `${key}.png`));
}
console.log(`processed ${Object.keys(picks).length} keys → ${OUT}`);
