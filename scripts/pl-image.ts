// One-off pixel art image (UI, icons, badges) via PixelLab pixflux, a few seeds to choose from.
// Usage: bun scripts/pl-image.ts <key> <size> "<prompt>" [seed ...]
// Output: art-src/pixellab/images/<key>/<seed>.png + meta.json (all seeds and prompt).

import { mkdirSync } from 'node:fs';
import { api, generationsLeft, logGeneration } from './lib/pixellab';

const [key, sizeArg, prompt, ...seedArgs] = process.argv.slice(2);
if (!key || !sizeArg || !prompt) {
	console.error('usage: bun scripts/pl-image.ts <key> <size> "<prompt>" [seed ...]');
	process.exit(1);
}
const size = Number(sizeArg);
const seeds = seedArgs.length ? seedArgs.map(Number) : [11, 22, 33];
const dir = `art-src/pixellab/images/${key}`;
mkdirSync(dir, { recursive: true });

const before = await generationsLeft();
for (const seed of seeds) {
	const res = await api<{ image: { base64: string }; usage?: unknown }>('/create-image-pixflux', {
		body: {
			description: prompt,
			image_size: { width: size, height: size },
			outline: 'single color black outline',
			shading: 'detailed shading',
			detail: 'highly detailed',
			no_background: true,
			seed,
		},
	});
	await Bun.write(`${dir}/${seed}.png`, Buffer.from(res.image.base64, 'base64'));
	logGeneration({
		kind: 'image',
		key,
		endpoint: '/create-image-pixflux',
		seed,
		size,
		prompt,
		usage: res.usage,
	});
	console.log(`${key} seed ${seed}: ${dir}/${seed}.png`);
}
await Bun.write(`${dir}/meta.json`, JSON.stringify({ key, size, prompt, seeds }, null, '\t'));
const after = await generationsLeft();
if (before !== null && after !== null) console.log(`generations used: ${before - after}`);
