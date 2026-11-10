import { describe, expect, test } from 'bun:test';
import { DIFFICULTY, DIFFICULTY_LEVELS } from '../src/data/difficulty';
import { difficultyMods, extraWaves, scaleDrops } from '../src/logic/difficulty';

describe('Difficulty (Easy, Normal, Hard)', () => {
	test('HP and damage are 0.5x, 1x and 2x; speed, drops and extra waves stay neutral', () => {
		expect(DIFFICULTY_LEVELS).toEqual([0, 1, 2]);
		expect(difficultyMods(0)).toEqual({ hp: 0.5, dmg: 0.5, speed: 1, drops: 1, extraWaves: 0 });
		expect(difficultyMods(1)).toEqual({ hp: 1, dmg: 1, speed: 1, drops: 1, extraWaves: 0 });
		expect(difficultyMods(2)).toEqual({ hp: 2, dmg: 2, speed: 1, drops: 1, extraWaves: 0 });
	});

	test('no level draws extra waves', () => {
		for (let seed = 0; seed < 50; seed++)
			for (const d of DIFFICULTY_LEVELS) {
				expect(DIFFICULTY[d].extraWaves).toBe(0);
				expect(extraWaves(seed, d)).toEqual([]);
			}
	});
});

describe('scaleDrops', () => {
	test('whole part always drops; the fraction is a chance of one more', () => {
		expect(scaleDrops(1, 1.5, 0.9)).toBe(1);
		expect(scaleDrops(1, 1.5, 0.1)).toBe(2);
		expect(scaleDrops(1, 0.9, 0.95)).toBe(0);
		expect(scaleDrops(1, 0.9, 0.5)).toBe(1);
	});
});
