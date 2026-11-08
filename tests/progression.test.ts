import { describe, expect, test } from 'bun:test';
import { maxSelectableDanger, recordBestRound, unlockDanger } from '../src/logic/difficulty';
import { addXp, freePoints, orbXp, roundEndFish, xpToNext } from '../src/logic/progression';
import { defaultSave, parseSave, serializeSave } from '../src/logic/save';
import v1Fixture from './fixtures/save-v1.json';

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

describe('Danger unlock (SDD-005 A4)', () => {
	test('beating the round 20 boss on D1 unlocks D2 for that hero only', () => {
		const save = defaultSave();
		unlockDanger(save, 'jack', 1);
		expect(save.progress.hero.jack.dangerUnlocked).toBe(2);
		expect(save.progress.hero.bob.dangerUnlocked).toBe(1);
		expect(maxSelectableDanger(save, 'jack')).toBe(2);
		expect(maxSelectableDanger(save, 'bob')).toBe(1);
	});

	test('does not go backwards, skip locked levels or pass the cap', () => {
		const save = defaultSave();
		unlockDanger(save, 'bob', 0);
		expect(save.progress.hero.bob.dangerUnlocked).toBe(1);
		unlockDanger(save, 'bob', 4);
		expect(save.progress.hero.bob.dangerUnlocked).toBe(1);
		for (const d of [1, 2, 3, 4, 5] as const) unlockDanger(save, 'bob', d);
		expect(save.progress.hero.bob.dangerUnlocked).toBe(6);
		expect(maxSelectableDanger(save, 'bob')).toBe(5);
		unlockDanger(save, 'bob', 5);
		expect(save.progress.hero.bob.dangerUnlocked).toBe(6);
	});

	test('best round per Danger is kept per hero and survives a save round-trip', () => {
		const save = defaultSave();
		recordBestRound(save, 'lucia', 3, 14);
		recordBestRound(save, 'lucia', 3, 9);
		recordBestRound(save, 'lucia', 0, 21);
		const back = parseSave(serializeSave(save));
		expect(back.bestRoundByDanger.lucia).toEqual([21, 0, 0, 14, 0, 0]);
		expect(back.bestRoundByDanger.jack).toEqual([0, 0, 0, 0, 0, 0]);
	});

	test('v1 migration adds empty bests and stays idempotent', () => {
		const once = parseSave(JSON.stringify(v1Fixture));
		expect(once.bestRoundByDanger.jack).toEqual([0, 0, 0, 0, 0, 0]);
		expect(parseSave(serializeSave(once))).toEqual(once);
	});
});
