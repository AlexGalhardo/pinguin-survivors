import { describe, expect, test } from 'bun:test';
import { MUSIC_KEYS, musicForRound } from '../src/core/music';
import { BOSS_ROUNDS } from '../src/data/enemies';
import { ROUND_TRACKS, roundTrack, stepFade } from '../src/logic/music';
import { isBossRound } from '../src/logic/round';

test('each boss round plays the theme of its own boss, also in the endless', () => {
	for (const [i, id] of BOSS_ROUNDS.entries())
		expect(musicForRound((i + 1) * 5, 1, id)).toBe(`music.boss.${id}`);
	expect(musicForRound(55, 1, 'kraken')).toBe('music.boss.kraken');
	expect(musicForRound(60, 1)).toBe('music.boss');
	expect(musicForRound(60, 1, 'unknown')).toBe('music.boss');
});

test('normal rounds draw one of the nine themes, deterministic by seed, never repeating the previous', () => {
	for (const seed of [0, 1, 7, 12345]) {
		let prev = 0;
		for (let round = 1; round <= 120; round++) {
			if (isBossRound(round)) continue;
			const t = roundTrack(seed, round);
			expect(t).toBeGreaterThanOrEqual(1);
			expect(t).toBeLessThanOrEqual(ROUND_TRACKS);
			expect(t).not.toBe(prev);
			expect(roundTrack(seed, round)).toBe(t);
			expect(musicForRound(round, seed)).toBe(`music.round.${t}` as never);
			prev = t;
		}
	}
});

test('the draw uses every theme and depends on the seed', () => {
	const used = new Set<number>();
	for (let round = 1; round <= 200; round++)
		if (!isBossRound(round)) used.add(roundTrack(3, round));
	expect(used.size).toBe(ROUND_TRACKS);
	const run = (seed: number) => Array.from({ length: 12 }, (_, i) => roundTrack(seed, i + 1));
	expect(run(1)).not.toEqual(run(2));
});

test('every new track is registered for loading and the legacy ones stay', () => {
	for (const k of [
		'music.shop.theme',
		'music.round.1',
		'music.round.9',
		'music.boss.rotTreant',
		'music.round',
		'music.boss',
		'music.late',
		'music.forest',
		'music.city',
		'music.shop',
	])
		expect(MUSIC_KEYS).toContain(k as never);
	expect(MUSIC_KEYS).toHaveLength(8 + ROUND_TRACKS + BOSS_ROUNDS.length);
});

describe('stepFade (game-clock music fades)', () => {
	test.each([
		[0, 0.26, 0.4, 0.13, false],
		[0, 0.26, 0.8, 0.26, true],
		[0.26, 0, 1.5, 0, true],
		[0.26, 0, 0, 0.26, false],
	])('from %p to %p after %p s → %p (done %p)', (from, to, dt, volume, done) => {
		const fade = { from, to, duration: 0.8, elapsed: 0 };
		const r = stepFade(fade, dt);
		expect(r.volume).toBeCloseTo(volume);
		expect(r.done).toBe(done);
	});

	test('a fade advanced in small steps ends on its target', () => {
		const fade = { from: 0.26, to: 0, duration: 0.8, elapsed: 0 };
		let r = { volume: 0.26, done: false };
		for (let i = 0; i < 100 && !r.done; i++) r = stepFade(fade, 1 / 60);
		expect(r).toEqual({ volume: 0, done: true });
	});
});
