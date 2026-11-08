// Superpower VFX loop (SDD-012 RF-07, T7.4): a 192 px top-down object + a 12-frame v3 animation,
// the same pipeline as `fx.super.jack`.
// Usage: bun scripts/pl-fx.ts <bob|lucia>
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
} as const;

const hero = process.argv[2] as keyof typeof FX;
if (!(hero in FX)) {
	console.error('usage: bun scripts/pl-fx.ts <bob|lucia>');
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
