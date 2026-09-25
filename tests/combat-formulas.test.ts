import { describe, expect, it } from 'bun:test';
import {
	abilityDamage,
	armorReduction,
	computeStats,
	damageTaken,
	dodgeChance,
	LifestealLimiter,
	RegenAccumulator,
	rangeMul,
	weaponCooldown,
	weaponDamage,
} from '../src/logic/stats';

describe('combat formulas (balancing §4)', () => {
	it('weapon damage applies Damage% and crits', () => {
		const s = computeStats({ damage: 0.5, critDamage: 0.5 });
		expect(weaponDamage(10, s, false)).toBeCloseTo(15);
		expect(weaponDamage(10, s, true)).toBeCloseTo(30);
	});

	it('ability damage applies Damage% and Ability Power%', () => {
		expect(abilityDamage(10, computeStats({ damage: 0.1, abilityPower: 0.5 }))).toBeCloseTo(
			16.5,
		);
	});

	it('cooldown shrinks with Attack Speed and is floored at -50%', () => {
		expect(weaponCooldown(1, computeStats({ attackSpeed: 1 }))).toBeCloseTo(0.5);
		expect(weaponCooldown(1, computeStats({ attackSpeed: -0.9 }))).toBeCloseTo(2);
	});

	it('armor has diminishing returns and negative armor increases damage', () => {
		expect(armorReduction(0)).toBe(0);
		expect(armorReduction(15)).toBeCloseTo(0.5);
		expect(armorReduction(-15)).toBeCloseTo(-0.5);
		expect(damageTaken(10, 15)).toBe(5);
		expect(damageTaken(10, -15)).toBe(15);
		expect(damageTaken(1, 100)).toBe(1);
	});

	it('dodge is capped at 60%', () => {
		expect(dodgeChance(computeStats({ dodge: 0.9 }))).toBe(0.6);
		expect(dodgeChance(computeStats({ dodge: 0.1 }))).toBeCloseTo(0.1);
	});

	it('range multiplier has a floor', () => {
		expect(rangeMul(computeStats({ range: 0.2 }))).toBeCloseTo(1.2);
		expect(rangeMul(computeStats({ range: -5 }))).toBeCloseTo(0.2);
	});

	it('regen accumulates fractions', () => {
		const r = new RegenAccumulator();
		let healed = 0;
		for (let i = 0; i < 100; i++) healed += r.tick(0.3, 0.1);
		expect(healed).toBe(3);
		expect(r.tick(0, 1)).toBe(0);
	});

	it('lifesteal is a chance per hit limited to 10 per second', () => {
		const l = new LifestealLimiter();
		let healed = 0;
		for (let i = 0; i < 50; i++) healed += l.onHit(0.5, 0.1, 0.5);
		expect(healed).toBe(10);
		expect(l.onHit(0.5, 0.9, 2)).toBe(0);
		expect(l.onHit(0.5, 0.1, 2)).toBe(1);
	});
});
