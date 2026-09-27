// Animates an approved PixelLab character (docs/art-and-assets.md). One v3 job per direction.
// Usage: bun scripts/pl-animate.ts <heroKey> <characterId> <anim> "<action>" [frames=12] [dir,dir,...|all]
// Example (pilot): bun scripts/pl-animate.ts hero.jack.t1 74719afa-... walk "walking forward, flippers swinging" 12 south
// Output: art-src/pixellab/anim/<heroKey>/<anim>/<dir>/<nn>.png + meta.json, logged in log.jsonl.

import { existsSync, mkdirSync } from 'node:fs';
import {
	api,
	DIRECTIONS_8,
	type Direction,
	download,
	generationsLeft,
	getCharacter,
	logGeneration,
	waitJob,
} from './lib/pixellab';

const fetchOnly = process.argv.includes('--fetch');
const [key, characterId, anim, action, framesArg, dirsArg] = process.argv
	.slice(2)
	.filter((a) => a !== '--fetch');
if (!key || !characterId || !anim || !action) {
	console.error(
		'usage: bun scripts/pl-animate.ts <key> <characterId> <anim> "<action>" [frames] [dirs|all]',
	);
	process.exit(1);
}
const frames = Number(framesArg ?? 12);
const dirs: Direction[] =
	!dirsArg || dirsArg === 'all' ? DIRECTIONS_8 : (dirsArg.split(',') as Direction[]);
const OUT = `art-src/pixellab/anim/${key}/${anim}`;

interface AnimationInfo {
	animation_group_id?: string;
	display_name?: string;
	directions?: { direction: string; frame_count: number; frames: string[] }[];
}

/** Downloads every frame of one animation (by group id, or by name when no group is known). */
async function fetchFrames(
	characterId: string,
	anim: string,
	groupId: string | undefined,
	out: string,
): Promise<number> {
	const ch = (await getCharacter(characterId)) as unknown as { animations?: AnimationInfo[] };
	mkdirSync(out, { recursive: true });
	await Bun.write(`${out}/character.json`, JSON.stringify(ch, null, '\t'));
	let saved = 0;
	for (const a of ch.animations ?? []) {
		if (groupId ? a.animation_group_id !== groupId : a.display_name !== anim) continue;
		for (const d of a.directions ?? []) {
			for (const [n, url] of d.frames.entries()) {
				const file = `${out}/${d.direction}/${String(n).padStart(2, '0')}.png`;
				if (!existsSync(file)) await download(url, file);
				saved++;
			}
		}
	}
	return saved;
}

if (fetchOnly) {
	console.log(`frames saved: ${await fetchFrames(characterId, anim, undefined, OUT)}`);
	process.exit(0);
}

const before = await generationsLeft();
const res = await api<{
	background_job_ids: string[];
	directions: string[];
	animation_group_id?: string;
}>('/characters/animations', {
	body: {
		character_id: characterId,
		animation_name: anim,
		action_description: action,
		mode: 'v3',
		frame_count: frames,
		directions: dirs,
		keep_first_frame: false,
	},
});
console.log(`jobs: ${res.background_job_ids.length} group ${res.animation_group_id}`);
const jobs = await Promise.allSettled(res.background_job_ids.map((id) => waitJob(id, 30 * 60_000)));
for (const [i, j] of jobs.entries()) {
	if (j.status === 'rejected') console.error(`${res.directions[i]} FAILED: ${j.reason}`);
}

const saved = await fetchFrames(characterId, anim, res.animation_group_id, OUT);
const after = await generationsLeft();
const used = before !== null && after !== null ? before - after : null;
logGeneration({
	kind: 'animation',
	key,
	anim,
	characterId,
	action,
	frames,
	directions: dirs,
	generations: used,
});
console.log(`frames saved: ${saved} · generations used: ${used}`);
