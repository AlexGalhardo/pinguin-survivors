// Clean variants of the two bosses that only have a still image (kraken, abomination). The legacy
// characters belong to another account, so each boss is recreated as a new v3 character that takes the
// current south frame as `reference_image`. NOTHING is integrated: output goes to art-src/pixellab/anim-v2/
// (permanent rule: never replace existing art). Animate afterwards with pl-animate, e.g.
//   bun scripts/pl-animate.ts --key ../anim-v2/enemy.kraken --char <id> --anim walk --template scary-walk
// Usage: bun scripts/pl-boss-v2.ts [kraken|abomination|kraken-noref ...]
// `kraken-noref` skips the reference (the reference drags the dirt patch under the feet along).
// Output: art-src/pixellab/anim-v2/enemy.<id>/concept/<direction>.png + meta.json
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

const STYLE =
	'pixel art, top-down 3/4 view like Brotato, single color black outline, soft shading, one light source from the top left, ' +
	'zombie apocalypse boss, open red wounds, glowing green eyes, readable silhouette, standing on its own feet with a fully ' +
	'transparent background, no ground patch, no blood pool, no rocks under the feet, no text, no watermark';
const BOSSES: Record<string, { subject: string; seed: number; noRef?: boolean }> = {
	kraken: {
		subject:
			'a hulking undead octopus-headed brute: a purple tentacled octopus head with a bloody wounded dome and glowing green eyes on a muscular humanoid body in torn white rags and chains, standing on two clear separate legs with visible feet',
		seed: 11,
	},
	'kraken-noref': {
		subject:
			'a hulking undead octopus-headed brute: a purple tentacled octopus head with a bloody wounded dome, glowing green eyes and curling suckered tentacles, on a muscular humanoid body in torn white rags and chains, standing on two clear separate bare feet',
		seed: 22,
		noRef: true,
	},
	abomination: {
		subject:
			'a giant flesh abomination: a hulking pale rotting zombie giant in a ragged loincloth with six extra zombie heads and many arms growing from its shoulders, green glowing sores',
		seed: 11,
	},
};
const wanted = process.argv.slice(2);
const before = await generationsLeft();
for (const [id, b] of Object.entries(BOSSES)) {
	if (wanted.length > 0 && !wanted.includes(id)) continue;
	const base = id.replace('-noref', '');
	const dir = `art-src/pixellab/anim-v2/enemy.${base}${base === id ? '' : '-b'}/concept`;
	if (existsSync(`${dir}/meta.json`)) continue;
	mkdirSync(dir, { recursive: true });
	const ref = b.noRef
		? ''
		: readFileSync(`art-src/pixellab/anim/enemy.${base}/walk/south/00.png`).toString('base64');
	const prompt = `${b.subject}. ${STYLE}`;
	const res = await api<{ background_job_id: string; character_id: string }>(
		'/create-character-v3',
		{
			body: {
				description: prompt,
				...(!b.noRef && { reference_image: { type: 'base64', base64: ref } }),
				image_size: { width: 160, height: 160 },
				view: 'low top-down',
				n_directions: 8,
				template_id: 'mannequin',
				outline: 'single color black outline',
				detail: 'high detail',
				no_background: true,
				seed: b.seed,
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
		JSON.stringify({ id, character_id: ch.id, size: 160, prompt }, null, '\t'),
	);
	logGeneration({
		kind: 'concept',
		id: `${id}-v2`,
		endpoint: '/create-character-v3',
		character_id: ch.id,
		seed: b.seed,
		prompt,
		usage: (job as { usage?: unknown }).usage,
	});
	console.log(`${id}: ${ch.id}`);
}
const after = await generationsLeft();
if (before !== null && after !== null) console.log(`generations used: ${before - after}`);
