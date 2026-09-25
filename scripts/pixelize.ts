/**
 * Higgsfield -> game sprite: `bun scripts/pixelize.ts <input.png> <manifest.key> [size]`
 * Chroma key (magenta) -> trim -> block downscale -> Endesga 32 (Lab) -> orphan cleanup ->
 * 1 px outline -> bottom-center anchor. Writes art-src/processed/<key>.png.
 * Batch: `bun scripts/pixelize.ts --all` processes art-src/raw/<key>@<size>.png.
 */
import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { pixelize, type Rgba } from './lib/pixel-pipeline';

const RAW = 'art-src/raw';
const OUT = 'art-src/processed';

async function load(path: string): Promise<Rgba> {
	const { data, info } = await sharp(path)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	return { width: info.width, height: info.height, data: new Uint8ClampedArray(data) };
}

async function save(img: Rgba, path: string): Promise<void> {
	await sharp(Buffer.from(img.data), {
		raw: { width: img.width, height: img.height, channels: 4 },
	})
		.png()
		.toFile(path);
}

async function run(input: string, key: string, size: number): Promise<void> {
	mkdirSync(OUT, { recursive: true });
	const out = join(OUT, `${key}.png`);
	await save(pixelize(await load(input), size), out);
	console.log(`${input} -> ${out} (${size}x${size})`);
}

const [a, b, c] = process.argv.slice(2);
if (a === '--all') {
	for (const file of readdirSync(RAW).filter((f) => f.endsWith('.png'))) {
		const m = /^(.+)@(\d+)\.png$/.exec(file);
		if (!m) {
			console.warn(`skip ${file} (expected <key>@<size>.png)`);
			continue;
		}
		await run(join(RAW, file), m[1] ?? file, Number(m[2]));
	}
} else if (a && b) {
	await run(a, b, Number(c ?? 32));
} else {
	console.log('usage: bun scripts/pixelize.ts <input.png> <manifest.key> [size] | --all');
}
