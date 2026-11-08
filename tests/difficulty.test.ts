import { describe, expect, test } from 'bun:test';
import { DANGER, DANGER_LEVELS, EXTRA_WAVES } from '../src/data/difficulty';
import { dangerMods, extraWaves, scaleDrops } from '../src/logic/difficulty';

describe('Danger 0-5', () => {
	test('D1 is the baseline and every stat grows with the Danger', () => {
		expect(dangerMods(1)).toEqual({ hp: 1, dmg: 1, speed: 1, drops: 1, extraWaves: 0 });
		for (const d of DANGER_LEVELS.slice(1)) {
			const prev = DANGER[(d - 1) as 0 | 1 | 2 | 3 | 4];
			expect(DANGER[d].hp).toBeGreaterThan(prev.hp);
			expect(DANGER[d].dmg).toBeGreaterThan(prev.dmg);
			expect(DANGER[d].extraWaves).toBeGreaterThanOrEqual(prev.extraWaves);
		}
	});

	test('A1: extraWaves is empty on D0/1, 1 round on D2/3, 3 distinct rounds in [4, 19] on D4/5', () => {
		const [min, max] = EXTRA_WAVES.rounds;
		const expected = { 0: 0, 1: 0, 2: 1, 3: 1, 4: 3, 5: 3 } as const;
		for (let seed = 0; seed < 500; seed++)
			for (const d of DANGER_LEVELS) {
				const waves = extraWaves(seed, d);
				expect(waves).toHaveLength(expected[d]);
				expect(new Set(waves.map((w) => w.round)).size).toBe(expected[d]);
				for (const w of waves) {
					expect(w.round).toBeGreaterThanOrEqual(min);
					expect(w.round).toBeLessThanOrEqual(max);
					expect(['elite', 'horde']).toContain(w.kind);
				}
			}
	});

	test('waves are deterministic by seed and sorted by round', () => {
		expect(extraWaves(42, 5)).toEqual(extraWaves(42, 5));
		const rounds = extraWaves(7, 4).map((w) => w.round);
		expect(rounds).toEqual([...rounds].sort((a, b) => a - b));
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
