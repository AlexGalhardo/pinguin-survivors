import { expect, test } from 'bun:test';
import { musicForRound } from '../src/core/music';

test('boss track on boss rounds, late track from round 21', () => {
	expect(musicForRound(5, false)).toBe('music.round');
	expect(musicForRound(10, true)).toBe('music.boss');
	expect(musicForRound(21, false)).toBe('music.late');
	expect(musicForRound(30, true)).toBe('music.boss');
	expect(musicForRound(45, false)).toBe('music.late');
});
