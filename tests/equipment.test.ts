import { describe, expect, test } from 'bun:test';
import { DROPS, GEAR, GEAR_RARITIES, GEAR_SLOTS } from '../src/data/equipment';
import { HEROES } from '../src/data/heroes';
import { emptyGear, pickUpGear, rollGearDrop, rollHealDrop } from '../src/logic/equipment';
import { Rng } from '../src/logic/rng';
import { heroStats } from '../src/logic/stats';

describe('equipment data', () => {
	test('10 items per slot: 3 common, 4 rare, 3 legendary; unique ids', () => {
		expect(new Set(GEAR.map((g) => g.id)).size).toBe(GEAR.length);
		for (const slot of GEAR_SLOTS) {
			const own = GEAR.filter((g) => g.slot === slot);
			expect(own.length).toBe(10);
			const count = (r: string) => own.filter((g) => g.rarity === r).length;
			expect([count('common'), count('rare'), count('legendary')]).toEqual([3, 4, 3]);
		}
		expect(GEAR_RARITIES.length).toBe(3);
	});
});

describe('drops', () => {
	test('commons drop commons, elites rares, bosses legendaries (bosses always)', () => {
		const rng = new Rng(4);
		for (let i = 0; i < 50; i++) expect(rollGearDrop(rng, 'boss')?.rarity).toBe('legendary');
		const seen = new Set<string>();
		for (let i = 0; i < 4000; i++) {
			const e = rollGearDrop(rng, 'elite');
			if (e) seen.add(e.rarity);
			const c = rollGearDrop(rng, 'common');
			if (c) expect(c.rarity).toBe('common');
		}
		expect([...seen]).toEqual(['rare']);
	});

	test('heal packs: 25/50/75% with 50/30/20 odds', () => {
		const rng = new Rng(9);
		const counts: Record<number, number> = {};
		const n = 20000;
		for (let i = 0; i < n; i++) {
			const h = rollHealDrop(rng, 'boss');
			counts[h] = (counts[h] ?? 0) + 1;
		}
		expect((counts[0.25] ?? 0) / n).toBeCloseTo(0.5, 1);
		expect((counts[0.5] ?? 0) / n).toBeCloseTo(0.3, 1);
		expect((counts[0.75] ?? 0) / n).toBeCloseTo(0.2, 1);
		expect(DROPS.heal.bossChance).toBe(1);
	});
});

describe('wearing equipment (no bag)', () => {
	test('equips at once; the old item of the slot leaves and is reported for sale', () => {
		const base = heroStats(HEROES.jack, 1, []);
		const stats = heroStats(HEROES.jack, 1, []);
		const gear = emptyGear();
		expect(pickUpGear(gear, stats, 'armor.kevlar')).toEqual({ result: 'equipped', sold: null });
		expect(stats.armor).toBeCloseTo(base.armor + 4);
		expect(pickUpGear(gear, stats, 'armor.juggernaut')).toEqual({
			result: 'equipped',
			sold: { id: 'armor.kevlar', rarity: 2 },
		});
		expect(gear.equipped.armor).toBe('armor.juggernaut');
		expect(stats.armor).toBeCloseTo(base.armor + 7);
		expect(stats.maxHp).toBeCloseTo(base.maxHp + 30);
		expect(gear).not.toHaveProperty('bag');
	});

	test('a ground drop never replaces a worn item of higher rarity: the drop is sold instead', () => {
		const stats = heroStats(HEROES.jack, 1, []);
		const gear = emptyGear();
		pickUpGear(gear, stats, 'helmet.crown', {
			rarity: 5,
			affixes: [{ stat: 'armor', value: 2 }],
		});
		const armor = stats.armor;
		expect(pickUpGear(gear, stats, 'helmet.wool', undefined, { keepBetter: true })).toEqual({
			result: 'rejected',
			sold: { id: 'helmet.wool', rarity: 1 },
		});
		expect(gear.equipped.helmet).toBe('helmet.crown');
		expect(stats.armor).toBe(armor);
		// Equal or better rarity does replace, and the old roll goes away with the old item.
		const better = pickUpGear(
			gear,
			stats,
			'helmet.pot',
			{ rarity: 5, affixes: [] },
			{ keepBetter: true },
		);
		expect(better).toEqual({ result: 'equipped', sold: { id: 'helmet.crown', rarity: 5 } });
		expect(gear.rolls?.['helmet.crown']).toBeUndefined();
		expect(stats.armor).toBeLessThan(armor);
	});

	test('unknown ids are rejected without a sale', () => {
		const gear = emptyGear();
		expect(pickUpGear(gear, heroStats(HEROES.jack, 1, []), 'ring.nope')).toEqual({
			result: 'rejected',
			sold: null,
		});
	});
});
