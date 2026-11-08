import { describe, expect, test } from 'bun:test';
import { HEROES } from '../src/data/heroes';
import { addWeapon, emptyBuild } from '../src/logic/build';
import { Rng } from '../src/logic/rng';
import { createRunState, type ShopRoll, weaponCandidates } from '../src/logic/run-state';
import type { Offer, ShopState } from '../src/logic/shop';
import { fuseAll, offerValue, playShop } from '../src/logic/sim/shop-policy';
import { heroStats } from '../src/logic/stats';

const stats = heroStats(HEROES.jack, 1, {});
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
