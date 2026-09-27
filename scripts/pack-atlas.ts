/**
 * Packs art-src/processed/<group>/<manifest.key>.png into public/assets/atlas/<group>.png + .json
 * (Phaser JSON Hash). Frame names are the manifest keys: BootScene loads every group atlas and
 * turns each frame into a texture with that key, so the code-drawn placeholders are only drawn
 * for keys that are still missing. Run `bun scripts/pack-process.ts` first.
 * Usage: bun scripts/pack-atlas.ts
 */
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { shelfPack } from './lib/shelf-pack';

const IN = 'art-src/processed';
const OUT = 'public/assets/atlas';

if (!existsSync(IN)) {
	console.log(`nothing to pack: ${IN} does not exist`);
	process.exit(0);
}
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const group of readdirSync(IN).sort()) {
	const dir = join(IN, group);
	if (!statSync(dir).isDirectory()) continue;
	const files = readdirSync(dir).filter((f) => f.endsWith('.png'));
	const sprites = await Promise.all(
		files.map(async (f) => {
			const meta = await sharp(join(dir, f)).metadata();
			return {
				key: f.replace(/\.png$/, ''),
				file: f,
				w: meta.width ?? 0,
				h: meta.height ?? 0,
			};
		}),
	);
	const { width, height, rects } = shelfPack(sprites, 1024, 1);
	await sharp({
		create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
	})
		.composite(rects.map((r) => ({ input: join(dir, r.file), left: r.x, top: r.y })))
		.png({ compressionLevel: 9 })
		.toFile(join(OUT, `${group}.png`));
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
		join(OUT, `${group}.json`),
		JSON.stringify({
			frames,
			meta: { image: `${group}.png`, size: { w: width, h: height }, scale: '1' },
		}),
	);
	console.log(`${group}: ${rects.length} sprites → ${OUT}/${group}.png (${width}x${height})`);
}
