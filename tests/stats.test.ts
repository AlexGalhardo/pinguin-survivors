import { describe, expect, test } from 'bun:test';
import { HEROES } from '../src/data/heroes';
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

	test('level growth and spent points', () => {
		const lucia = heroStats(HEROES.lucia, 11, { crit: 4, maxHp: 2, bogus: 9 });
		expect(lucia.maxHp).toBeCloseTo(70 + 1.5 * 10 + 10);
		expect(lucia.tagMul.magic).toBeCloseTo(1.5 + 0.06);
		expect(lucia.crit).toBeCloseTo(0.05 + 0.02);
		expect(heroStats(HEROES.jack, 1, {}).armor).toBe(12);
	});
});
