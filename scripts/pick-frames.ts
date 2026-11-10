// Builds the final 8-frame `walk` and `attack` of a boss from the raw /animate-with-text-v3 output,
// dropping frames where the generator baked an impact effect (flash, dust, sparks) into the sprite.
// A frame is an effect frame when its count of bright, low-saturation or hot-yellow pixels jumps well
// above the first frame (the character's own highlights). Raw frames stay untouched in `<anim>-raw`.
// Usage: bun scripts/pick-frames.ts <id> [--dry]
// Input:  art-src/pixellab/anim/enemy.<id>/{walk,attack}-raw/<dir>/<nn>.png (frame 00 = reference)
// Output: art-src/pixellab/anim/enemy.<id>/{walk,attack}/<dir>/00..07.png
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import sharp from 'sharp';

const DIRS = ['south', 'south-east', 'east', 'north-east', 'north'] as const;
const FRAMES = 8;

/** Lowest opaque row of a frame (the feet). */
export async function floorRow(file: string): Promise<number> {
	const { data, info } = await sharp(file)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	for (let y = info.height - 1; y >= 0; y--)
		for (let x = 0; x < info.width; x++)
			if ((data[(y * info.width + x) * 4 + 3] as number) >= 128) return y;
	return info.height - 1;
}

/** Effect-like pixels: bright whites, hot or pale yellows, and anything opaque below the feet. */
export async function fxPixels(file: string, floor = Number.POSITIVE_INFINITY): Promise<number> {
	const { data, info } = await sharp(file)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	let n = 0;
	for (let i = 0; i < info.width * info.height * 4; i += 4) {
		if ((data[i + 3] as number) < 128) continue;
		if (Math.floor(i / 4 / info.width) > floor + 2) {
			n += 3;
			continue;
		}
		const r = data[i] as number;
		const g = data[i + 1] as number;
		const b = data[i + 2] as number;
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const whiteish = max > 215 && max - min < 60;
		const hot = r > 220 && g > 170 && b < 120;
		const pale = r > 220 && g > 200 && b >= 120 && b < 200;
		if (whiteish || hot || pale) n++;
	}
	return n;
}

/** Indexes of the frames to keep: no effect spike, then padded to `FRAMES` by holding frames. */
export function pickFrames(counts: readonly number[], frames = FRAMES): number[] {
	const sorted = [...counts].sort((a, b) => a - b);
	const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
	const limit = Math.min((counts[0] ?? 0) * 1.5 + 25, median * 1.15 + 20);
	const keep = counts.map((c, i) => (c <= limit ? i : -1)).filter((i) => i >= 0);
	if (keep.length === 0) return Array.from({ length: frames }, () => 0);
	const out = [...keep];
	// Too many: drop the reference frame first (it repeats the idle pose), then trim evenly.
	if (out.length > frames && out[0] === 0) out.shift();
	while (out.length > frames) out.splice(Math.floor(out.length / 2), 1);
	// Too few: hold the frame that precedes the biggest gap (the wind-up peak) until it fits.
	while (out.length < frames) {
		let at = 0;
		let gap = -1;
		for (let i = 0; i < out.length - 1; i++) {
			const g = (out[i + 1] as number) - (out[i] as number);
			if (g > gap) {
				gap = g;
				at = i;
			}
		}
		out.splice(at + 1, 0, out[at] as number);
	}
	return out;
}

if (import.meta.main) {
	const id = process.argv[2];
	const dry = process.argv.includes('--dry');
	if (!id) {
		console.error('usage: bun scripts/pick-frames.ts <id> [--dry]');
		process.exit(1);
	}
	const root = `art-src/pixellab/anim/enemy.${id}`;
	for (const anim of ['walk', 'attack'] as const) {
		for (const dir of DIRS) {
			const src = `${root}/${anim}-raw/${dir}`;
			if (!existsSync(src)) {
				console.error(`missing ${src}`);
				process.exit(1);
			}
			const files = readdirSync(src)
				.filter((f) => f.endsWith('.png'))
				.sort();
			const floor = await floorRow(`${src}/${files[0]}`);
			const counts = await Promise.all(files.map((f) => fxPixels(`${src}/${f}`, floor)));
			// Walk cycles: the reference frame 00 duplicates the pose, so the cycle is 01..08.
			const picked =
				anim === 'walk'
					? files.slice(1, FRAMES + 1).map((_, i) => i + 1)
					: pickFrames(counts);
			console.log(`${anim}/${dir}: fx ${counts.join(',')} → ${picked.join(',')}`);
			if (dry) continue;
			const out = `${root}/${anim}/${dir}`;
			mkdirSync(out, { recursive: true });
			for (const [i, f] of picked.entries())
				copyFileSync(`${src}/${files[f]}`, `${out}/${String(i).padStart(2, '0')}.png`);
		}
	}
}
