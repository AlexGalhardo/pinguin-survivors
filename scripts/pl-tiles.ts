// Isometric ground tiles for a biome via /create-tiles-pro (flat 2:1 diamonds, P-04).
// Usage: bun scripts/pl-tiles.ts <biome> "<numbered description>" [size=64] [seed=1]
// Output: art-src/pixellab/tiles/<biome>/<n>.png + response.json (raw job result).

import { mkdirSync } from 'node:fs';
import { api, download, generationsLeft, logGeneration, waitJob } from './lib/pixellab';

const [biome, description, sizeArg, seedArg] = process.argv.slice(2);
if (!biome || !description) {
	console.error('usage: bun scripts/pl-tiles.ts <biome> "<1). … 2). …>" [size] [seed]');
	process.exit(1);
}
const size = Number(sizeArg ?? 64);
const OUT = `art-src/pixellab/tiles/${biome}`;
mkdirSync(OUT, { recursive: true });
const before = await generationsLeft();
const res = await api<{ background_job_id?: string; tile_id?: string; id?: string }>(
	'/create-tiles-pro',
	{
		body: {
			description,
			tile_type: 'isometric',
			tile_size: size,
			tile_view: 'top-down',
			tile_depth_ratio: 0,
			outline_mode: 'segmentation',
			seed: Number(seedArg ?? 1),
		},
	},
);
const jobId = res.background_job_id;
const job = jobId ? await waitJob(jobId) : null;
const result = (job?.last_response ?? res) as Record<string, unknown>;
await Bun.write(`${OUT}/response.json`, JSON.stringify(result, null, '\t'));
const images = (result.tiles ?? result.images ?? []) as {
	url?: string;
	base64?: string;
	image?: { base64?: string };
}[];
for (const [n, img] of images.entries()) {
	const file = `${OUT}/${n}.png`;
	if (img.url) await download(img.url, file);
	else {
		const b64 = img.base64 ?? img.image?.base64;
		if (b64) await Bun.write(file, Buffer.from(b64, 'base64'));
	}
}
const after = await generationsLeft();
logGeneration({
	kind: 'tiles',
	biome,
	endpoint: '/create-tiles-pro',
	size,
	description,
	generations: before !== null && after !== null ? before - after : null,
});
console.log(
	`${biome}: ${images.length} tiles · keys: ${Object.keys(result).join(', ')} · generations ${before !== null && after !== null ? before - after : '?'}`,
);
