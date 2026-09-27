// Main menu key art (16:9, 688×384 — the largest /generate-image-v2 size) with the approved
// hero sprite as subject reference. Original composition: only the mood of the user's
// references is described in text; no third-party artwork is sent to the API.
// Usage: bun scripts/pl-keyart.ts [jack|bob ...]
// Output: art-src/pixellab/keyart/<hero>-<seed>.png + log.

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { api, generationsLeft, logGeneration, waitJob } from './lib/pixellab';

const OUT = 'art-src/pixellab/keyart';
const SIZE = { width: 688, height: 384 };
const SEEDS = [7, 42];

const SCENE =
	'epic apocalyptic key art in detailed pixel art, wide cinematic 16:9 composition. ' +
	'The hero stands in the center on top of a huge pile of dead zombie animals (zombie penguins, seals, walruses, polar bear) ' +
	'dripping with blood, a sea of glowing lava and fire around the pile, a burning ruined antarctic research station and ' +
	'broken towers in the background, thick black smoke, a hellish orange sky with a pale moon and lightning, ' +
	'a horde of green-skinned rotting zombies with glowing eyes climbing the pile, flying embers and sparks. ' +
	'Strict color palette: blood red, fiery orange, toxic green, deep black shadows. Dramatic rim lighting, heroic low angle. ' +
	'Keep the top center darker and emptier for the game logo. No text, no letters, no logo.';

const HEROES = {
	jack:
		'The hero is Jack, a battle-worn rockhopper penguin with a spiky yellow crest and a red bandana, ' +
		'holding a bloody machete raised high, leather shoulder pads, bandages.',
	bob:
		'The hero is Bob, a chubby battle-worn emperor penguin in a green tactical vest with an ammo belt and a knitted beanie, ' +
		'eyepatch, firing a double-barrel shotgun with a bright muzzle flash.',
} as const;

const REFERENCE: Record<keyof typeof HEROES, string> = {
	jack: 'art-src/pixellab/concepts/jack-v3-a/south.png',
	bob: 'art-src/pixellab/concepts/bob-v3-a/south.png',
};

interface JobImage {
	base64?: string;
	image?: { base64?: string };
}

function extractImages(last: Record<string, unknown> | null | undefined): string[] {
	if (!last) return [];
	const candidates = [last.images, last.image ? [last.image] : undefined, last.results].find(
		Array.isArray,
	) as JobImage[] | undefined;
	return (candidates ?? [])
		.map((i) => i.base64 ?? i.image?.base64)
		.filter((b): b is string => typeof b === 'string');
}

async function generate(hero: keyof typeof HEROES, seed: number): Promise<void> {
	const file = `${OUT}/${hero}-${seed}.png`;
	if (existsSync(file)) {
		console.log(`skip ${file}`);
		return;
	}
	const description = `${SCENE} ${HEROES[hero]}`;
	const ref = readFileSync(REFERENCE[hero]).toString('base64');
	const res = await api<{ background_job_id: string }>('/generate-image-v2', {
		body: {
			description,
			image_size: SIZE,
			seed,
			no_background: false,
			reference_images: [
				{
					image: { type: 'base64', base64: ref, format: 'png' },
					size: { width: 96, height: 96 },
					usage_description: `This is ${hero === 'jack' ? 'Jack' : 'Bob'}, the main character; keep his look.`,
				},
			],
		},
	});
	const job = await waitJob(res.background_job_id);
	const images = extractImages(job.last_response);
	if (images.length === 0) {
		await Bun.write(
			`${OUT}/${hero}-${seed}.json`,
			JSON.stringify(job.last_response, null, '\t'),
		);
		throw new Error(`no image in job ${res.background_job_id} (response saved as json)`);
	}
	await Bun.write(file, Buffer.from(images[0] as string, 'base64'));
	logGeneration({
		kind: 'keyart',
		hero,
		seed,
		endpoint: '/generate-image-v2',
		size: SIZE,
		prompt: description,
		usage: (job as { usage?: unknown }).usage,
	});
	console.log(`${file} done`);
}

mkdirSync(OUT, { recursive: true });
const wanted = (process.argv.slice(2) as (keyof typeof HEROES)[]).filter((h) => h in HEROES);
const heroes = wanted.length ? wanted : (Object.keys(HEROES) as (keyof typeof HEROES)[]);
const before = await generationsLeft();
const results = await Promise.allSettled(heroes.flatMap((h) => SEEDS.map((s) => generate(h, s))));
for (const r of results) if (r.status === 'rejected') console.error(`FAILED: ${r.reason}`);
const after = await generationsLeft();
if (before !== null && after !== null) console.log(`generations used: ${before - after}`);
