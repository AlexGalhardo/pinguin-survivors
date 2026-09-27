// Generates sound effects with ElevenLabs. Candidates go to art-src/elevenlabs/sfx/<key>/<n>.mp3;
// the chosen one (default: 1) is copied to public/assets/audio/sfx/<key>.mp3.
// Usage: bun scripts/el-sfx.ts [key ...]      (no args = every key not generated yet)
//        bun scripts/el-sfx.ts --pick <key> <n>

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { logAudio, soundEffect } from './lib/elevenlabs';

interface SfxDef {
	key: string;
	text: string;
	durationSeconds: number;
	variants: number;
}

/** Catalog grows with docs/audio.md; keys match src/art/manifest.ts (sfx.*). */
const SFX: SfxDef[] = [
	{
		key: 'sfx.achievement',
		text: 'Triumphant achievement unlocked sting for a brutal heavy metal video game: a short distorted electric guitar power chord hit with a bright metallic chime and a deep boom, epic and satisfying',
		durationSeconds: 2.5,
		variants: 3,
	},
];

const OUT = 'public/assets/audio/sfx';
const RAW = 'art-src/elevenlabs/sfx';

const args = process.argv.slice(2);
if (args[0] === '--pick') {
	const [, key, n] = args;
	copyFileSync(`${RAW}/${key}/${n}.mp3`, `${OUT}/${key}.mp3`);
	console.log(`picked ${key} #${n}`);
	process.exit(0);
}

const list = args.length ? SFX.filter((s) => args.includes(s.key)) : SFX;
mkdirSync(OUT, { recursive: true });
for (const sfx of list) {
	if (!args.length && existsSync(`${OUT}/${sfx.key}.mp3`)) {
		console.log(`skip ${sfx.key}`);
		continue;
	}
	mkdirSync(`${RAW}/${sfx.key}`, { recursive: true });
	for (let n = 1; n <= sfx.variants; n++) {
		const audio = await soundEffect({ text: sfx.text, durationSeconds: sfx.durationSeconds });
		await Bun.write(`${RAW}/${sfx.key}/${n}.mp3`, audio);
		logAudio({
			kind: 'sfx',
			key: sfx.key,
			variant: n,
			endpoint: '/v1/sound-generation',
			text: sfx.text,
			durationSeconds: sfx.durationSeconds,
		});
		console.log(`${sfx.key} #${n} (${audio.byteLength} bytes)`);
	}
	copyFileSync(`${RAW}/${sfx.key}/1.mp3`, `${OUT}/${sfx.key}.mp3`);
}
