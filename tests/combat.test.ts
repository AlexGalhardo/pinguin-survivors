import { describe, expect, test } from 'bun:test';
import {
	armorReduction,
	resistMultiplier,
	resolveIncoming,
	rollOutgoing,
} from '../src/logic/combat';

describe('mitigation', () => {
	test('armor curve and cap', () => {
		expect(armorReduction(0)).toBe(0);
		expect(armorReduction(100)).toBeCloseTo(0.5);
		expect(armorReduction(10_000)).toBe(0.8);
	});

	test('resistances are capped and negative amplifies', () => {
		expect(resistMultiplier(0.25)).toBeCloseTo(0.75);
		expect(resistMultiplier(2)).toBeCloseTo(0.25);
		expect(resistMultiplier(-0.5)).toBeCloseTo(1.5);
	});
});

describe('rollOutgoing', () => {
	const attack = {
		base: 10,
		tag: 'melee' as const,
		multiplier: 1.3,
		critChance: 0.1,
		critDamage: 1.5,
	};
	test('crit only under the chance', () => {
		expect(rollOutgoing(attack, { crit: 0.05 })).toEqual({ amount: 19.5, crit: true });
		expect(rollOutgoing(attack, { crit: 0.5 })).toEqual({ amount: 13, crit: false });
	});
});

describe('resolveIncoming', () => {
	const jack = { armor: 12, dodge: 0.03, parry: 0.15, resist: { earth: 0.1 } };
	test('dodge beats everything', () => {
		expect(resolveIncoming(10, jack, { contact: true }, { dodge: 0.01, parry: 0 })).toEqual({
			kind: 'dodged',
		});
	});

	test('parry only on contact, reflects half', () => {
		expect(resolveIncoming(10, jack, { contact: true }, { dodge: 0.9, parry: 0.1 })).toEqual({
			kind: 'parried',
			reflected: 5,
		});
		expect(resolveIncoming(10, jack, { contact: false }, { dodge: 0.9, parry: 0.1 }).kind).toBe(
			'hit',
		);
	});

	test('armor for physical, resist for elemental', () => {
		const phys = resolveIncoming(100, jack, { contact: false }, { dodge: 0.9, parry: 0.9 });
		expect(phys.kind === 'hit' && phys.amount).toBeCloseTo(100 * (1 - 12 / 112));
		const earth = resolveIncoming(
			100,
			jack,
			{ contact: false, element: 'earth' },
			{ dodge: 0.9, parry: 0.9 },
		);
		expect(earth.kind === 'hit' && earth.amount).toBeCloseTo(90);
	});

	test('dodge and parry caps', () => {
		const god = { armor: 0, dodge: 5, parry: 5 };
		expect(resolveIncoming(10, god, { contact: true }, { dodge: 0.7, parry: 0.3 }).kind).toBe(
			'parried',
		);
		expect(resolveIncoming(10, god, { contact: true }, { dodge: 0.7, parry: 0.5 }).kind).toBe(
			'hit',
		);
	});
});
