import { describe, expect, test } from 'bun:test';
import { HEROES } from '../src/data/heroes';
import { heroTree, pathTo } from '../src/logic/skill-tree';
import { addStat, baseStats, getStat, heroStats } from '../src/logic/stats';

describe('stats', () => {
	test('base stats copy the hero profile without sharing references', () => {
		const a = baseStats(HEROES.jack);
		a.resist.fire = 1;
		expect(HEROES.jack.resist.fire).toBe(0);
		expect(a.tagMul.melee).toBe(1.3);
	});

	test('flat and nested keys', () => {
		const s = baseStats(HEROES.bob);
		addStat(s, 'crit', 0.05);
		addStat(s, 'resist.ice', 0.1);
		addStat(s, 'tagMul.firearm', 0.2);
		expect(getStat(s, 'crit')).toBeCloseTo(0.17);
		expect(getStat(s, 'resist.ice')).toBeCloseTo(0.15);
		expect(getStat(s, 'tagMul.firearm')).toBeCloseTo(1.5);
	});

	test('level growth and allocated tree nodes', () => {
		const plain = heroStats(HEROES.lucia, 11, []);
		expect(plain.maxHp).toBeCloseTo(HEROES.lucia.hp + 1.5 * 10);
		expect(plain.tagMul.magic).toBeCloseTo(HEROES.lucia.tagMul.magic + 0.06);
		const tree = heroTree('lucia');
		const path = pathTo(tree, [], 'lucia.ice.n0');
		const withTree = heroStats(HEROES.lucia, 11, path);
		expect(withTree.chillChance).toBeGreaterThan(plain.chillChance);
		expect(heroStats(HEROES.jack, 1, []).armor).toBe(HEROES.jack.armor);
	});
});
