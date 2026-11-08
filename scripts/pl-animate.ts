// Animates an approved PixelLab character (docs/visual.md, budget rule P-54).
// Usage:
//   bun scripts/pl-animate.ts --key hero.jack.t1 --char <id> --anim walk --template walking-8-frames
//   bun scripts/pl-animate.ts --key hero.jack.t1 --char <id> --anim attack --action "slashing…" --frames 12
//   options: --dirs south,east (default: the 5 generated directions) · --mode template|skeleton-v3|v3
//            --fetch (only download frames of an existing animation named --anim)
// Output: art-src/pixellab/anim/<key>/<anim>/<dir>/<nn>.png, logged in art-src/pixellab/log.jsonl.

import { existsSync, mkdirSync } from 'node:fs';
import {
	api,
	type Direction,
	download,
	generationsLeft,
	getCharacter,
	logGeneration,
	waitJob,
} from './lib/pixellab';

/** South-west, west and north-west are mirrored in the engine (P-54). */
export const GENERATED_DIRS: Direction[] = ['south', 'south-east', 'east', 'north-east', 'north'];

function arg(name: string): string | undefined {
	const i = process.argv.indexOf(`--${name}`);
	return i >= 0 ? process.argv[i + 1] : undefined;
}

const key = arg('key');
const characterId = arg('char');
const anim = arg('anim');
const template = arg('template');
const action = arg('action');
const mode = arg('mode') ?? (template ? 'template' : 'v3');
const frames = Number(arg('frames') ?? 12);
const dirs = (arg('dirs')?.split(',') as Direction[] | undefined) ?? GENERATED_DIRS;
const fetchOnly = process.argv.includes('--fetch');
if (!key || !characterId || !anim || (!fetchOnly && !template && !action)) {
	console.error(
		'usage: bun scripts/pl-animate.ts --key <key> --char <id> --anim <name> (--template <id> | --action "<text>") [--frames 12] [--dirs a,b] [--mode m] [--fetch]',
	);
	process.exit(1);
}
const OUT = `art-src/pixellab/anim/${key}/${anim}`;

interface AnimationInfo {
	animation_group_id?: string;
	display_name?: string | null;
	directions?: { direction: string; frame_count: number; frames: string[] }[];
}

/** Downloads every frame of one animation (by group id, or by display name). */
async function fetchFrames(groupId: string | undefined): Promise<number> {
	const ch = (await getCharacter(characterId as string)) as unknown as {
		animations?: AnimationInfo[];
	};
	mkdirSync(OUT, { recursive: true });
	let saved = 0;
	for (const a of ch.animations ?? []) {
		if (groupId ? a.animation_group_id !== groupId : a.display_name !== anim) continue;
		for (const d of a.directions ?? []) {
			for (const [n, url] of d.frames.entries()) {
				const file = `${OUT}/${d.direction}/${String(n).padStart(2, '0')}.png`;
				if (!existsSync(file)) await download(url, file);
				saved++;
			}
		}
	}
	return saved;
}

if (fetchOnly) {
	console.log(`frames saved: ${await fetchFrames(undefined)}`);
	process.exit(0);
}

/** Directions that already have frames on disk. */
function doneDirs(): Set<string> {
	const out = new Set<string>();
	for (const d of dirs) if (existsSync(`${OUT}/${d}/00.png`)) out.add(d);
	return out;
}

const before = await generationsLeft();
let groupId: string | undefined;
// The API may accept fewer directions than asked (limited job slots): loop on the missing ones
// inside the same animation group until every direction has frames.
for (let round = 0; round < 6; round++) {
	const missing = dirs.filter((d) => !doneDirs().has(d));
	if (missing.length === 0) break;
	const body: Record<string, unknown> = {
		character_id: characterId,
		animation_name: anim,
		directions: missing,
		mode,
	};
	if (groupId) body.animation_group_id = groupId;
	if (template) body.template_animation_id = template;
	if (action) body.action_description = action;
	if (mode === 'v3') {
		body.frame_count = frames;
		body.keep_first_frame = false;
	}
	const res = await api<{
		background_job_ids: string[];
		directions: string[];
		animation_group_id?: string;
	}>('/characters/animations', { body });
	groupId = res.animation_group_id ?? groupId;
	console.log(`${key}/${anim}: ${res.directions.join(', ')} (group ${groupId})`);
	const jobs = await Promise.allSettled(
		res.background_job_ids.map((id) => waitJob(id, 30 * 60_000)),
	);
	for (const [i, j] of jobs.entries()) {
		if (j.status === 'rejected') console.error(`${res.directions[i]} FAILED: ${j.reason}`);
	}
	await fetchFrames(groupId);
}
const saved = doneDirs().size;
const after = await generationsLeft();
const used = before !== null && after !== null ? before - after : null;
logGeneration({
	kind: 'animation',
	key,
	anim,
	characterId,
	mode,
	template,
	action,
	frames: mode === 'v3' ? frames : undefined,
	directions: dirs,
	generations: used,
});
console.log(`${key}/${anim}: ${saved}/${dirs.length} directions · generations used ${used}`);
