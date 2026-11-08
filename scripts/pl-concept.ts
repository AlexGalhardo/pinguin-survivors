// Character concept sheet (8 rotations per seed, NO animation until the developer approves).
// Usage: bun scripts/pl-concept.ts <name> <size> "<subject>" [seed ...]   (default seeds 101 202)
// Output: art-src/pixellab/concepts/<name>/<seed>/<direction>.png + meta.json and
// art-src/pixellab/qa/<name>-concept.png (S, E, N, W of each seed).
import { existsSync, mkdirSync } from 'node:fs';
import sharp, { type OverlayOptions } from 'sharp';
import {
	api,
	DIRECTIONS_8,
	download,
	generationsLeft,
	getCharacter,
	logGeneration,
	waitJob,
} from './lib/pixellab';

const [name, sizeArg, subject, ...seedArgs] = process.argv.slice(2);
if (!name || !sizeArg || !subject) {
	console.error('usage: bun scripts/pl-concept.ts <name> <size> "<subject>" [seed ...]');
	process.exit(1);
}
const SIZE = Number(sizeArg);
const OUT = `art-src/pixellab/concepts/${name}`;
const SHEET = `art-src/pixellab/qa/${name}-concept.png`;
const PROMPT =
	`${subject}. pixel art, top-down 3/4 view like Brotato, saturated colors, single color black outline, ` +
	'soft shading, one light source from the top left, battle-worn, dirty worn gear, ' +
	'zombie apocalypse, top-down action roguelite like Brotato, readable silhouette, ' +
	'no text, no watermark, no background';

const seeds = seedArgs.map(Number);
if (seeds.length === 0) seeds.push(101, 202);
const before = await generationsLeft();
for (const seed of seeds) {
	const dir = `${OUT}/${seed}`;
	if (existsSync(`${dir}/meta.json`)) continue;
	mkdirSync(dir, { recursive: true });
	const res = await api<{ background_job_id: string; character_id: string }>(
		'/create-character-v3',
		{
			body: {
				description: PROMPT,
				image_size: { width: SIZE, height: SIZE },
				view: 'low top-down',
				n_directions: 8,
				template_id: 'mannequin',
				outline: 'single color black outline',
				detail: 'high detail',
				no_background: true,
				seed,
			},
		},
	);
	const job = await waitJob(res.background_job_id);
	const ch = await getCharacter(res.character_id);
	for (const d of DIRECTIONS_8) {
		const url = ch.rotation_urls[d];
		if (url) await download(url, `${dir}/${d}.png`);
	}
	await Bun.write(
		`${dir}/meta.json`,
		JSON.stringify({ seed, character_id: ch.id, size: SIZE, prompt: PROMPT }, null, '\t'),
	);
	logGeneration({
		kind: 'concept',
		id: `${name}-${seed}`,
		endpoint: '/create-character-v3',
		character_id: ch.id,
		seed,
		prompt: PROMPT,
		usage: (job as { usage?: unknown }).usage,
	});
	console.log(`${name} ${seed}: ${ch.id}`);
}

// Approval sheet: one row per seed, the S, E, N and W rotations at 3x.
const SHEET_DIRS = ['south', 'east', 'north', 'west'] as const;
const CELL = SIZE * 3;
const layers: OverlayOptions[] = [];
for (const [r, seed] of seeds.entries()) {
	for (const [c, d] of SHEET_DIRS.entries()) {
		const file = `${OUT}/${seed}/${d}.png`;
		if (!existsSync(file)) continue;
		layers.push({
			input: await sharp(file).resize(CELL, CELL, { kernel: 'nearest' }).toBuffer(),
			left: c * CELL,
			top: r * CELL,
		});
	}
}
await sharp({
	create: {
		width: CELL * SHEET_DIRS.length,
		height: CELL * seeds.length,
		channels: 4,
		background: '#1b1f2a',
	},
})
	.composite(layers)
	.png()
	.toFile(SHEET);
const after = await generationsLeft();
if (before !== null && after !== null) console.log(`generations used: ${before - after}`);
