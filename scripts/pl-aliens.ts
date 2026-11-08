// Concepts of the city faction (ADR-016, SDD-012 RF-12): 6 original aliens + the boss, 2 seeds per
// creature, NO animation (gate: developer approval first). The API only rotates 4 directions from a
// reference image, so the concept is requested with 8 rotations; the sheet shows S, E, N and W.
// Originality rule (ADR-016 §4): genre inspiration only (biomechanical, camouflaged hunter, acid swarm,
// armored warrior); no xenomorph, yautja/predator or Warhammer silhouettes, names or marks.
// Usage: bun scripts/pl-aliens.ts [id ...]   (default: all)
// Output: art-src/pixellab/concepts/aliens/<id>-<seed>/<direction>.png + meta.json, then the sheet
// art-src/pixellab/qa/aliens-concepts.png.
import { existsSync, mkdirSync } from 'node:fs';
import sharp, { type OverlayOptions } from 'sharp';
import {
	api,
	type Direction,
	download,
	generationsLeft,
	getCharacter,
	logGeneration,
	waitJob,
} from './lib/pixellab';

const OUT = 'art-src/pixellab/concepts/aliens';
const SHEET = 'art-src/pixellab/qa/aliens-concepts.png';
const DIRS: Direction[] = ['south', 'east', 'north', 'west'];
const ALL_DIRS: Direction[] = [
	'south',
	'south-east',
	'east',
	'north-east',
	'north',
	'north-west',
	'west',
	'south-west',
];

const BASE =
	'pixel art, top-down 3/4 view like Brotato, desaturated blue-grey ruined city night palette with acid green glow, ' +
	'single color black outline, soft shading, one light source from the top left, ';
const STYLE =
	'original alien invader creature, grey metal-like plates fused with dark flesh, glowing acid-green eyes and veins, ' +
	'top-down action roguelite enemy, readable silhouette, no text, no watermark, no background';

interface Alien {
	id: string;
	size: number;
	template: string;
	subject: string;
	/** Seeds to generate (default `SEEDS`). */
	seeds?: number[];
}

const ALIENS: Alien[] = [
	{
		id: 'acidSwarmer',
		size: 64,
		template: 'bear',
		subject:
			'a small round-bodied alien crawler on six stubby legs with a glowing acid-green bladder on its back, dripping green acid, fast swarm enemy',
	},
	{
		id: 'alienFlyer',
		size: 64,
		template: 'bear',
		subject:
			'a flat manta-shaped alien flyer with translucent membrane wings and a glowing green core, hovering, short dangling tendrils, flying enemy',
	},
	{
		id: 'armorGuard',
		size: 64,
		template: 'mannequin',
		subject:
			'a heavy barrel-bodied alien guard with thick grey shell plates, one broad shield-like carapace on its left arm and a wide hammer-shaped head with glowing green slits, slow tank enemy',
	},
	{
		id: 'camoStalker',
		size: 64,
		template: 'mannequin',
		subject:
			'a short stocky alien hunter shaped like a chameleon, a round smooth dome head with three glowing green eyes in a row, thick short arms with blade-like forearms, shimmering semi-transparent skin, no tail, no elongated skull, no teeth',
		seeds: [33, 44],
	},
	{
		id: 'cystBloater',
		size: 64,
		template: 'mannequin',
		subject:
			'a swollen alien bloater with a translucent bulging sac full of glowing green liquid and small eggs, thin weak legs, about to burst, explosive enemy',
	},
	{
		id: 'clawCharger',
		size: 64,
		template: 'bear',
		subject:
			'a low four-legged alien charger with a massive bone-white battering ram crest on its head and two big grey claws, glowing green eyes, charging forward',
	},
	{
		id: 'biomechColossus',
		size: 160,
		template: 'mannequin',
		subject:
			'a towering hunched mass of grey metal pipes and plates fused with pulsing green muscle, a wide crab-like body on thick legs, one enormous mechanical arm ending in an acid cannon, a small head with one large glowing green eye, not a soldier, no armor suit, fills the whole canvas, boss',
		seeds: [33, 44],
	},
];

const SEEDS = [11, 22];
const wanted = process.argv.slice(2);
const list = ALIENS.filter((a) => wanted.length === 0 || wanted.includes(a.id));
const before = await generationsLeft();

async function generate(a: Alien, seed: number): Promise<void> {
	const dir = `${OUT}/${a.id}-${seed}`;
	if (existsSync(`${dir}/meta.json`)) return;
	mkdirSync(dir, { recursive: true });
	const prompt = `${a.subject}. ${BASE}${STYLE}`;
	const res = await api<{ background_job_id: string; character_id: string }>(
		'/create-character-v3',
		{
			body: {
				description: prompt,
				image_size: { width: a.size, height: a.size },
				view: 'low top-down',
				n_directions: 8,
				template_id: a.template,
				outline: 'single color black outline',
				detail: 'high detail',
				no_background: true,
				seed,
			},
		},
	);
	const job = await waitJob(res.background_job_id);
	const ch = await getCharacter(res.character_id);
	for (const d of ALL_DIRS) {
		const url = ch.rotation_urls[d];
		if (url) await download(url, `${dir}/${d}.png`);
	}
	await Bun.write(
		`${dir}/meta.json`,
		JSON.stringify({ id: a.id, seed, character_id: ch.id, size: a.size, prompt }, null, '\t'),
	);
	logGeneration({
		kind: 'concept',
		id: `${a.id}-${seed}`,
		endpoint: '/create-character-v3',
		character_id: ch.id,
		seed,
		prompt,
		usage: (job as { usage?: unknown }).usage,
	});
	console.log(`${a.id}-${seed}: ${ch.id}`);
}

const results = await Promise.allSettled(
	list.flatMap((a) => (a.seeds ?? SEEDS).map((seed) => generate(a, seed))),
);
for (const r of results) if (r.status === 'rejected') console.error(`FAILED: ${r.reason}`);

// Approval sheet: one row per creature and seed, the 4 generated directions, 4x (boss 2x).
const rows = ALIENS.flatMap((a) => (a.seeds ?? SEEDS).map((seed) => ({ a, seed })));
const done = rows.filter(({ a, seed }) => existsSync(`${OUT}/${a.id}-${seed}/meta.json`));
const CELL = 256;
const layers: OverlayOptions[] = [];
for (const [r, { a, seed }] of done.entries()) {
	for (const [c, d] of DIRS.entries()) {
		const file = `${OUT}/${a.id}-${seed}/${d}.png`;
		if (!existsSync(file)) continue;
		const zoom = Math.max(1, Math.floor(CELL / a.size));
		layers.push({
			input: await sharp(file)
				.resize(a.size * zoom, a.size * zoom, { kernel: 'nearest' })
				.png()
				.toBuffer(),
			left: c * CELL + Math.round((CELL - a.size * zoom) / 2),
			top: r * CELL + Math.round((CELL - a.size * zoom) / 2),
		});
	}
	layers.push({
		input: Buffer.from(
			`<svg width="${CELL * 4}" height="20"><text x="6" y="15" fill="#9aa3b5" font-size="14" font-family="monospace">${a.id} seed ${seed}</text></svg>`,
		),
		left: 0,
		top: r * CELL,
	});
}
await sharp({
	create: {
		width: CELL * DIRS.length,
		height: Math.max(1, done.length) * CELL,
		channels: 4,
		background: '#1b1f2a',
	},
})
	.composite(layers)
	.png()
	.toFile(SHEET);
const after = await generationsLeft();
console.log(
	`sheet: ${SHEET}` +
		(before !== null && after !== null ? ` · generations used: ${before - after}` : ''),
);
