import { describe, expect, test } from 'bun:test';
import { HEROES } from '../src/data/heroes';
import { WEAPON_LINES, WEAPON_TIERS } from '../src/data/weapons';
import { setBonuses } from '../src/logic/build';
import { baseStats, replaceModifiers } from '../src/logic/stats';
import {
	DIRECT_BEHAVIORS,
	isDirect,
	leadWeapon,
	resolveWeapon,
	ringAngle,
} from '../src/logic/weapons';

describe('resolveWeapon', () => {
	test('flattens every line and tier with the tier numbers', () => {
		for (const def of WEAPON_LINES) {
			for (const tier of WEAPON_TIERS) {
				const w = resolveWeapon({ id: def.id as never, tier });
				const t = def.tiers[tier - 1];
				expect(w.damage).toBe(t?.damage as number);
				expect(w.cooldown).toBe(t?.cooldown as number);
				expect(w.tag).toBe(def.classTag);
				expect(w.count).toBeGreaterThanOrEqual(1);
			}
		}
	});

	test('is cached per (id, tier) so frame loops do not allocate', () => {
		expect(resolveWeapon({ id: 'machete', tier: 2 })).toBe(
			resolveWeapon({ id: 'machete', tier: 2 }),
		);
	});

	test('direct weapons are the swing and projectile ones', () => {
		expect(DIRECT_BEHAVIORS).toEqual(['arc', 'spread', 'bolt']);
		expect(isDirect(resolveWeapon({ id: 'machete', tier: 1 }))).toBe(true);
		expect(isDirect(resolveWeapon({ id: 'iceShards', tier: 1 }))).toBe(false);
	});
});

describe('leadWeapon', () => {
	test('picks the highest single-activation damage and is null for an empty build', () => {
		expect(leadWeapon([])).toBeNull();
		const lead = leadWeapon([
			{ id: 'auxPistol', tier: 1 },
			{ id: 'doubleBarrel', tier: 1 },
		]);
		expect(lead?.id).toBe('doubleBarrel');
	});
});

describe('ringAngle', () => {
	test('slots are evenly spaced and the whole ring rotates with time', () => {
		expect(ringAngle(1, 4, 0, 0.6) - ringAngle(0, 4, 0, 0.6)).toBeCloseTo(Math.PI / 2);
		expect(ringAngle(0, 6, 2, 0.6)).toBeCloseTo(1.2);
	});
});

describe('replaceModifiers (set bonuses on build change)', () => {
	test('swapping the set bonuses leaves no residue', () => {
		const stats = baseStats(HEROES.jack);
		const base = stats.bleedChance;
		const two = setBonuses({
			tier: 1,
			secondaries: {},
			perks: {},
			cards: [],
			weapons: [
				{ id: 'machete', tier: 1 },
				{ id: 'knives', tier: 1 },
			],
		});
		replaceModifiers(stats, [], two);
		expect(stats.bleedChance).toBeGreaterThan(base);
		replaceModifiers(stats, two, []);
		expect(stats.bleedChance).toBeCloseTo(base);
	});
});
