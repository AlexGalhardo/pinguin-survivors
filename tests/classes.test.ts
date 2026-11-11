import { describe, expect, test } from 'bun:test';
import { HERO_IDS } from '../src/config/constants';
import { HERO_CLASSES } from '../src/data/classes';
import { HEROES } from '../src/data/heroes';
import {
	baseClass,
	classesOf,
	classLines,
	classUnlocked,
	resolveClass,
} from '../src/logic/classes';
import { getStat, heroStats, type StatKey } from '../src/logic/stats';

const find = (id: string) => {
	const def = HERO_CLASSES.find((c) => c.id === id);
	if (!def) throw new Error(`no class ${id}`);
	return def;
};

describe('hero classes (SDD-024)', () => {
	test('every hero has four classes and the first one changes nothing', () => {
		for (const hero of HERO_IDS) {
			const list = classesOf(hero);
			expect(list).toHaveLength(4);
			expect(list.map((c) => c.unlockLevel)).toEqual([1, 5, 10, 20]);
			const base = baseClass(hero);
			expect(base.add).toEqual({});
			expect(base.mul).toEqual({});
			expect(heroStats(HEROES[hero], 12, [], base)).toEqual(heroStats(HEROES[hero], 12));
		}
		expect(new Set(HERO_CLASSES.map((c) => c.id)).size).toBe(HERO_CLASSES.length);
	});

	test('a class changes exactly the stats it lists, multipliers after additions', () => {
		const plain = heroStats(HEROES.jack, 10);
		const bulwark = heroStats(HEROES.jack, 10, [], find('jack.bulwark'));
		expect(bulwark.maxHp).toBeCloseTo(plain.maxHp * 1.3);
		expect(bulwark.armor).toBeCloseTo(plain.armor + 8);
		expect(bulwark.damage).toBeCloseTo(plain.damage - 0.15);
		expect(bulwark.moveSpeed).toBe(plain.moveSpeed - 8);
		expect(bulwark.crit).toBe(plain.crit);
		// Berserker: the armor multiplier of 0 wins over whatever the level added.
		const berserker = heroStats(HEROES.jack, 30, [], find('jack.berserker'));
		expect(berserker.armor).toBe(0);
		expect(berserker.maxHp).toBeCloseTo(heroStats(HEROES.jack, 30).maxHp * 0.85);
		const glass = heroStats(HEROES.lucia, 20, [], find('lucia.glassCannon'));
		expect(glass.regen).toBe(0);
		expect(glass.tagMul.magic).toBeCloseTo(heroStats(HEROES.lucia, 20).tagMul.magic + 0.35);
	});

	test('every class other than the base has a gain and a cost', () => {
		for (const def of HERO_CLASSES.filter((c) => c.unlockLevel > 1)) {
			const lines = classLines(def);
			expect(lines.some((l) => l.good)).toBe(true);
			expect(lines.some((l) => !l.good)).toBe(true);
			// Gains are listed first.
			expect(lines[0]?.good).toBe(true);
			// Every stat named exists on the hero stats.
			for (const l of lines)
				expect(typeof getStat(heroStats(HEROES[def.hero], 1), l.stat as StatKey)).toBe(
					'number',
				);
		}
	});

	test('a locked class or a class of another hero falls back to the base class', () => {
		expect(classUnlocked(find('bob.pyro'), 4)).toBe(false);
		expect(classUnlocked(find('bob.pyro'), 5)).toBe(true);
		expect(resolveClass('bob', 4, 'bob.pyro').id).toBe('bob.gunner');
		expect(resolveClass('bob', 5, 'bob.pyro').id).toBe('bob.pyro');
		expect(resolveClass('bob', 50, 'jack.berserker').id).toBe('bob.gunner');
		expect(resolveClass('lucia', 50, undefined).id).toBe('lucia.arcanist');
		expect(resolveClass('lucia', 50, 'nope').id).toBe('lucia.arcanist');
	});
});
