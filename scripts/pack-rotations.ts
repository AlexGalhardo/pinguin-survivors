// Fills missing animations of a character with its static rotations (1 frame per direction), so
// an approved character shows real, direction-correct art before its animations are generated.
// Real frames in art-src/pixellab/anim/<key>/<anim>/<dir>/ are never overwritten.
// Usage: bun scripts/pack-rotations.ts <key> <rotationsDir> <anim,anim> [dir=file ...]
//   dir=file overrides one direction's image (e.g. south=path/to/fixed.png).
// Then: bun scripts/pack-heroes.ts <key>

import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const GENERATED = ['south', 'south-east', 'east', 'north-east', 'north'];
const [key, rotations, animList, ...overrides] = process.argv.slice(2);
if (!key || !rotations || !animList) {
	console.error(
		'usage: bun scripts/pack-rotations.ts <key> <rotationsDir> <anim,anim> [dir=file]',
	);
	process.exit(1);
}
const override = Object.fromEntries(overrides.map((o) => o.split('=') as [string, string]));
/** Frames per direction of an animation that already has real frames (static fill must match). */
function framesOf(anim: string): number {
	let n = 1;
	for (const dir of GENERATED) {
		const d = join('art-src/pixellab/anim', key as string, anim, dir);
		if (existsSync(d)) n = Math.max(n, readdirSync(d).filter((f) => f.endsWith('.png')).length);
	}
	return n;
}

for (const anim of animList.split(',')) {
	const frames = framesOf(anim);
	for (const dir of GENERATED) {
		const out = join('art-src/pixellab/anim', key, anim, dir);
		if (existsSync(out) && readdirSync(out).some((f) => f.endsWith('.png'))) continue;
		const src = override[dir] ?? join(rotations, `${dir}.png`);
		if (!existsSync(src)) continue;
		mkdirSync(out, { recursive: true });
		for (let n = 0; n < frames; n++)
			copyFileSync(src, join(out, `${String(n).padStart(2, '0')}.png`));
		console.log(`${key}/${anim}/${dir} ← ${src}`);
	}
}
