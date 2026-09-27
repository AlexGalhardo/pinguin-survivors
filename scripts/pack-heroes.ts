// Packs PixelLab animation frames into one atlas per character key.
// Input:  art-src/pixellab/anim/<key>/<anim>/<direction>/<nn>.png
// Output: public/assets/heroes/<key>.png + <key>.json (Phaser JSON Hash) with frame names
//         `<anim>.<dir>.<nn>` (dir ∈ s, se, e, ne, n) and meta.anims[anim] = { frames, anchorY, dirs }.
// anchorY is where the feet are (0..1 of the frame height), measured on the south frame 0, because
// template (96 px) and v3 (132 px) animations come on different canvases.
// Usage: bun scripts/pack-heroes.ts [key ...]

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { shelfPack } from './lib/shelf-pack';

const IN = 'art-src/pixellab/anim';
const OUT = 'public/assets/heroes';
const SHORT: Record<string, string> = {
	south: 's',
	'south-east': 'se',
	east: 'e',
	'north-east': 'ne',
	north: 'n',
	'south-west': 'sw',
	west: 'w',
	'north-west': 'nw',
};
/** Pilot folders that are not part of the final set. */
const SKIP_ANIMS = new Set(['walk', 'walk-template', 'walk-skeleton']);

async function feetY(file: string): Promise<{ y: number; h: number }> {
	const { data, info } = await sharp(file)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	for (let y = info.height - 1; y >= 0; y--) {
		for (let x = 0; x < info.width; x++) {
			if ((data[(y * info.width + x) * 4 + 3] ?? 0) > 16) return { y: y + 1, h: info.height };
		}
	}
	return { y: info.height, h: info.height };
}

async function packKey(key: string): Promise<void> {
	const dir = join(IN, key);
	const sprites: { key: string; file: string; w: number; h: number }[] = [];
	const anims: Record<string, { frames: number; anchorY: number; dirs: string[]; size: number }> =
		{};
	for (const anim of readdirSync(dir).sort()) {
		if (SKIP_ANIMS.has(anim) || !existsSync(join(dir, anim, 'south'))) continue;
		const dirs = readdirSync(join(dir, anim)).filter((d) => SHORT[d]);
		let frames = 0;
		let size = 0;
		for (const d of dirs) {
			const files = readdirSync(join(dir, anim, d))
				.filter((f) => f.endsWith('.png'))
				.sort();
			frames = Math.max(frames, files.length);
			for (const [n, f] of files.entries()) {
				const file = join(dir, anim, d, f);
				const meta = await sharp(file).metadata();
				size = meta.width ?? size;
				sprites.push({
					key: `${anim}.${SHORT[d]}.${String(n).padStart(2, '0')}`,
					file,
					w: meta.width ?? 0,
					h: meta.height ?? 0,
				});
			}
		}
		const feet = await feetY(join(dir, anim, 'south', '00.png'));
		anims[anim] = {
			frames,
			anchorY: feet.y / feet.h,
			dirs: dirs.map((d) => SHORT[d] as string),
			size,
		};
	}
	if (sprites.length === 0) {
		console.log(`${key}: nothing to pack`);
		return;
	}
	const { width, height, rects } = shelfPack(sprites, 2048, 1);
	mkdirSync(OUT, { recursive: true });
	await sharp({
		create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
	})
		.composite(rects.map((r) => ({ input: r.file, left: r.x, top: r.y })))
		.png()
		.toFile(join(OUT, `${key}.png`));
	const frames = Object.fromEntries(
		rects.map((r) => [
			r.key,
			{
				frame: { x: r.x, y: r.y, w: r.w, h: r.h },
				rotated: false,
				trimmed: false,
				spriteSourceSize: { x: 0, y: 0, w: r.w, h: r.h },
				sourceSize: { w: r.w, h: r.h },
			},
		]),
	);
	writeFileSync(
		join(OUT, `${key}.json`),
		JSON.stringify({
			frames,
			meta: { image: `${key}.png`, size: { w: width, h: height }, scale: '1', anims },
		}),
	);
	console.log(
		`${key}: ${rects.length} frames → ${OUT}/${key}.png (${width}x${height}) anims: ${Object.keys(anims).join(', ')}`,
	);
}

const keys = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(IN);
for (const key of keys) await packKey(key);
