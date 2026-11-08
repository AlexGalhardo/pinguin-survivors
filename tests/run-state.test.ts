import { describe, expect, test } from 'bun:test';
import { ECONOMY } from '../src/data/economy';
import { HEROES } from '../src/data/heroes';
import { WEAPON_LINES } from '../src/data/weapons';
import { addWeapon, emptyBuild } from '../src/logic/build';
import { Rng } from '../src/logic/rng';
import { roundDuration } from '../src/logic/round';
import {
	createRunState,
	damageHero,
	endRound,
	finishRun,
	gearCandidates,
	healHero,
	leaveShop,
	potionCandidates,
	purchase,
	queueLevelUps,
	rerollCards,
	resolveLevelUp,
	roundClearFish,
	roundClearPearls,
	type ShopRoll,
	shopPool,
	startRound,
	weaponCandidates,
} from '../src/logic/run-state';
import { defaultSave } from '../src/logic/save';
import { lock, type Offer, rollOffers, type ShopState } from '../src/logic/shop';
import { baseStats } from '../src/logic/stats';

test('run starts with the hero profile and round timer', () => {
	const s = createRunState(HEROES.lucia, { seed: 5, round: 3 });
	expect(s.hp).toBe(HEROES.lucia.hp);
	expect(s.timeLeft).toBe(30);
	startRound(s, 10);
	expect(s.timeLeft).toBe(180);
});

test('damage and healing are clamped', () => {
	const s = createRunState(HEROES.jack, { seed: 1 });
	healHero(s, 50);
	expect(s.hp).toBe(140);
	expect(damageHero(s, 100)).toBe(false);
	expect(damageHero(s, 100)).toBe(true);
	expect(s.hp).toBe(0);
});

describe('shop flow, Fish and Pearls', () => {
	const roll = (hero: 'jack' | 'bob' | 'lucia' = 'jack', seed = 1): ShopRoll => ({
		rng: new Rng(seed),
		pool: weaponCandidates(hero),
		ctx: { hero, buildSets: [], luck: 0 },
	});

	test('Fish and Pearls per round follow RF-06/RF-07', () => {
		expect(roundClearFish(1, 0)).toBe(2);
		expect(roundClearFish(6, 0.5)).toBe(7);
		expect(roundClearFish(10, 0)).toBe(7 + 25);
		expect(roundClearFish(20, 0)).toBe(12 + 50);
		expect(roundClearPearls(1)).toBe(1);
		expect(roundClearPearls(7)).toBe(2);
		expect(roundClearPearls(10)).toBe(3 + 25);
	});

	test('weaponCandidates hides other heroes exclusives', () => {
		const ids = (h: 'jack' | 'bob' | 'lucia') => new Set(weaponCandidates(h).map((c) => c.id));
		const exclusive = WEAPON_LINES.find((w) => w.hero === 'bob');
		expect(exclusive).toBeDefined();
		expect(ids('bob').has(exclusive?.id as string)).toBe(true);
		expect(ids('jack').has(exclusive?.id as string)).toBe(false);
	});

	test('end of round opens the shop with 4 offers; fish starts at the grant', () => {
		const s = createRunState(HEROES.jack, { seed: 1 });
		expect(s.fish).toBe(ECONOMY.fish.start);
		endRound(s, roll());
		expect(s.phase).toBe('shop');
		expect(s.shop?.offers).toHaveLength(4);
		expect(s.fish).toBe(ECONOMY.fish.start + 2);
	});

	test('pending level-ups resolve before the shop opens', () => {
		const s = createRunState(HEROES.jack, { seed: 1 });
		queueLevelUps(s, 2);
		endRound(s, roll());
		expect(s.phase).toBe('cards');
		expect(s.shop).toBeNull();
		resolveLevelUp(s, roll());
		expect(s.phase).toBe('cards');
		resolveLevelUp(s, roll());
		expect(s.phase).toBe('shop');
		expect(s.pendingLevelUps).toBe(0);
	});

	test('locks persist into the next shop and leaveShop starts the next round', () => {
		const s = createRunState(HEROES.jack, { seed: 1 });
		endRound(s, roll());
		const shop = s.shop as ShopState;
		s.shop = lock(shop, 2);
		const kept = shop.offers[2];
		leaveShop(s);
		expect(s.phase).toBe('round');
		expect(s.round).toBe(2);
		expect(s.timeLeft).toBe(roundDuration(2));
		endRound(s, roll('jack', 77));
		expect(s.shop?.offers[2]).toEqual(kept as Offer);
		expect(s.shop?.locks).toEqual([false, false, true, false]);
	});

	test('finishRun pays round Pearls plus fish/10 once', () => {
		const s = createRunState(HEROES.jack, { seed: 1 });
		const save = defaultSave();
		s.pearlsEarned = 7;
		s.fish = 45;
		expect(finishRun(s, save)).toBe(11);
		expect(save.pearls).toBe(11);
		expect(finishRun(s, save)).toBe(0);
		expect(save.pearls).toBe(11);
	});
});

describe('level-up card rerolls', () => {
	test('each Workshop reroll is spent once and redraws 4 cards', () => {
		const s = createRunState(HEROES.jack, { seed: 1, cardRerolls: 1 });
		const ctx = { luck: 0, build: emptyBuild() };
		expect(rerollCards(s, new Rng(1), ctx)).toHaveLength(4);
		expect(s.cardRerollsLeft).toBe(0);
		expect(rerollCards(s, new Rng(1), ctx)).toBeNull();
	});

	test('harvesting multiplies the Fish of a round', () => {
		expect(roundClearFish(4, 0.5)).toBe(Math.floor(4 * 1.5));
	});
});

describe('gear and potion offers (SDD-003 RF-03, RF-09)', () => {
	test('gear candidates carry rarity as tier; potions only from round 5', () => {
		const gear = gearCandidates();
		expect(gear.length).toBeGreaterThan(0);
		expect(new Set(gear.map((g) => g.tier))).toEqual(new Set([1, 2, 3]));
		expect(potionCandidates(4)).toEqual([]);
		expect(potionCandidates(5).map((p) => p.id)).toContain('heal');
	});

	test('mixed pool offers weapons, gear and potions over many seeds', () => {
		const kinds = new Set<string>();
		for (let seed = 0; seed < 200; seed++) {
			const offers = rollOffers(
				new Rng(seed),
				8,
				{ hero: 'jack', buildSets: [], luck: 0 },
				shopPool('jack', 8),
				[],
			);
			expect(new Set(offers.map((o) => o.id)).size).toBe(4);
			for (const o of offers) kinds.add(o.kind);
		}
		expect(kinds).toEqual(new Set(['weapon', 'gear', 'potion']));
		for (let seed = 0; seed < 50; seed++)
			for (const o of rollOffers(
				new Rng(seed),
				2,
				{ hero: 'jack', buildSets: [], luck: 0 },
				shopPool('jack', 2),
				[],
			))
				expect(o.kind).not.toBe('potion');
	});

	test('purchase debits Fish and applies weapon, gear and potion; refuses a full bar', () => {
		const stats = baseStats(HEROES.jack);
		const build = emptyBuild();
		const s = createRunState(HEROES.jack, { seed: 1 });
		s.round = 6;
		s.fish = 1000;
		s.shop = {
			offers: [
				{ kind: 'weapon', id: 'machete', tier: 1, price: 20 },
				{ kind: 'gear', id: 'helmet.wool', tier: 1, price: 24 },
				{ kind: 'potion', id: 'heal', tier: 1, price: 15 },
				{ kind: 'weapon', id: 'hammer', tier: 1, price: 20 },
			],
			locks: [false, false, false, false],
			rerolls: 0,
		};
		expect(purchase(s, 0, { build, stats })?.id).toBe('machete');
		expect(build.weapons).toEqual([{ id: 'machete', tier: 1 }]);
		const hp = stats.maxHp;
		purchase(s, 1, { build, stats });
		expect(s.gear?.equipped.helmet).toBe('helmet.wool');
		expect(stats.maxHp).toBeGreaterThan(hp);
		purchase(s, 2, { build, stats });
		expect(s.shopPotions.heal).toBe(1);
		expect(s.fish).toBe(1000 - 20 - 24 - 15);
		for (let i = 0; i < 5; i++) addWeapon(build, 'knives', 1);
		const before = s.fish;
		expect(purchase(s, 3, { build, stats })).toBeNull();
		expect(s.fish).toBe(before);
		expect(purchase(s, 0, { build, stats })).toBeNull();
	});
});
