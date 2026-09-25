/**
 * Packs art-src/processed/<manifest.key>.png into public/assets/atlas.png + atlas.json
 * (Phaser JSON Hash). Frame names are the manifest keys, so PreloadScene can swap the
 * code-drawn placeholders key by key. Sheets (idle/walk) keep their full strip as one frame.
 * Usage: bun scripts/pack-atlas.ts
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { shelfPack } from './lib/shelf-pack';

const IN = 'art-src/processed';
const OUT = 'public/assets';

if (!existsSync(IN)) {
	console.log(`nothing to pack: ${IN} does not exist`);
	process.exit(0);
}
const files = readdirSync(IN).filter((f) => f.endsWith('.png'));
const sprites = await Promise.all(
	files.map(async (f) => {
		const meta = await sharp(join(IN, f)).metadata();
		return { key: f.replace(/\.png$/, ''), file: f, w: meta.width ?? 0, h: meta.height ?? 0 };
	}),
);
const { width, height, rects } = shelfPack(sprites, 1024, 1);
mkdirSync(OUT, { recursive: true });
await sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
	.composite(rects.map((r) => ({ input: join(IN, r.file), left: r.x, top: r.y })))
	.png()
	.toFile(join(OUT, 'atlas.png'));
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
	join(OUT, 'atlas.json'),
	JSON.stringify(
		{ frames, meta: { image: 'atlas.png', size: { w: width, h: height }, scale: '1' } },
		null,
		'\t',
	),
);
console.log(`packed ${rects.length} sprites into ${OUT}/atlas.png (${width}x${height})`);
