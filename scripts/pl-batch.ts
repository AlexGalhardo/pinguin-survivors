// Batch of PixelLab pixflux images (weapon tiers, props, icons) from a JSON file, idempotent
// (skips outputs that exist) and capped: it stops before spending more than --max generations.
// Usage: bun scripts/pl-batch.ts <batch.json> [--max <generations>] [--only <key-prefix>]
//   batch.json = [{ "key": "weapon.machete.t2", "w": 64, "h": 32, "seed": 11,
//                   "prompt": "…", "outline": true, "transparent": true }]
// Output: art-src/pixellab/images/<key>/<seed>.png (+ log.jsonl line per image).

import { mkdirSync } from 'node:fs';
import { api, generationsLeft, logGeneration } from './lib/pixellab';

interface Entry {
	key: string;
	w: number;
	h: number;
	seed: number;
	prompt: string;
	/** Single color black outline (default true; tiles and VFX would set false). */
	outline?: boolean;
	/** Camera view (props use "high top-down"; weapons and icons leave it out). */
	view?: 'side' | 'low top-down' | 'high top-down';
	negative?: string;
}

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const flag = (name: string): string | undefined => {
	const i = args.indexOf(name);
	return i >= 0 ? args[i + 1] : undefined;
};
if (!file) {
	console.error('usage: bun scripts/pl-batch.ts <batch.json> [--max N] [--only prefix]');
	process.exit(1);
}
const max = Number(flag('--max') ?? '1000');
const only = flag('--only');
const entries = (JSON.parse(await Bun.file(file).text()) as Entry[]).filter(
	(e) => !only || e.key.startsWith(only),
);

const start = await generationsLeft();
let made = 0;
for (const e of entries) {
	const out = `art-src/pixellab/images/${e.key}/${e.seed}.png`;
	if (await Bun.file(out).exists()) continue;
	const now = await generationsLeft();
	if (start !== null && now !== null && start - now >= max) {
		console.log(`cap of ${max} generations reached: stopping`);
		break;
	}
	mkdirSync(`art-src/pixellab/images/${e.key}`, { recursive: true });
	const res = await api<{ image: { base64: string }; usage?: unknown }>('/create-image-pixflux', {
		body: {
			description: e.prompt,
			image_size: { width: e.w, height: e.h },
			...(e.outline !== false && { outline: 'single color black outline' }),
			shading: 'detailed shading',
			detail: 'highly detailed',
			no_background: true,
			...(e.view && { view: e.view }),
			...(e.negative && { negative_description: e.negative }),
			seed: e.seed,
		},
	});
	await Bun.write(out, Buffer.from(res.image.base64, 'base64'));
	logGeneration({
		kind: 'image',
		key: e.key,
		endpoint: '/create-image-pixflux',
		seed: e.seed,
		size: `${e.w}x${e.h}`,
		prompt: e.prompt,
		usage: res.usage,
	});
	made++;
	console.log(`ok ${e.key} (${e.w}x${e.h}, seed ${e.seed})`);
}
const end = await generationsLeft();
console.log(
	`images made: ${made}` +
		(start !== null && end !== null
			? ` · generations used: ${start - end} (balance ${start} -> ${end})`
			: ''),
);
