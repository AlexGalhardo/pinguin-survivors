import { describe, expect, test } from 'bun:test';
import { HEROES } from '../src/data/heroes';
import { addWeapon, emptyBuild, fuse } from '../src/logic/build';
import { emptyHealPotion } from '../src/logic/heal-potion';
import { Rng } from '../src/logic/rng';
import { createRunState, type ShopRoll, weaponCandidates } from '../src/logic/run-state';
import {
	buy,
	lock,
	type Offer,
	offerPrice,
	reroll,
	rollOffers,
	type ShopState,
	sellValue,
} from '../src/logic/shop';
import {
	extraBuy,
	fuseAll,
	makeTaste,
	nextShopAction,
	offerValue,
	playShop,
	SHOP_POLICY,
	type ShopView,
	softmaxPick,
} from '../src/logic/sim/shop-policy';
import { heroStats } from '../src/logic/stats';

const stats = heroStats(HEROES.jack, 1, []);
const roll = (seed = 1): ShopRoll => ({
	rng: new Rng(seed),
	pool: weaponCandidates('jack'),
	ctx: { hero: 'jack', buildSets: [], luck: 0 },
});
const offer = (id: string, tier: number, price: number): Offer => ({
	kind: 'weapon',
	id,
	tier,
	price,
});
const open = (offers: Offer[]): ShopState => ({
	offers,
	locks: offers.map(() => false),
	rerolls: 0,
});

describe('shop policy', () => {
	test('fuseAll merges equal pairs up the tiers', () => {
		const b = emptyBuild();
		for (let i = 0; i < 4; i++) addWeapon(b, 'machete', 1);
		expect(fuseAll(b)).toBe(3);
		expect(b.weapons).toEqual([{ id: 'machete', tier: 3 }]);
	});

	test('buys a copy and fuses it with the owned weapon', () => {
		const build = emptyBuild();
		addWeapon(build, 'machete', 1);
		const run = createRunState(HEROES.jack, { seed: 1 });
		run.fish = 50;
		run.shop = open([
			offer('machete', 1, 10),
			offer('hammer', 1, 100),
			offer('knives', 1, 100),
			offer('auxPistol', 1, 100),
		]);
		const play = playShop({ run, build, stats, roll: roll() });
		expect(play.bought.map((o) => o.id)).toContain('machete');
		expect(build.weapons.find((w) => w.id === 'machete')?.tier).toBe(2);
		expect(run.fish).toBeLessThan(50);
		expect(play.spent).toBeGreaterThanOrEqual(10);
	});

	test('never spends more Fish than it has and keeps the slots at 6 or fewer', () => {
		for (let seed = 0; seed < 50; seed++) {
			const build = emptyBuild();
			addWeapon(build, 'machete', 1);
			const run = createRunState(HEROES.jack, { seed });
			run.round = 1 + (seed % 25);
			run.fish = seed * 7;
			const start = run.fish;
			const r = roll(seed);
			const offers = weaponCandidates('jack').slice(0, 4);
			run.shop = open(offers.map((c) => offer(c.id, c.tier, 10 + seed)));
			playShop({ run, build, stats, roll: r });
			expect(run.fish).toBeGreaterThanOrEqual(0);
			expect(run.fish).toBeLessThanOrEqual(start + 100);
			expect(build.weapons.length).toBeLessThanOrEqual(6);
		}
	});

	test('a full bar only accepts a clearly stronger weapon', () => {
		const build = emptyBuild();
		for (const id of [
			'machete',
			'hammer',
			'knives',
			'fishBoomerang',
			'auxPistol',
			'crossbow',
		] as const)
			addWeapon(build, id, 3);
		expect(offerValue(offer('machete', 1, 8), build, stats)).toBe(0);
	});

	test('locks a good offer it cannot afford', () => {
		const build = emptyBuild();
		addWeapon(build, 'machete', 1);
		const run = createRunState(HEROES.jack, { seed: 1 });
		run.fish = 3;
		run.shop = open([
			offer('hammer', 4, 500),
			offer('knives', 1, 90),
			offer('auxPistol', 1, 90),
			offer('crossbow', 1, 90),
		]);
		playShop({ run, build, stats, roll: roll() });
		expect(run.shop?.locks.some(Boolean)).toBe(true);
	});
});

describe('nextShopAction (real-game bot)', () => {
	test('stepwise play ends, never overspends and fuses equal pairs', () => {
		for (let seed = 0; seed < 40; seed++) {
			const build = emptyBuild();
			addWeapon(build, 'machete', 1);
			const run = createRunState(HEROES.jack, { seed });
			run.round = 3 + (seed % 20);
			run.fish = 20 + seed * 9;
			const r = roll(seed);
			run.shop = open(rollOffers(r.rng, run.round, r.ctx, r.pool, []));
			for (let step = 0; step < 60; step++) {
				const shop = run.shop as ShopState;
				const a = nextShopAction({
					offers: shop.offers,
					locks: shop.locks,
					rerolls: shop.rerolls,
					fish: run.fish,
					round: run.round,
					build,
					stats,
				});
				if (a.type === 'done') break;
				if (a.type === 'fuse') expect(fuse(build, a.a, a.b)).toBe(true);
				else if (a.type === 'sell') {
					const w = build.weapons[a.slot];
					run.fish += sellValue(offerPrice('weapon', w?.tier ?? 1, run.round));
					build.weapons.splice(a.slot, 1);
				} else if (a.type === 'buy') {
					const bought = buy(shop, run.fish, a.index);
					expect(bought).not.toBeNull();
					run.shop = bought?.state ?? shop;
					run.fish = bought?.fish ?? run.fish;
					addWeapon(
						build,
						(bought?.offer.id ?? 'machete') as never,
						(bought?.offer.tier ?? 1) as never,
					);
				} else if (a.type === 'lock') run.shop = lock(shop, a.index);
				else {
					const rr = reroll(shop, run.fish, r.rng, run.round, r.ctx, r.pool);
					expect(rr).not.toBeNull();
					run.shop = rr?.state ?? shop;
					run.fish = rr?.fish ?? run.fish;
				}
				expect(run.fish).toBeGreaterThanOrEqual(0);
				expect(build.weapons.length).toBeLessThanOrEqual(6);
				expect(step).toBeLessThan(59);
			}
		}
	});

	test('with no Fish and nothing good to keep, it is done', () => {
		const build = emptyBuild();
		addWeapon(build, 'machete', 1);
		expect(
			nextShopAction({
				offers: [null, null, null, null],
				locks: [false, false, false, false],
				rerolls: 0,
				fish: 0,
				round: 1,
				build,
				stats,
			}),
		).toEqual({ type: 'done' });
	});
});

describe('human preference model', () => {
	test('taste is deterministic by seed and stays inside the range', () => {
		const a = makeTaste(7);
		expect(makeTaste(7)).toEqual(a);
		expect(makeTaste(8)).not.toEqual(a);
		const [lo, hi] = SHOP_POLICY.tasteRange;
		for (const v of Object.values(a)) {
			expect(v).toBeGreaterThanOrEqual(lo);
			expect(v).toBeLessThanOrEqual(hi);
		}
	});

	test('softmax leaves a close second a real chance and a far one almost none', () => {
		const draws = (scores: number[]) => {
			const rng = new Rng(1);
			let second = 0;
			for (let i = 0; i < 4000; i++)
				if (softmaxPick(scores, SHOP_POLICY.temperature, rng) === 1) second++;
			return second / 4000;
		};
		const close = draws([1, 0.9]);
		expect(close).toBeGreaterThan(0.25);
		expect(close).toBeLessThan(0.45);
		expect(draws([1, 0.3])).toBeLessThan(0.02);
	});

	test('with a preference the same seed buys the same things, and it still never overspends', () => {
		const run = () => {
			const build = emptyBuild();
			addWeapon(build, 'machete', 1);
			const r = createRunState(HEROES.jack, { seed: 4 });
			r.round = 9;
			r.fish = 400;
			const rl = roll(4);
			r.shop = open(rollOffers(rl.rng, r.round, rl.ctx, rl.pool, []));
			const play = playShop({
				run: r,
				build,
				stats,
				roll: rl,
				preference: { taste: makeTaste(4), rng: new Rng(44) },
			});
			expect(r.fish).toBeGreaterThanOrEqual(0);
			return play.bought.map((o) => `${o.id}:${o.tier}`);
		};
		expect(run()).toEqual(run());
	});
});

describe('bot buys of the healing potion and Magnetic (SDD-014)', () => {
	const offers = [
		{ kind: 'healPotion', id: 'healPotion', tier: 1, price: 20 },
		{ kind: 'support', id: 'magnetic', tier: 1, price: 20 },
		{ kind: 'support', id: 'swift', tier: 1, price: 20 },
		null,
	] as const;
	const view = (over: Partial<ShopView>): ShopView =>
		({
			offers,
			locks: [false, false, false, false],
			rerolls: 0,
			fish: 100,
			round: 1,
			build: emptyBuild(),
			stats: stats,
			...over,
		}) as ShopView;

	test('one potion level from the start, more every 5 rounds; never Swift', () => {
		expect(extraBuy(view({}))).toBe(0);
		expect(extraBuy(view({ healPotion: { ...emptyHealPotion(), level: 1 } }))).toBe(-1);
		expect(extraBuy(view({ round: 5, healPotion: { ...emptyHealPotion(), level: 1 } }))).toBe(
			0,
		);
	});

	test('Magnetic from round 3 up to level 3, and only when affordable', () => {
		const potion = { ...emptyHealPotion(), level: 9 };
		expect(extraBuy(view({ round: 2, healPotion: potion }))).toBe(-1);
		expect(extraBuy(view({ round: 3, healPotion: potion }))).toBe(1);
		expect(extraBuy(view({ round: 3, healPotion: potion, fish: 10 }))).toBe(-1);
		expect(extraBuy(view({ round: 40, healPotion: potion, support: { magnetic: 3 } }))).toBe(
			-1,
		);
	});

	test('skipExtras keeps the weapon-only policy', () => {
		expect(nextShopAction(view({ skipExtras: true })).type).not.toBe('buy');
		expect(nextShopAction(view({}))).toEqual({ type: 'buy', index: 0 });
	});
});
