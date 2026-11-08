// Arena wall pieces for a biome (SDD-012 RF-02): `border.<biome>.0` straight edge (wall on top) and
// `.1` outer corner (top and left), 64x64, built from a generated seamless ground tile so the wall
// texture tiles along the whole edge. No PixelLab calls.
// Usage: bun scripts/make-borders.ts <biome> <wall-tile.png> [thickness=18]
// Output: art-src/pixellab/borders/<biome>/0.png and 1.png
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const [biome, tileFile, thicknessArg] = process.argv.slice(2);
if (!biome || !tileFile) {
	console.error('usage: bun scripts/make-borders.ts <biome> <wall-tile.png> [thickness]');
	process.exit(1);
}
const T = 64;
const W = Number(thicknessArg ?? 18);
const { data } = await sharp(tileFile)
	.resize(T, T, { kernel: 'nearest' })
	.ensureAlpha()
	.raw()
	.toBuffer({ resolveWithObject: true });

/** Wall pixel at (x, y) of the piece, or null when it is ground: darkened tile, light cap, black base. */
function wallPixel(x: number, y: number, top: boolean, left: boolean): number[] | null {
	const inTop = top && y < W;
	const inLeft = left && x < W;
	if (!inTop && !inLeft) return null;
	const i = (y * T + x) * 4;
	const r = data[i] ?? 0;
	const g = data[i + 1] ?? 0;
	const b = data[i + 2] ?? 0;
	// Distance to the open side of the wall: bottom edge of the top band, right edge of the left band.
	const edge = Math.min(inTop ? W - 1 - y : W, inLeft ? W - 1 - x : W);
	if (edge === 0) return [8, 10, 14, 255];
	if (edge === 1 || edge === 2)
		return [
			Math.min(255, r * 0.9 + 90),
			Math.min(255, g * 0.9 + 90),
			Math.min(255, b * 0.9 + 90),
			255,
		];
	return [r * 0.85, g * 0.85, b * 0.85, 255];
}

mkdirSync(`art-src/pixellab/borders/${biome}`, { recursive: true });
for (const [name, top, left] of [
	['0', true, false],
	['1', true, true],
] as const) {
	const out = Buffer.alloc(T * T * 4);
	for (let y = 0; y < T; y++)
		for (let x = 0; x < T; x++) {
			const px = wallPixel(x, y, top, left);
			if (!px) continue;
			out.set(
				px.map((v) => Math.round(v)),
				(y * T + x) * 4,
			);
		}
	await sharp(out, { raw: { width: T, height: T, channels: 4 } })
		.png()
		.toFile(`art-src/pixellab/borders/${biome}/${name}.png`);
}
console.log(`borders for ${biome}: art-src/pixellab/borders/${biome}/{0,1}.png`);
