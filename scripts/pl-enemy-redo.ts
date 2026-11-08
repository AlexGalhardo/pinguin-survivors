// Redo of legacy enemies whose rotations were inconsistent in the QA board (T4.7). The legacy
// characters belong to another PixelLab account (the old MCP token), so they cannot be re-animated
// through this API token: each one is recreated as a new v3 character that takes the approved
// south rotation as `reference_image`, keeping its identity, with the top-down style suffix.
// Usage: bun scripts/pl-enemy-redo.ts [id ...]   (default: all)
// Output: art-src/pixellab/concepts/enemies-redo/<id>/<direction>.png + meta.json
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import {
	api,
	DIRECTIONS_8,
	download,
	generationsLeft,
	getCharacter,
	logGeneration,
	waitJob,
} from './lib/pixellab';

interface Redo {
	id: string;
	/** Approved legacy concept folder (south.png is the reference). */
	from: string;
	size: number;
	seed: number;
	template: string;
	subject: string;
}

const STYLE =
	'pixel art, top-down 3/4 view like Brotato, desaturated blue-grey polar night palette with warm highlights, ' +
	'single color black outline, soft shading, one light source from the top left, zombie apocalypse monster, ' +
	'pale greenish rotting skin or feathers, open red wounds, glowing eyes, dripping blood, top-down action roguelite enemy, ' +
	'readable silhouette, no text, no watermark, no background';

const REDO: Redo[] = [
	{
		id: 'zombiePenguin',
		from: 'zombiePenguin-22',
		size: 64,
		seed: 22,
		template: 'mannequin',
		subject:
			'a zombie penguin shambling forward with torn flippers, one eye hanging, fast horde enemy',
	},
	{
		id: 'zombieScientist',
		from: 'zombieScientist-11',
		size: 64,
		seed: 11,
		template: 'mannequin',
		subject:
			'a zombie polar research scientist in a torn orange parka and cracked goggles, green toxic drool, ranged spitter',
	},
	{
		id: 'zombieSeal',
		from: 'zombieSeal-11',
		size: 64,
		seed: 11,
		template: 'bear',
		subject: 'a bloated zombie seal crawling on its belly, fat and rotten, big tank enemy',
	},
	{
		id: 'polarBear',
		from: 'polarBear-11',
		size: 160,
		seed: 11,
		template: 'bear',
		subject:
			'a giant zombie polar bear boss walking on all fours in a hunched stalking pose, fur matted with blood, ribs exposed, glowing green eyes, enormous claws, terrifying',
	},
];

const OUT = 'art-src/pixellab/concepts/enemies-redo';
const wanted = process.argv.slice(2);
const list = REDO.filter((r) => wanted.length === 0 || wanted.includes(r.id));
const before = await generationsLeft();

async function redo(r: Redo): Promise<void> {
	const dir = `${OUT}/${r.id}`;
	if (existsSync(`${dir}/meta.json`)) return;
	mkdirSync(dir, { recursive: true });
	const ref = readFileSync(`art-src/pixellab/concepts/enemies/${r.from}/south.png`).toString(
		'base64',
	);
	const prompt = `${r.subject}. ${STYLE}`;
	const res = await api<{ background_job_id: string; character_id: string }>(
		'/create-character-v3',
		{
			body: {
				description: prompt,
				reference_image: { type: 'base64', base64: ref },
				image_size: { width: r.size, height: r.size },
				view: 'low top-down',
				n_directions: 8,
				template_id: r.template,
				outline: 'single color black outline',
				detail: 'high detail',
				no_background: true,
				seed: r.seed,
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
		JSON.stringify({ id: r.id, character_id: ch.id, size: r.size, prompt }, null, '\t'),
	);
	logGeneration({
		kind: 'concept',
		id: `${r.id}-redo`,
		endpoint: '/create-character-v3',
		character_id: ch.id,
		seed: r.seed,
		prompt,
		usage: (job as { usage?: unknown }).usage,
	});
	console.log(`${r.id}: ${ch.id}`);
}

const results = await Promise.allSettled(list.map(redo));
for (const r of results) if (r.status === 'rejected') console.error(`FAILED: ${r.reason}`);
const after = await generationsLeft();
if (before !== null && after !== null) console.log(`generations used: ${before - after}`);
