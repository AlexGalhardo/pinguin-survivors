// Flight animation for flyers that only have still rotations (zombieSkua, zombieGull, zombiePigeon)
// or a ground walk (alienFlyer): wings beating, hovering. The legacy characters belong to another
// account (404 when re-animated), so each frame set is generated from the existing 00.png of the
// `walk` direction with /animate-with-text-v3 (about 1 generation per direction).
// The `walk` frames are never touched: the result is a new `fly` folder packed into the same atlas.
// `--anim attack` reuses it for attack animations (T7.3).
// Usage: bun scripts/pl-fly.ts <id> [--anim fly] [--frames 8] [--dirs south,east] [--action "text"] [--out <dir>]
// Output (default): art-src/pixellab/anim/enemy.<id>/<anim>/<direction>/<nn>.png
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { api, generationsLeft, logGeneration, waitJob } from './lib/pixellab';

const args = process.argv.slice(2);
const id = args[0];
const opt = (name: string): string | undefined => {
	const i = args.indexOf(name);
	return i >= 0 ? args[i + 1] : undefined;
};
if (!id) {
	console.error(
		'usage: bun scripts/pl-fly.ts <id> [--frames 8] [--dirs a,b] [--action text] [--out dir]',
	);
	process.exit(1);
}
const frames = Number(opt('--frames') ?? 8);
const dirs = (opt('--dirs') ?? 'south,south-east,east,north-east,north').split(',');
const action =
	opt('--action') ??
	'flying: the creature beats its wings hard, wings sweeping from raised high to lowered low and back again, body bobbing up and down, hovering in place, seamless loop';
const anim = opt('--anim') ?? 'fly';
const out = opt('--out') ?? `art-src/pixellab/anim/enemy.${id}/${anim}`;
const SEED = Number(opt('--seed') ?? 22);
const before = await generationsLeft();

for (const dir of dirs) {
	const target = `${out}/${dir}`;
	if (existsSync(`${target}/00.png`)) continue;
	const src = `art-src/pixellab/anim/enemy.${id}/walk/${dir}/00.png`;
	const ref = readFileSync(src).toString('base64');
	const res = await api<{ background_job_id: string }>('/animate-with-text-v3', {
		body: {
			first_frame: { type: 'base64', base64: ref },
			action,
			frame_count: frames,
			no_background: true,
			seed: SEED,
		},
	});
	const job = await waitJob(res.background_job_id);
	const images = ((job as unknown as { last_response?: { images?: { base64?: string }[] } })
		.last_response?.images ?? []) as { base64?: string }[];
	mkdirSync(target, { recursive: true });
	for (const [i, im] of images.entries())
		if (im.base64)
			await Bun.write(
				`${target}/${String(i).padStart(2, '0')}.png`,
				Buffer.from(im.base64, 'base64'),
			);
	logGeneration({
		kind: 'animation',
		key: `enemy.${id}`,
		anim,
		endpoint: '/animate-with-text-v3',
		direction: dir,
		seed: SEED,
		prompt: action,
		frames: images.length,
	});
	console.log(`enemy.${id} ${anim} ${dir}: ${images.length} frames`);
}
const after = await generationsLeft();
if (before !== null && after !== null) console.log(`generations used: ${before - after}`);
