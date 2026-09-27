import { describe, expect, test } from 'bun:test';
import { addXp, freePoints, orbXp, roundEndFish, xpToNext } from '../src/logic/progression';

describe('progression (P-24/P-25)', () => {
	test('xp curve grows', () => {
		expect(xpToNext(1)).toBe(80);
		expect(xpToNext(10)).toBeGreaterThan(xpToNext(9));
	});

	test('addXp rolls over several levels and caps at 100', () => {
		const s = { level: 1, xp: 0 };
		expect(addXp(s, xpToNext(1) + xpToNext(2) + 5)).toBe(2);
		expect(s).toEqual({ level: 3, xp: 5 });
		const max = { level: 99, xp: 0 };
		addXp(max, 1e12);
		expect(max).toEqual({ level: 100, xp: 0 });
	});

	test('free points', () => {
		expect(freePoints(5, { crit: 2, armor: 1 })).toBe(1);
		expect(freePoints(1, {})).toBe(0);
	});

	test('orb xp and round-end fish', () => {
		expect(orbXp(1, 10)).toBeCloseTo(1.5);
		expect(roundEndFish(7)).toBe(5);
	});
});
