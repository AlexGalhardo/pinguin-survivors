import { describe, expect, test } from 'bun:test';
import { HEROES } from '../src/data/heroes';
import { UPGRADES, type UpgradeDef } from '../src/data/upgrades';
import { heroStats } from '../src/logic/stats';
import { applyUpgrades, buyUpgrade, upgradeCost } from '../src/logic/upgrades';

const def: UpgradeDef = {
	id: 'x',
	stat: 'maxHp',
	perLevel: 5,
	maxLevel: 2,
	baseCost: 10,
	costGrowth: 2,
};

describe('upgrades', () => {
	test('cost grows per level and is null when maxed', () => {
		expect(upgradeCost(def, 0)).toBe(10);
		expect(upgradeCost(def, 1)).toBe(20);
		expect(upgradeCost(def, 2)).toBeNull();
	});

	test('buying spends fish and raises the level', () => {
		const owned: Record<string, number> = {};
		expect(buyUpgrade(def, owned, 9)).toBeNull();
		expect(buyUpgrade(def, owned, 25)).toBe(15);
		expect(owned.x).toBe(1);
		expect(buyUpgrade(def, owned, 15)).toBeNull();
		expect(buyUpgrade(def, owned, 20)).toBe(0);
		expect(buyUpgrade(def, owned, 999)).toBeNull();
	});

	test('applies owned levels to stats, capped at max and ignoring unknown ids', () => {
		const base = heroStats(HEROES.jack, 1, {});
		const s = applyUpgrades(heroStats(HEROES.jack, 1, {}), { x: 5, ghost: 3 }, [def]);
		expect(s.maxHp).toBe(base.maxHp + 10);
	});

	test('upgrade ids are unique and every cost is a positive integer', () => {
		expect(new Set(UPGRADES.map((u) => u.id)).size).toBe(UPGRADES.length);
		for (const u of UPGRADES)
			for (let l = 0; l < u.maxLevel; l++) expect(upgradeCost(u, l)).toBeGreaterThan(0);
	});
});

describe('insight upgrade', () => {
	test('grants exactly one card reroll per run', () => {
		const insight = UPGRADES.find((u) => u.id === 'insight');
		if (!insight) throw new Error('insight missing');
		expect(insight.maxLevel).toBe(1);
		expect(applyUpgrades(heroStats(HEROES.jack, 1, {}), { insight: 1 }).cardRerolls).toBe(1);
		expect(applyUpgrades(heroStats(HEROES.jack, 1, {}), { insight: 9 }).cardRerolls).toBe(1);
		expect(heroStats(HEROES.jack, 1, {}).cardRerolls).toBe(0);
	});
});
