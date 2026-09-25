import { describe, expect, it } from 'bun:test';
import { CHARACTERS } from '../src/data/characters';
import {
	addMods,
	computeStats,
	emptyStats,
	finalMaxHp,
	finalMoveSpeed,
	STAT_KEYS,
} from '../src/logic/stats';

describe('stats model', () => {
	it('empty stats has every key at zero', () => {
		const s = emptyStats();
		for (const k of STAT_KEYS) expect(s[k]).toBe(0);
	});

	it('adds modifiers without mutating inputs', () => {
		const base = { maxHp: 10 };
		const out = addMods(base, { maxHp: 5, armor: 1 }, 2);
		expect(out).toEqual({ maxHp: 20, armor: 2 });
		expect(base).toEqual({ maxHp: 10 });
	});

	it('computes the class base stats (balancing §3)', () => {
		const w = computeStats(CHARACTERS.warrior.stats);
		expect(w.maxHp).toBe(30);
		expect(w.armor).toBe(3);
		expect(w.critChance).toBeCloseTo(0.05);
		expect(computeStats(CHARACTERS.ranger.stats).critChance).toBeCloseTo(0.08);
		expect(computeStats(CHARACTERS.mage.stats).abilityPower).toBeCloseTo(0.5);
		expect(computeStats(CHARACTERS.mage.stats).maxHp).toBe(15);
		expect(CHARACTERS.ranger.speed).toBe(105);
	});

	it('applies max HP percentage and never drops below 1', () => {
		expect(finalMaxHp(computeStats({ maxHp: 30, maxHpPct: -0.1 }))).toBe(27);
		expect(finalMaxHp(computeStats({ maxHp: 5, maxHpPct: -2 }))).toBe(1);
	});

	it('applies move speed percentage with a floor', () => {
		expect(finalMoveSpeed(100, computeStats({ moveSpeed: 0.15 }))).toBeCloseTo(115);
		expect(finalMoveSpeed(100, computeStats({ moveSpeed: -5 }))).toBeCloseTo(30);
	});
});
