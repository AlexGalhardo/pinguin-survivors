// Ground tiles for a biome via /create-tiles-pro. Default type is the legacy isometric diamond;
// `square_topdown` gives the 64x64 top-down tiles of the 1.0 camera (ADR-003).
// Usage: bun scripts/pl-tiles.ts <biome> "<numbered description>" [size=64] [seed=1] [type=isometric]
// Output: art-src/pixellab/tiles/<biome>/<n>.png + response.json (raw job result).

import { mkdirSync } from 'node:fs';
import { api, download, generationsLeft, logGeneration, waitJob } from './lib/pixellab';

const [biome, description, sizeArg, seedArg, typeArg] = process.argv.slice(2);
const tileType = typeArg ?? 'isometric';
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
			tile_type: tileType,
			tile_size: size,
			tile_view: 'top-down',
			...(tileType === 'isometric' && { tile_depth_ratio: 0 }),
			outline_mode: 'segmentation',
			seed: Number(seedArg ?? 1),
		},
	},
);
const jobId = res.background_job_id;
const job = jobId ? await waitJob(jobId) : null;
const result = (job?.last_response ?? res) as Record<string, unknown>;
await Bun.write(`${OUT}/response.json`, JSON.stringify(result, null, '\t'));
// The finished tiles live behind GET /tiles-pro/{tile_id} (`storage_urls.tile_<n>`).
const tileId = (result.tile_id ?? res.tile_id ?? res.id) as string | undefined;
let saved = 0;
if (tileId) {
	const detail = await api<{ storage_urls?: Record<string, string> }>(`/tiles-pro/${tileId}`);
	for (const [name, url] of Object.entries(detail.storage_urls ?? {})) {
		const n = Number(name.replace('tile_', ''));
		if (!Number.isInteger(n)) continue;
		await download(url, `${OUT}/${n}.png`);
		saved++;
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
	`${biome}: ${saved} tiles · keys: ${Object.keys(result).join(', ')} · generations ${before !== null && after !== null ? before - after : '?'}`,
);
