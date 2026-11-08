// Offline loudness normalization (no credits): SFX to -14 LUFS, music to -18 LUFS (docs/audio.md §2).
// Raw takes stay in art-src/elevenlabs; this rewrites the file in public/assets/audio. Needs ffmpeg.
// Usage: bun scripts/el-normalize.ts sfx.shopBuy music.shop …
import { copyFileSync, existsSync, mkdirSync, renameSync } from 'node:fs';

for (const key of process.argv.slice(2)) {
	const music = key.startsWith('music.');
	const file = `public/assets/audio/${music ? 'music' : 'sfx'}/${key}.mp3`;
	const raw = music
		? `art-src/elevenlabs/music/${key}.v1.mp3`
		: `art-src/elevenlabs/sfx/${key}/1.mp3`;
	if (!existsSync(raw)) {
		mkdirSync(raw.slice(0, raw.lastIndexOf('/')), { recursive: true });
		copyFileSync(file, raw);
	}
	const tmp = `${file}.tmp.mp3`;
	const target = music ? -18 : -14;
	const run = Bun.spawnSync([
		'ffmpeg',
		'-y',
		'-v',
		'error',
		'-i',
		raw,
		'-af',
		`loudnorm=I=${target}:TP=-1.5:LRA=11`,
		'-ar',
		'44100',
		'-b:a',
		'128k',
		tmp,
	]);
	if (run.exitCode !== 0) throw new Error(`ffmpeg failed for ${key}`);
	renameSync(tmp, file);
	console.log(`${key} -> ${target} LUFS`);
}
