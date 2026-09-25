import { describe, expect, it } from 'bun:test';
import { ACHIEVEMENTS } from '../src/data/achievements';
import { META_UPGRADES } from '../src/data/meta';
import { checkAchievements } from '../src/logic/achievements';
import {
	buyUpgrade,
	coresForRun,
	metaBonus,
	nextCost,
	upgradeLevel,
} from '../src/logic/meta-upgrades';
import { defaultSave, parseSave, serializeSave } from '../src/logic/save';

describe('meta upgrades', () => {
	it('earns cores from wave, kills and bosses', () => {
		expect(coresForRun({ wave: 10, kills: 260, bossKills: 1 })).toBe(20 + 5 + 10);
		expect(coresForRun({ wave: 1, kills: 0, bossKills: 0 })).toBe(2);
	});

	it('buys levels with increasing costs until maxed', () => {
		const s = defaultSave();
		s.meta.cores = 1000;
		expect(nextCost(s, 'plating')).toBe(40);
		for (let i = 0; i < 3; i++) expect(buyUpgrade(s, 'plating')).toBe(true);
		expect(nextCost(s, 'plating')).toBeNull();
		expect(buyUpgrade(s, 'plating')).toBe(false);
		expect(s.meta.cores).toBe(1000 - 40 - 90 - 160);
	});

	it('refuses when poor and survives a save round-trip', () => {
		const s = defaultSave();
		s.meta.cores = 10;
		expect(buyUpgrade(s, 'vitality')).toBe(false);
		s.meta.cores = 20;
		expect(buyUpgrade(s, 'vitality')).toBe(true);
		expect(upgradeLevel(parseSave(serializeSave(s)), 'vitality')).toBe(1);
	});

	it('turns levels into run bonuses', () => {
		const s = defaultSave();
		s.meta.upgrades = { vitality: 2, funding: 3, second_wind: 1 };
		const b = metaBonus(s);
		expect(b.mods.maxHp).toBe(6);
		expect(b.startGold).toBe(30);
		expect(b.startRevive).toBe(true);
		expect(META_UPGRADES.every((u) => u.costs.length > 0)).toBe(true);
	});
});

describe('achievements', () => {
	const run = {
		character: 'warrior' as const,
		wave: 21,
		kills: 600,
		goldEarned: 400,
		bossKills: 2,
		evolved: 0,
		abilities: 6,
	};

	it('unlocks what the run earned, only once', () => {
		const s = defaultSave();
		const first = checkAchievements(s, run);
		expect(first).toContain('survivor');
		expect(first).toContain('veteran');
		expect(first).not.toContain('legend');
		expect(first).toContain('full_kit');
		expect(checkAchievements(s, run)).toEqual([]);
	});

	it('all-rounder needs a run with every class', () => {
		const s = defaultSave();
		s.history = (['warrior', 'ranger', 'mage'] as const).map((c) => ({
			character: c,
			wave: 1,
			kills: 0,
			timeSec: 0,
			at: 0,
		}));
		expect(checkAchievements(s, run)).toContain('all_rounder');
		expect(ACHIEVEMENTS).toHaveLength(10);
	});
});
