import { expect, test } from 'bun:test';
import { musicForRound } from '../src/core/music';

test('boss track on boss rounds, late track from round 21', () => {
	expect(musicForRound(5, false)).toBe('music.round');
	expect(musicForRound(10, true)).toBe('music.boss');
	expect(musicForRound(21, false)).toBe('music.late');
	expect(musicForRound(30, true)).toBe('music.boss');
	expect(musicForRound(45, false)).toBe('music.late');
});

test('each biome has its own track; the legacy ones reuse the original tracks; bosses win', () => {
	expect(musicForRound(15, false, 'forest')).toBe('music.forest');
	expect(musicForRound(25, false, 'city')).toBe('music.city');
	expect(musicForRound(40, false, 'antarctica')).toBe('music.round');
	expect(musicForRound(40, false, 'station')).toBe('music.round');
	expect(musicForRound(40, false, 'ruins')).toBe('music.late');
	expect(musicForRound(20, true, 'forest')).toBe('music.boss');
});
