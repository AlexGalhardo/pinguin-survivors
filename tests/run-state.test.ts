import { describe, expect, test } from 'bun:test';
import { HEROES } from '../src/data/heroes';
import { WEAPON_LINES } from '../src/data/weapons';
import { Rng } from '../src/logic/rng';
import { roundDuration } from '../src/logic/round';
import {
	createRunState,
	damageHero,
	endRound,
	finishRun,
	healHero,
	leaveShop,
	queueLevelUps,
	resolveLevelUp,
	roundClearFish,
	roundClearPearls,
	type ShopRoll,
	startRound,
	weaponCandidates,
} from '../src/logic/run-state';
import { defaultSave } from '../src/logic/save';
import { lock, type Offer, type ShopState } from '../src/logic/shop';

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

	test('end of round opens the shop with 4 offers; fish starts at 0', () => {
		const s = createRunState(HEROES.jack, { seed: 1 });
		expect(s.fish).toBe(0);
		endRound(s, roll());
		expect(s.phase).toBe('shop');
		expect(s.shop?.offers).toHaveLength(4);
		expect(s.fish).toBe(2);
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
