// Generates concept characters (8 rotations, no animation) for the user's approval.
// Usage: bun scripts/pl-concepts.ts [--set heroes|enemies] [id ...]   (no ids = whole set)
// Output: art-src/pixellab/concepts[/<set>]/<id>/<direction>.png + meta.json and sheet.png
// (heroes stay in the root folder for history).

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import sharp from 'sharp';
import {
	api,
	DIRECTIONS_8,
	download,
	getBalance,
	getCharacter,
	logGeneration,
	waitJob,
} from './lib/pixellab';

const SET = (() => {
	const i = process.argv.indexOf('--set');
	return i >= 0 ? (process.argv[i + 1] ?? 'heroes') : 'heroes';
})();
const OUT = SET === 'heroes' ? 'art-src/pixellab/concepts' : `art-src/pixellab/concepts/${SET}`;

const STYLE =
	'cute but battle-worn, scars and bandages, dirty worn gear, zombie apocalypse survivor, ' +
	'isometric action RPG hero like Diablo 2, readable silhouette, chibi proportions';

interface Concept {
	id: string;
	model: 'v3' | 'pro';
	size: number;
	seed?: number;
	description: string;
	/** Style suffix (heroes vs zombies). */
	style?: string;
	/** Skeleton template for later animation (`bear` for quadrupeds). */
	template?: string;
}

const HEROES = {
	jack:
		'Jack, a rockhopper penguin with a spiky yellow crest, red bandana tied on the forehead, ' +
		'leather shoulder pad, bandaged flipper, holding a bloody machete in the right flipper, melee brawler',
	bob:
		'Bob, a chubby emperor penguin wearing a green military tactical vest with shotgun shells ' +
		'on an ammo belt, knitted beanie, eyepatch, holding a double-barrel shotgun with both flippers',
	lucia:
		'Lucia, a small gentoo penguin mage wearing a tattered purple hooded cloak with runes, ' +
		'holding a crooked wooden staff topped with a glowing crystal with four small gems (red, green, cyan, yellow)',
};

const ZOMBIE_STYLE =
	'zombie apocalypse monster, pale greenish rotting skin or feathers, open red wounds, glowing green eyes, ' +
	'dripping blood, isometric action RPG enemy like Diablo 2, readable silhouette, single color black outline';

const ENEMIES: { id: string; size: number; template?: string; description: string }[] = [
	{
		id: 'zombiePenguin',
		size: 64,
		description:
			'a zombie penguin shambling forward with torn flippers, one eye hanging, fast horde enemy',
	},
	{
		id: 'zombieSkua',
		size: 64,
		template: 'bear',
		description:
			'a zombie skua seabird with rotten tattered wings spread, flying, bones showing',
	},
	{
		id: 'zombieSeal',
		size: 64,
		template: 'bear',
		description: 'a bloated zombie seal crawling on its belly, fat and rotten, big tank enemy',
	},
	{
		id: 'zombieScientist',
		size: 64,
		description:
			'a zombie polar research scientist in a torn orange parka and cracked goggles, green toxic drool, ranged spitter',
	},
	{
		id: 'bloaterPenguin',
		size: 64,
		description:
			'a swollen bloated zombie penguin full of glowing green toxic pus, about to explode',
	},
	{
		id: 'zombieWalrus',
		size: 64,
		template: 'bear',
		description: 'a huge zombie walrus with broken bloody tusks, charging, heavy brute enemy',
	},
	{
		id: 'polarBear',
		size: 160,
		template: 'bear',
		description:
			'a giant zombie polar bear boss, fur matted with blood, ribs exposed, glowing green eyes, enormous claws, terrifying',
	},
];

const HERO_CONCEPTS: Concept[] = (Object.keys(HEROES) as (keyof typeof HEROES)[]).flatMap(
	(hero) => [
		{ id: `${hero}-v3-a`, model: 'v3', size: 96, seed: 101, description: HEROES[hero] },
		{ id: `${hero}-v3-b`, model: 'v3', size: 96, seed: 202, description: HEROES[hero] },
		{ id: `${hero}-pro`, model: 'pro', size: 96, seed: 303, description: HEROES[hero] },
	],
);

const ENEMY_CONCEPTS: Concept[] = ENEMIES.flatMap((e) =>
	[11, 22].map((seed) => ({
		id: `${e.id}-${seed}`,
		model: 'v3' as const,
		size: e.size,
		seed,
		description: e.description,
		style: ZOMBIE_STYLE,
		template: e.template,
	})),
);

const CONCEPTS = SET === 'enemies' ? ENEMY_CONCEPTS : HERO_CONCEPTS;

async function generate(c: Concept): Promise<void> {
	const dir = `${OUT}/${c.id}`;
	if (existsSync(`${dir}/meta.json`)) {
		console.log(`skip ${c.id} (exists)`);
		return;
	}
	const description = `${c.description}. ${c.style ?? STYLE}`;
	const common = {
		description,
		image_size: { width: c.size, height: c.size },
		view: 'low top-down',
		template_id: c.template ?? 'mannequin',
		seed: c.seed,
		no_background: true,
	};
	const body =
		c.model === 'v3'
			? { ...common, outline: 'single color black outline', detail: 'high detail' }
			: { ...common, method: 'create_with_style', style_description: STYLE };
	const path = c.model === 'v3' ? '/create-character-v3' : '/create-character-pro';
	const res = await api<{ background_job_id: string; character_id: string }>(path, { body });
	console.log(`${c.id}: job ${res.background_job_id} char ${res.character_id}`);
	const job = await waitJob(res.background_job_id);
	const ch = await getCharacter(res.character_id);
	for (const d of DIRECTIONS_8) {
		const url = ch.rotation_urls[d];
		if (url) await download(url, `${dir}/${d}.png`);
	}
	await Bun.write(
		`${dir}/meta.json`,
		JSON.stringify({ ...c, character_id: ch.id, size: ch.size, description }, null, '\t'),
	);
	logGeneration({
		kind: 'concept',
		id: c.id,
		endpoint: path,
		character_id: ch.id,
		seed: c.seed,
		prompt: description,
		usage: (job as { usage?: unknown }).usage,
	});
	console.log(`${c.id}: done (${ch.size.width}x${ch.size.height})`);
}

async function contactSheet(ids: string[]): Promise<void> {
	const SCALE = 3;
	const cell = 96 * SCALE;
	const rows = ids.filter((id) => existsSync(`${OUT}/${id}/meta.json`));
	const composites: sharp.OverlayOptions[] = [];
	for (const [r, id] of rows.entries()) {
		const meta = JSON.parse(readFileSync(`${OUT}/${id}/meta.json`, 'utf8')) as {
			size: { width: number };
		};
		const px = Math.max(1, Math.floor(cell / meta.size.width));
		for (const [col, d] of DIRECTIONS_8.entries()) {
			const file = `${OUT}/${id}/${d}.png`;
			if (!existsSync(file)) continue;
			const img = await sharp(file)
				.resize({ width: meta.size.width * px, kernel: 'nearest' })
				.toBuffer();
			composites.push({ input: img, left: 160 + col * cell, top: r * cell });
		}
		const label = Buffer.from(
			`<svg width="160" height="${cell}"><text x="8" y="${cell / 2}" fill="#e0e0e0" font-size="18" font-family="monospace">${id}</text></svg>`,
		);
		composites.push({ input: label, left: 0, top: r * cell });
	}
	mkdirSync(OUT, { recursive: true });
	await sharp({
		create: {
			width: 160 + 8 * cell,
			height: Math.max(1, rows.length) * cell,
			channels: 4,
			background: '#1b1f2a',
		},
	})
		.composite(composites)
		.png()
		.toFile(`${OUT}/sheet.png`);
	console.log(`sheet: ${OUT}/sheet.png`);
}

const wanted = process.argv.slice(2).filter((a, i, all) => a !== '--set' && all[i - 1] !== '--set');
const list = wanted.length ? CONCEPTS.filter((c) => wanted.includes(c.id)) : CONCEPTS;
const before = await getBalance();
console.log(`generations left: ${before.subscription.generations}`);
const results = await Promise.allSettled(list.map(generate));
for (const [i, r] of results.entries())
	if (r.status === 'rejected') console.error(`${list[i]?.id} FAILED: ${r.reason}`);
await contactSheet(CONCEPTS.map((c) => c.id));
const after = await getBalance();
console.log(
	`generations used: ${before.subscription.generations - after.subscription.generations}`,
);
