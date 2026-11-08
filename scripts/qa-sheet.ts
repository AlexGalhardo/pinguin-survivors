// Visual QA board (SDD-012 RF-01, T4.1): the 3 heroes and the biome 1 enemies, 5 generated
// directions each, drawn at the game's x2 zoom over the biome ground, so the top-down camera
// reads like in play. Generates nothing (no PixelLab calls): it only composes existing assets.
// Usage: bun scripts/qa-sheet.ts [out.png]   (default art-src/pixellab/qa/qa-top-down-antarctica.png)
import { mkdirSync } from 'node:fs';
import sharp, { type OverlayOptions } from 'sharp';

const out = process.argv[2] ?? 'art-src/pixellab/qa/qa-top-down-antarctica.png';
mkdirSync('art-src/pixellab/qa', { recursive: true });

interface Atlas {
	frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
}
const DIRS = ['s', 'se', 'e', 'ne', 'n'] as const;
const ZOOM = 2;

async function sprite(group: string, name: string, frame: string): Promise<Buffer | null> {
	const json = (await Bun.file(`public/assets/${group}/${name}.json`).json()) as Atlas;
	const f = json.frames[frame]?.frame;
	if (!f) return null;
	const png = await sharp(`public/assets/${group}/${name}.png`)
		.extract({ left: f.x, top: f.y, width: f.w, height: f.h })
		.resize(f.w * ZOOM, f.h * ZOOM, { kernel: 'nearest' })
		.png()
		.toBuffer();
	return png;
}

// Ground: the atlas has no top-down tiles yet (T4.2), so this mimics the code placeholder: a
// checker of the palette snow tones, 64 world units per tile.
const TILE = 64 * ZOOM;
const tone = (c: string): Promise<Buffer> =>
	sharp({ create: { width: TILE, height: TILE, channels: 4, background: c } })
		.png()
		.toBuffer();
const [tileA, tileB] = await Promise.all([tone('#3a4152'), tone('#434a5c')]);

const ROWS: { label: string; group: string; name: string; frame: (d: string) => string }[] = [
	...['jack', 'bob', 'lucia'].map((h) => ({
		label: `hero ${h}`,
		group: 'heroes',
		name: `hero.${h}`,
		frame: (d: string) => `idle.${d}.00`,
	})),
	...[
		'zombiePenguin',
		'zombieSkua',
		'zombieSeal',
		'zombieScientist',
		'bloaterPenguin',
		'zombieWalrus',
		'polarBear',
	].map((e) => ({
		label: `enemy ${e}`,
		group: 'enemies',
		name: `enemy.${e}`,
		frame: (d: string) => `walk.${d}.00`,
	})),
];

const CELL = 220;
const W = CELL * DIRS.length;
// Rows are as tall as their tallest sprite (the boss is 160 px, heroes 96).
const rows = await Promise.all(
	ROWS.map(async (row) => ({
		row,
		sprites: await Promise.all(DIRS.map((d) => sprite(row.group, row.name, row.frame(d)))),
	})),
);
const heights = await Promise.all(
	rows.map(async ({ sprites }) =>
		Math.max(
			...(await Promise.all(
				sprites.map(async (b) => (b ? ((await sharp(b).metadata()).height ?? 0) : 0)),
			)),
		),
	),
);
const H = heights.reduce((sum, h) => sum + h + 40, 0);
const layers: OverlayOptions[] = [];
for (let y = 0; y < H; y += TILE)
	for (let x = 0; x < W; x += TILE)
		layers.push({ input: (x / TILE + y / TILE) % 2 === 0 ? tileA : tileB, left: x, top: y });
const missing: string[] = [];
let top = 0;
for (const [r, { row, sprites }] of rows.entries()) {
	const rowH = (heights[r] ?? 0) + 40;
	for (const [c, buf] of sprites.entries()) {
		if (!buf) {
			missing.push(`${row.name} ${DIRS[c]}`);
			continue;
		}
		const meta = await sharp(buf).metadata();
		// Feet near the bottom of the row, like the in-game depth by y.
		layers.push({
			input: buf,
			left: c * CELL + Math.round((CELL - (meta.width ?? 0)) / 2),
			top: top + rowH - 20 - (meta.height ?? 0),
		});
	}
	top += rowH;
}
await sharp({ create: { width: W, height: H, channels: 4, background: '#0b0e14' } })
	.composite(layers)
	.png()
	.toFile(out);
console.log(`${out}: ${ROWS.length} characters x ${DIRS.length} directions, ${W}x${H}`);
if (missing.length) console.log(`missing frames: ${missing.join(', ')}`);
