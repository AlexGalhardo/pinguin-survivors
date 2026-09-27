import { describe, expect, test } from 'bun:test';
import { DIFFICULTY } from '../src/data/difficulty';
import { difficultyMods, nextDifficulty, scaleFish } from '../src/logic/difficulty';

describe('difficulty', () => {
	test('easy and hard are ±25% on everything, normal is neutral', () => {
		for (const k of ['damage', 'hp', 'speed', 'rewards'] as const) {
			expect(DIFFICULTY.easy[k]).toBe(0.75);
			expect(DIFFICULTY.normal[k]).toBe(1);
			expect(DIFFICULTY.hard[k]).toBe(1.25);
		}
		expect(difficultyMods(undefined)).toBe(DIFFICULTY.normal);
	});

	test('fish rewards keep fractions as a chance', () => {
		expect(scaleFish(4, DIFFICULTY.easy, 0.9)).toBe(3);
		expect(scaleFish(4, DIFFICULTY.hard, 0.9)).toBe(5);
		expect(scaleFish(1, DIFFICULTY.hard, 0.2)).toBe(2);
		expect(scaleFish(1, DIFFICULTY.hard, 0.3)).toBe(1);
		expect(scaleFish(1, DIFFICULTY.easy, 0.8)).toBe(0);
	});

	test('cycles', () => {
		expect(nextDifficulty('normal', 1)).toBe('hard');
		expect(nextDifficulty('hard', 1)).toBe('easy');
		expect(nextDifficulty('easy', -1)).toBe('hard');
	});
});
