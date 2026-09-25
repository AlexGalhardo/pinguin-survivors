import { describe, expect, it } from 'bun:test';
import { ABILITY_IDS, EVOLUTION_ITEM } from '../src/data/abilities';
import { getItem, ITEMS } from '../src/data/items';
import {
	applyEvolutions,
	buildStats,
	pendingEvolutions,
	synergyMods,
	synergyTiers,
	tagCounts,
} from '../src/logic/build';
import { Rng } from '../src/logic/rng';
import { createRunState } from '../src/logic/run-state';
import { generateShop, lockedIds, sellItem, sellValue } from '../src/logic/shop';

describe('items (beta)', () => {
	it('has 40 items with unique ids and at least one tag each', () => {
		expect(ITEMS).toHaveLength(40);
		expect(new Set(ITEMS.map((i) => i.id)).size).toBe(40);
		for (const i of ITEMS) expect(i.tags.length).toBeGreaterThan(0);
	});

	it('every ability has an existing evolution item', () => {
		expect(ABILITY_IDS).toHaveLength(10);
		for (const id of ABILITY_IDS) expect(getItem(EVOLUTION_ITEM[id])).toBeDefined();
	});
});

describe('synergies', () => {
	it('counts tags from abilities and item copies', () => {
		const s = createRunState('mage', 1);
		s.abilities = [
			{ id: 'chain_lightning', level: 1 },
			{ id: 'laser_beam', level: 1 },
		];
		s.items = ['tesla_coil', 'tesla_coil', 'gravity_magnet'];
		const c = tagCounts(s);
		expect(c.energy).toBe(4);
		expect(c.tech).toBe(1);
		expect(synergyTiers(c).energy).toBe(2);
	});

	it('applies the highest reached tier to the stats', () => {
		const counts = { energy: 2, kinetic: 0, cryo: 0, psi: 0, bio: 0, tech: 0 };
		expect(synergyMods(counts)).toEqual({ damage: 0.1 });
		const s = createRunState('warrior', 1);
		s.abilities = [
			{ id: 'chain_lightning', level: 1 },
			{ id: 'plasma_nova', level: 1 },
		];
		expect(buildStats(s).damage).toBeCloseTo(0.1);
	});
});

describe('evolutions', () => {
	it('needs level 5 and the evolution item', () => {
		const s = createRunState('ranger', 1);
		s.abilities = [{ id: 'saw_disc', level: 4 }];
		s.items = ['diamond_edge'];
		expect(pendingEvolutions(s)).toEqual([]);
		s.abilities[0] = { id: 'saw_disc', level: 5 };
		expect(applyEvolutions(s)).toEqual(['saw_disc']);
		expect(s.abilities[0]?.evolved).toBe(true);
		expect(applyEvolutions(s)).toEqual([]);
	});
});

describe('shop lock and sell', () => {
	it('keeps locked items in the next roll', () => {
		const rng = new Rng(5);
		const first = generateShop(rng, 3, 0);
		const offer = first[1];
		if (!offer) throw new Error('no offer');
		offer.locked = true;
		const next = generateShop(rng, 4, 0, 4, lockedIds(first));
		expect(next[0]?.itemId).toBe(offer.itemId);
		expect(next[0]?.locked).toBe(true);
		expect(new Set(next.map((o) => o.itemId)).size).toBe(4);
	});

	it('sells one copy for half of the current price', () => {
		const s = createRunState('warrior', 1, 11);
		s.items = ['gravity_magnet', 'gravity_magnet'];
		expect(sellValue('gravity_magnet', 11)).toBe(10);
		expect(sellItem(s, 'gravity_magnet')).toBe(10);
		expect(s.items).toEqual(['gravity_magnet']);
		expect(s.gold).toBe(10);
		expect(sellItem(s, 'nope')).toBe(0);
	});
});
