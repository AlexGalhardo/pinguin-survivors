import { describe, expect, test } from 'bun:test';
import {
	bossHpMul,
	cycle,
	dmgMul,
	eliteTiers,
	hpMul,
	isBossRound,
	rollElite,
	roundDuration,
	spawnRate,
} from '../src/logic/round';

describe('round timing (P-14)', () => {
	test('20s, +5s per round, capped at 60s', () => {
		expect([1, 2, 3, 8, 9, 15].map(roundDuration)).toEqual([20, 25, 30, 55, 60, 60]);
	});

	test('boss every 10 rounds with 3 minutes', () => {
		expect(isBossRound(10)).toBe(true);
		expect(isBossRound(20)).toBe(true);
		expect(isBossRound(11)).toBe(false);
		expect(roundDuration(10)).toBe(180);
	});
});

describe('elites (P-16)', () => {
	test('purple on multiples of 3, orange too after the first boss, never on boss rounds', () => {
		expect(eliteTiers(1)).toEqual([]);
		expect(eliteTiers(3)).toEqual(['purple']);
		expect(eliteTiers(9)).toEqual(['purple']);
		expect(eliteTiers(12)).toEqual(['purple', 'orange']);
		expect(eliteTiers(30)).toEqual([]);
	});

	test('roll shares', () => {
		expect(rollElite(4, 0)).toBeNull();
		expect(rollElite(6, 0.01)).toBe('purple');
		expect(rollElite(12, 0.01)).toBe('orange');
		expect(rollElite(12, 0.1)).toBe('purple');
		expect(rollElite(12, 0.5)).toBeNull();
	});
});

describe('scaling', () => {
	test('cycles of 10 rounds', () => {
		expect([1, 10, 11, 20, 21].map(cycle)).toEqual([0, 0, 1, 1, 2]);
	});

	test('multipliers grow and jump at each cycle', () => {
		expect(hpMul(1)).toBe(1);
		expect(hpMul(11)).toBeCloseTo((1 + 0.15 * 10) * 1.25);
		expect(dmgMul(1)).toBe(1);
		expect(dmgMul(10)).toBeLessThan(dmgMul(11));
		expect(bossHpMul(10)).toBe(1);
		expect(bossHpMul(20)).toBeCloseTo(1.6);
	});

	test('spawn rate is capped', () => {
		expect(spawnRate(1)).toBeCloseTo(2.6);
		expect(spawnRate(100)).toBe(25);
	});
});
