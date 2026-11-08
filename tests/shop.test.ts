import { describe, expect, test } from 'bun:test';
import { SHOP } from '../src/data/economy';
import { Rng } from '../src/logic/rng';
import {
	buy,
	lock,
	offerPrice,
	reroll,
	rerollPrice,
	rollOffers,
	type ShopCandidate,
	type ShopState,
	sellValue,
} from '../src/logic/shop';

const SETS = ['blade', 'gun', 'blunt', 'support'];
const POOL: ShopCandidate[] = [
	...Array.from(
		{ length: 24 },
		(_, i): ShopCandidate => ({
			kind: i % 4 === 3 ? 'item' : 'weapon',
			id: `w${i}`,
			tier: (i % 4) + 1,
			sets: [SETS[i % SETS.length] as string],
		}),
	),
	{ kind: 'weapon', id: 'jackOnly', tier: 1, sets: ['blade'], hero: 'jack' },
	{ kind: 'weapon', id: 'bobOnly', tier: 1, sets: ['gun'], hero: 'bob' },
	{ kind: 'gear', id: 'ring', tier: 2, sets: [] },
];
const ctx = (hero = 'jack', luck = 0) => ({ hero, buildSets: ['blade'], luck });

describe('rerollPrice / prices', () => {
	test('A2: rerollPrice examples', () => {
		expect(rerollPrice(1, 0)).toBe(4);
		expect(rerollPrice(1, 1)).toBe(5);
		expect(rerollPrice(10, 2)).toBe(19);
	});

	test('weapon, item and gear prices follow SDD-003 RF-03', () => {
		expect(offerPrice('weapon', 1, 0)).toBe(8);
		expect(offerPrice('weapon', 4, 10)).toBe(110);
		expect(offerPrice('item', 2, 5)).toBe(26);
		expect(offerPrice('gear', 3, 10)).toBe(90);
		expect(offerPrice('gear', 4, 1)).toBe(142);
		expect(offerPrice('weapon', 5, 0)).toBe(160);
		expect(() => offerPrice('gear', 6, 1)).toThrow();
	});

	test('selling returns 50%', () => {
		expect(sellValue(45)).toBe(22);
		expect(SHOP.sellRatio).toBe(0.5);
	});
});

describe('rollOffers', () => {
	test('A1: 1000 seeds → 4 distinct offers, locks kept, no other hero exclusives', () => {
		for (let seed = 0; seed < 1000; seed++) {
			const rng = new Rng(seed);
			const hero = ['jack', 'bob', 'lucia'][seed % 3] as string;
			const round = 1 + (seed % 30);
			const first = rollOffers(rng, round, ctx(hero, seed % 20), POOL, []);
			const locks = [seed % 2 === 0, false, seed % 3 === 0, true];
			const second = rollOffers(rng, round + 1, ctx(hero), POOL, locks, first);
			for (const offers of [first, second]) {
				expect(offers).toHaveLength(4);
				expect(new Set(offers.map((o) => o.id)).size).toBe(4);
				for (const o of offers) {
					if (o.id === 'jackOnly') expect(hero).toBe('jack');
					if (o.id === 'bobOnly') expect(hero).toBe('bob');
				}
			}
			locks.forEach((l, i) => {
				if (l) expect(second[i]).toEqual(first[i] as NonNullable<(typeof first)[number]>);
			});
		}
	});

	test('same seed → same offers; higher rounds shift toward higher tiers', () => {
		expect(rollOffers(new Rng(5), 3, ctx(), POOL, [])).toEqual(
			rollOffers(new Rng(5), 3, ctx(), POOL, []),
		);
		const avgTier = (round: number) => {
			let sum = 0;
			for (let s = 0; s < 300; s++)
				for (const o of rollOffers(new Rng(s), round, ctx(), POOL, [])) sum += o.tier;
			return sum / 1200;
		};
		expect(avgTier(30)).toBeGreaterThan(avgTier(1));
	});

	test('throws when the pool cannot fill the slots', () => {
		expect(() => rollOffers(new Rng(1), 1, ctx(), POOL.slice(0, 3), [])).toThrow();
	});
});

describe('buy / lock / reroll', () => {
	const open = (): ShopState => ({
		offers: rollOffers(new Rng(9), 4, ctx(), POOL, []),
		locks: [false, false, false, false],
		rerolls: 0,
	});

	test('buy debits Fish, clears the slot; refuses when broke or empty', () => {
		const s = open();
		const price = s.offers[0]?.price ?? 0;
		expect(buy(s, price - 1, 0)).toBeNull();
		const r = buy(s, price + 5, 0);
		expect(r?.fish).toBe(5);
		expect(r?.state.offers[0]).toBeNull();
		expect(buy(r?.state as ShopState, 999, 0)).toBeNull();
	});

	test('lock toggles; locked offers survive reroll; reroll refused when broke', () => {
		let s = lock(open(), 1);
		expect(s.locks[1]).toBe(true);
		const kept = s.offers[1];
		const r = reroll(s, 100, new Rng(2), 4, ctx(), POOL);
		expect(r?.state.offers[1]).toEqual(kept as NonNullable<typeof kept>);
		expect(r?.state.rerolls).toBe(1);
		expect(r?.fish).toBe(100 - rerollPrice(4, 0));
		s = lock(s, 1);
		expect(s.locks[1]).toBe(false);
		expect(reroll(s, 1, new Rng(2), 4, ctx(), POOL)).toBeNull();
	});

	test('reroll price grows with each use', () => {
		let s = open();
		let fish = 1000;
		const spent: number[] = [];
		for (let i = 0; i < 3; i++) {
			const r = reroll(s, fish, new Rng(i), 4, ctx(), POOL);
			spent.push(fish - (r?.fish ?? 0));
			s = r?.state as ShopState;
			fish = r?.fish ?? 0;
		}
		expect(spent).toEqual([7, 8, 9]);
	});
});
