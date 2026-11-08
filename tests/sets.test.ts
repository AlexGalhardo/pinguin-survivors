import { describe, expect, test } from 'bun:test';
import { HEROES } from '../src/data/heroes';
import { SET_BONUSES } from '../src/data/sets';
import { addWeapon, emptyBuild, setBonuses, setCounts } from '../src/logic/build';
import { applyModifiers, baseStats } from '../src/logic/stats';

const bladeBuild = (n: number): ReturnType<typeof emptyBuild> => {
	const b = emptyBuild();
	for (let i = 0; i < n; i++) addWeapon(b, 'machete');
	return b;
};

describe('set bonuses (SDD-002 A2)', () => {
	test('1 blade gives nothing; 2/4/6 give the three steps', () => {
		expect(setBonuses(bladeBuild(1))).toEqual([]);
		expect(setBonuses(bladeBuild(2))).toEqual(SET_BONUSES.blade[0]);
		expect(setBonuses(bladeBuild(4))).toEqual(SET_BONUSES.blade[1]);
		expect(setBonuses(bladeBuild(6))).toEqual(SET_BONUSES.blade[2]);
		expect(setBonuses(bladeBuild(3))).toEqual(SET_BONUSES.blade[0]);
	});

	test('a two-set weapon counts for both sets', () => {
		const b = emptyBuild();
		addWeapon(b, 'knives');
		addWeapon(b, 'machete');
		addWeapon(b, 'fishBoomerang');
		expect(setCounts(b)).toEqual({ blade: 2, thrown: 2 });
		expect(setBonuses(b)).toEqual([...SET_BONUSES.blade[0], ...SET_BONUSES.thrown[0]]);
	});

	test('applyModifiers adds the bonus to PlayerStats', () => {
		const s = baseStats(HEROES.jack);
		applyModifiers(s, setBonuses(bladeBuild(6)));
		expect(s.bleedChance).toBeCloseTo(0.25);
	});
});
