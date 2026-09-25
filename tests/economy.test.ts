import { describe, expect, it } from 'bun:test';
import { getItem, ITEMS, itemMods } from '../src/data/items';
import { itemPrice, medkitChance, shopRerollCost, spend } from '../src/logic/economy';
import { Rng } from '../src/logic/rng';
import { createRunState, runStats } from '../src/logic/run-state';
import { buyOffer, generateShop } from '../src/logic/shop';
import { finalMaxHp } from '../src/logic/stats';

describe('economy (balancing §7, §9)', () => {
	it('prices grow 10% per wave', () => {
		expect(itemPrice(30, 1)).toBe(30);
		expect(itemPrice(30, 11)).toBe(60);
		expect(itemPrice(15, 4)).toBe(20);
	});

	it('shop re-roll costs 1 + N and grows per re-roll', () => {
		expect(shopRerollCost(1, 0)).toBe(2);
		expect(shopRerollCost(6, 3)).toBe(10);
	});

	it('medkit chance scales with luck', () => {
		expect(medkitChance(0)).toBeCloseTo(0.005);
		expect(medkitChance(100)).toBeCloseTo(0.01);
		expect(medkitChance(-500)).toBe(0);
	});

	it('spend only when affordable', () => {
		expect(spend(10, 4)).toBe(6);
		expect(spend(3, 4)).toBeNull();
	});
});

describe('items', () => {
	it('keeps the 12 alpha items', () => {
		for (const id of ['nano_plating', 'overclocked_core', 'singularity_shard']) {
			expect(ITEMS.some((i) => i.id === id)).toBe(true);
		}
	});

	it('applies trade-offs through runStats', () => {
		const s = createRunState('warrior', 1);
		s.items = ['overclocked_core', 'glass_cannon_lens'];
		const stats = runStats(s, itemMods);
		expect(stats.attackSpeed).toBeCloseTo(0.25);
		expect(stats.damage).toBeCloseTo(0.4);
		expect(finalMaxHp(stats)).toBe(Math.round(30 * (1 - 0.35)));
		expect(getItem('singularity_shard')?.rarity).toBe('legendary');
	});
});

describe('shop', () => {
	it('offers 4 distinct items priced for the wave', () => {
		const rng = new Rng(12);
		for (let w = 1; w <= 30; w++) {
			const shop = generateShop(rng, w, 0);
			expect(shop).toHaveLength(4);
			expect(new Set(shop.map((o) => o.itemId)).size).toBe(4);
			for (const o of shop) {
				const item = getItem(o.itemId);
				expect(item).toBeDefined();
				expect(o.price).toBe(itemPrice(item?.basePrice ?? 0, w));
			}
		}
	});

	it('never offers legendary items before wave 5', () => {
		const rng = new Rng(3);
		for (let i = 0; i < 500; i++) {
			for (const o of generateShop(rng, 4, 300)) {
				expect(getItem(o.itemId)?.rarity).not.toBe('legendary');
			}
		}
	});

	it('buys an offer once and only with enough gold', () => {
		const s = createRunState('ranger', 1);
		const offer = { itemId: 'gravity_magnet', price: 10, sold: false };
		s.gold = 5;
		expect(buyOffer(s, offer)).toBe(false);
		s.gold = 25;
		expect(buyOffer(s, offer)).toBe(true);
		expect(s.gold).toBe(15);
		expect(s.items).toEqual(['gravity_magnet']);
		expect(buyOffer(s, offer)).toBe(false);
	});
});
