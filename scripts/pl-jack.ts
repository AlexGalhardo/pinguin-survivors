// New top-down Jack (T4.7 pilot, approved by the developer on 2026-11-08): concept variants by seed,
// 8 rotations each, no weapon (P-56), canvas 80 so the hero is ~72 px tall (proportions report).
// Usage: bun scripts/pl-jack.ts [seed ...]   (default 101 202)
// Output: art-src/pixellab/concepts/jack-td/<seed>/<direction>.png + meta.json, then sheet.png.
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

const SIZE = 80;
const OUT = 'art-src/pixellab/concepts/jack-td';
// prompts.md: base + hero block (subject), no weapon in the sprite (the weapon is a separate image).
const SUBJECT =
	'Jack, a rockhopper penguin with a spiky yellow crest, red bandana tied on the forehead, ' +
	'leather shoulder pad, bandaged flipper, empty flippers not holding any weapon, melee brawler';
const PROMPT =
	`${SUBJECT}. pixel art, top-down 3/4 view like Brotato, saturated colors, single color black outline, ` +
	'soft shading, one light source from the top left, cute but battle-worn, scars and bandages, dirty worn gear, ' +
	'zombie apocalypse survivor, top-down action roguelite hero like Brotato, readable silhouette, chibi proportions, ' +
	'no text, no watermark, no background';

const seeds = process.argv.slice(2).map(Number);
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
		id: `jack-td-${seed}`,
		endpoint: '/create-character-v3',
		character_id: ch.id,
		seed,
		prompt: PROMPT,
		usage: (job as { usage?: unknown }).usage,
	});
	console.log(`jack-td ${seed}: ${ch.id}`);
}

// Contact sheet: one row per seed, 8 rotations, 4x nearest.
const CELL = SIZE * 4;
const layers: OverlayOptions[] = [];
for (const [r, seed] of seeds.entries()) {
	for (const [c, d] of DIRECTIONS_8.entries()) {
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
	create: { width: CELL * 8, height: CELL * seeds.length, channels: 4, background: '#1b1f2a' },
})
	.composite(layers)
	.png()
	.toFile(`${OUT}/sheet-${seeds.join('-')}.png`);
const after = await generationsLeft();
if (before !== null && after !== null) console.log(`generations used: ${before - after}`);
