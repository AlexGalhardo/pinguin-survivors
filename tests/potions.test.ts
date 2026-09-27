import { describe, expect, test } from 'bun:test';
import { type GambitContext, loadGambits, pickGambit, returnUnused } from '../src/logic/potions';
import { defaultSave } from '../src/logic/save';

const ctx = (over: Partial<GambitContext> = {}): GambitContext => ({
	hpRatio: 1,
	poisoned: false,
	bleeding: false,
	bossVisible: false,
	enemiesNear: 0,
	roundStart: false,
	...over,
});

describe('gambits (P-28)', () => {
	test('slots are checked in order and only once', () => {
		const slots = [
			{ potion: 'rage' as const, condition: 'bossVisible' as const, used: false },
			{ potion: 'heal' as const, condition: 'hpBelow50' as const, used: false },
			{ potion: 'megaHeal' as const, condition: 'hpBelow25' as const, used: false },
		];
		expect(pickGambit(slots, ctx())).toBe(-1);
		expect(pickGambit(slots, ctx({ hpRatio: 0.2 }))).toBe(1);
		(slots[1] as (typeof slots)[number]).used = true;
		expect(pickGambit(slots, ctx({ hpRatio: 0.2 }))).toBe(2);
		expect(pickGambit(slots, ctx({ hpRatio: 0.2, bossVisible: true }))).toBe(0);
	});

	test('crowded needs 12 enemies near', () => {
		const slots = [{ potion: 'haste' as const, condition: 'crowded' as const, used: false }];
		expect(pickGambit(slots, ctx({ enemiesNear: 11 }))).toBe(-1);
		expect(pickGambit(slots, ctx({ enemiesNear: 12 }))).toBe(0);
	});

	test('potions come from the stock and unused ones go back', () => {
		const save = defaultSave();
		save.potions.heal = 1;
		save.gambits = [
			{ potion: 'heal', condition: 'hpBelow50' },
			{ potion: 'heal', condition: 'hpBelow25' },
			{ potion: null, condition: null },
		];
		const slots = loadGambits(save.gambits, save.potions);
		expect(slots.map((s) => s.used)).toEqual([false, true, true]);
		expect(save.potions.heal).toBe(0);
		returnUnused(slots, save.potions);
		expect(save.potions.heal).toBe(1);
	});
});
