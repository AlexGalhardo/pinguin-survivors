// Superpower VFX loop (SDD-012 RF-07, T7.4): a 192 px top-down object + a 12-frame v3 animation,
// the same pipeline as `fx.super.jack`.
// Usage: bun scripts/pl-fx.ts <bob|lucia|jack-blades|jack-cleave>
// Output: art-src/pixellab/anim/fx.super.<hero>/loop/south/<nn>.png (never touches existing art).
import { existsSync, mkdirSync } from 'node:fs';
import { api, download, generationsLeft, logGeneration, waitJob } from './lib/pixellab';

const FX = {
	bob: {
		object: 'a carpet bombing strike seen from above: a ring of orange fire explosions with black smoke clouds and flying debris, bright yellow-white flame cores, dark scorched edge, centered, pixel art, transparent background, no outline',
		animation:
			'the fire explosions bloom and fade one after another around the ring as a seamless loop, smoke swirls upward, embers fly outward',
	},
	lucia: {
		object: 'an elemental cataclysm vortex seen from above with four swirling arms of red fire, cyan ice, brown earth and yellow lightning around a glowing white core, centered, pixel art, transparent background, no outline',
		animation:
			'the four elemental arms rotate clockwise around the pulsing white core as a seamless loop, sparks and shards fly outward',
	},
	// Melee redraws of Jack's Red Harvest (the original loop read as generic magic, too close to Lucia's).
	'jack-blades': {
		object: 'a whirlwind blade storm seen from above: a circular ring of giant crimson steel sword slashes and curved blade arcs spinning around an empty center, blood spray streaks, sharp white steel glints, dark red edge, centered, pixel art, transparent background, no outline, no magic runes, no glowing orbs, no energy',
		animation:
			'the blade arcs spin fast clockwise around the empty center as a seamless loop, slash trails flash and blood droplets fly outward',
	},
	'jack-cleave': {
		object: 'a ground-shattering melee slam seen from above: a cracked stone crater with jagged radial cracks and a ring of crossed axe and machete slash marks, red blood splatter, flying rock chunks, centered, pixel art, transparent background, no outline, no magic, no glow, no energy',
		animation:
			'huge slash marks cut across the crater one after another and the cracks pulse outward as a seamless loop, rock debris and blood fly outward',
	},
} as const;

const hero = process.argv[2] as keyof typeof FX;
if (!(hero in FX)) {
	console.error('usage: bun scripts/pl-fx.ts <bob|lucia|jack-blades|jack-cleave>');
	process.exit(1);
}
const dir = `art-src/pixellab/anim/fx.super.${hero}/loop/south`;
if (existsSync(`${dir}/00.png`)) {
	console.log(`${dir} already exists`);
	process.exit(0);
}
const before = await generationsLeft();
const spec = FX[hero];
const created = await api<{ background_job_id: string; object_id: string; usage?: unknown }>(
	'/create-1-direction-object',
	{ body: { description: spec.object, size: 192, view: 'top-down' } },
);
await waitJob(created.background_job_id);
logGeneration({
	kind: 'object',
	key: `fx.super.${hero}`,
	endpoint: '/create-1-direction-object',
	object_id: created.object_id,
	prompt: spec.object,
	usage: created.usage,
});
const anim = await api<{ submissions: { background_job_id: string | null }[] }>(
	`/objects/${created.object_id}/animations`,
	{
		body: {
			mode: 'v3',
			animation_description: spec.animation,
			frame_count: 12,
			display_name: 'loop',
		},
	},
);
logGeneration({
	kind: 'object-animation',
	key: `fx.super.${hero}`,
	endpoint: `/objects/${created.object_id}/animations`,
	prompt: spec.animation,
	frames: 12,
});
for (const s of anim.submissions) if (s.background_job_id) await waitJob(s.background_job_id);
const obj = await api<{
	animations?: { directions?: { storage_urls?: { frames?: string[] } }[] }[];
}>(`/objects/${created.object_id}`);
const frames = obj.animations?.[0]?.directions?.[0]?.storage_urls?.frames ?? [];
mkdirSync(dir, { recursive: true });
for (const [i, url] of frames.entries())
	await download(url, `${dir}/${String(i).padStart(2, '0')}.png`);
const after = await generationsLeft();
console.log(
	`fx.super.${hero}: ${frames.length} frames, object ${created.object_id}` +
		(before !== null && after !== null ? ` · generations used: ${before - after}` : ''),
);
