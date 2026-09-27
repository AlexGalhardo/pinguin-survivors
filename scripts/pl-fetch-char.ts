// Downloads a PixelLab character (made via script or MCP) from its public zip export, without a
// token, and files it in the art-src layout.
// Usage:
//   bun scripts/pl-fetch-char.ts --char <id> --concept art-src/pixellab/concepts/enemies/<id>
//       → <dir>/<direction>.png (8 rotations) + meta.json
//   bun scripts/pl-fetch-char.ts --char <id> --key hero.bob [--anims idle,walk8,hurt,death]
//       → art-src/pixellab/anim/<key>/<anim>/<direction>/<nn>.png (animation display names)
// Needs tar.exe (Windows 10+) or unzip.

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

function arg(name: string): string | undefined {
	const i = process.argv.indexOf(`--${name}`);
	return i >= 0 ? process.argv[i + 1] : undefined;
}

const id = arg('char');
const conceptDir = arg('concept');
const key = arg('key');
const only = arg('anims')?.split(',');
if (!id || (!conceptDir && !key)) {
	console.error(
		'usage: bun scripts/pl-fetch-char.ts --char <id> (--concept <dir> | --key <key> [--anims a,b])',
	);
	process.exit(1);
}

const tmp = join(process.env.TEMP ?? process.env.TMPDIR ?? '/tmp', `pl-char-${id}`);
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
const res = await fetch(`https://api.pixellab.ai/mcp/characters/${id}/download`);
if (!res.ok) throw new Error(`download ${res.status} for ${id}`);
await Bun.write(join(tmp, 'char.zip'), await res.arrayBuffer());
// Windows' own bsdtar reads zip (Git Bash's GNU tar does not); elsewhere use unzip.
const cmd =
	process.platform === 'win32'
		? [join(process.env.SystemRoot ?? 'C:/Windows', 'System32', 'tar.exe'), '-xf', 'char.zip']
		: ['unzip', '-q', 'char.zip'];
const unzip = Bun.spawnSync(cmd, { cwd: tmp });
if (unzip.exitCode !== 0) throw new Error(`unzip: ${unzip.stderr.toString()}`);

interface Meta {
	states: {
		character: { id: string; prompt?: string; size?: unknown };
		frames: {
			rotations: Record<string, string>;
			animations?: Record<string, Record<string, string[]>>;
		};
	}[];
}
const meta = JSON.parse(readFileSync(join(tmp, 'metadata.json'), 'utf-8')) as Meta;
const state = meta.states.find((s) => s.character.id === id) ?? meta.states[0];
if (!state) throw new Error(`no state in zip of ${id}`);

if (conceptDir) {
	mkdirSync(conceptDir, { recursive: true });
	for (const [dir, file] of Object.entries(state.frames.rotations))
		copyFileSync(join(tmp, file), join(conceptDir, `${dir}.png`));
	await Bun.write(
		join(conceptDir, 'meta.json'),
		JSON.stringify(
			{
				character_id: id,
				size: state.character.size,
				description: state.character.prompt,
			},
			null,
			'\t',
		),
	);
	console.log(`${id}: ${Object.keys(state.frames.rotations).length} rotations → ${conceptDir}`);
}

if (key) {
	for (const [anim, dirs] of Object.entries(state.frames.animations ?? {})) {
		if (only && !only.includes(anim)) continue;
		for (const [dir, frames] of Object.entries(dirs)) {
			const out = `art-src/pixellab/anim/${key}/${anim}/${dir}`;
			// Re-fetching replaces a direction wholesale (a re-rolled animation keeps its name).
			if (existsSync(out)) for (const f of readdirSync(out)) rmSync(join(out, f));
			mkdirSync(out, { recursive: true });
			for (const [n, file] of frames.entries())
				copyFileSync(join(tmp, file), join(out, `${String(n).padStart(2, '0')}.png`));
		}
		console.log(`${key}/${anim}: ${Object.keys(dirs).join(', ')}`);
	}
}
rmSync(tmp, { recursive: true, force: true });
