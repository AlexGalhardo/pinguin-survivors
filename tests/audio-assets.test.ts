import { expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { MUSIC_KEYS } from '../src/core/music';
import { SFX, SFX_VARIANTS } from '../src/data/sfx';

const SFX_DIR = 'public/assets/audio/sfx';

test('every SFX key has its file and every variant take exists', () => {
	for (const key of Object.keys(SFX)) {
		expect(existsSync(`${SFX_DIR}/${key}.mp3`)).toBe(true);
		for (let n = 2; n <= (SFX_VARIANTS[key] ?? 1); n++)
			expect(existsSync(`${SFX_DIR}/${key}.${n}.mp3`)).toBe(true);
	}
});

test('every music key has its file', () => {
	for (const key of MUSIC_KEYS)
		expect(existsSync(`public/assets/audio/music/${key}.mp3`)).toBe(true);
});
