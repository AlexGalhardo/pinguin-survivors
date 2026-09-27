// Saves PixelLab results generated through the MCP (no token needed: download URLs are public)
// into art-src/pixellab and logs them like the other pl-* scripts.
// Usage: bun scripts/pl-save.ts <batch.json>
//   batch.json = [{ "key": "weapon.machete", "url": "https://…", "prompt": "…", "endpoint":
//                   "/create-image-pixflux", "seed": 11, "size": "64x32", "dir": "images" }]
// Output: art-src/pixellab/<dir>/<key>/<seed|name>.png (dir defaults to "images").

import { existsSync, readFileSync } from 'node:fs';
import { download, logGeneration } from './lib/pixellab';

interface Entry {
	key: string;
	url: string;
	prompt?: string;
	endpoint?: string;
	seed?: number;
	size?: string;
	dir?: string;
	name?: string;
	generations?: number;
}

const file = process.argv[2];
if (!file) {
	console.error('usage: bun scripts/pl-save.ts <batch.json>');
	process.exit(1);
}
const entries = JSON.parse(readFileSync(file, 'utf-8')) as Entry[];
for (const e of entries) {
	const out = `art-src/pixellab/${e.dir ?? 'images'}/${e.key}/${e.name ?? e.seed ?? 'image'}.png`;
	if (existsSync(out)) {
		console.log(`skip ${out}`);
		continue;
	}
	await download(e.url, out);
	logGeneration({
		kind: 'image',
		via: 'mcp',
		key: e.key,
		endpoint: e.endpoint ?? '/create-image-pixflux',
		seed: e.seed,
		size: e.size,
		prompt: e.prompt,
		generations: e.generations ?? 1,
	});
	console.log(`${e.key} → ${out}`);
}
