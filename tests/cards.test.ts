import { describe, expect, test } from 'bun:test';
import { ALL_CARDS } from '../src/data/cards';
import { HEROES } from '../src/data/heroes';
import { applyCard, canTake, emptyBuild, slotsUsed } from '../src/logic/build';
import { drawCards, evolutionAvailable, rarityWeights } from '../src/logic/cards';
import { Rng } from '../src/logic/rng';
import { baseStats } from '../src/logic/stats';

const card = (id: string) => {
	const c = ALL_CARDS.find((x) => x.id === id);
	if (!c) throw new Error(id);
	return c;
};

describe('rarity', () => {
	test('weights shift from round 1 to 30 and with luck', () => {
		expect(rarityWeights(1, 0)).toEqual([70, 22, 7, 1]);
		expect(rarityWeights(30, 0)).toEqual([40, 35, 18, 7]);
		const lucky = rarityWeights(1, 0.2);
		expect(lucky[0]).toBeCloseTo(50);
		expect(lucky.reduce((a, b) => a + b, 0)).toBeCloseTo(100);
	});
});

describe('drawCards', () => {
	test('3 distinct cards, exclusives only for the hero', () => {
		const rng = new Rng(1);
		for (let i = 0; i < 300; i++) {
			const offers = drawCards(rng, { hero: 'bob', round: 5, luck: 0, build: emptyBuild() });
			expect(offers).toHaveLength(3);
			expect(new Set(offers.map((o) => o.card.id)).size).toBe(3);
			for (const o of offers)
				expect(o.card.hero === undefined || o.card.hero === 'bob').toBe(true);
			for (const o of offers) expect(o.card.effect.type).not.toBe('evolve');
		}
	});

	test('evolution is always offered once available', () => {
		const rng = new Rng(2);
		const build = emptyBuild();
		expect(evolutionAvailable(build, 10)).toBeNull();
		const offers = drawCards(rng, { hero: 'jack', round: 11, luck: 0, build });
		expect(offers[0]?.card.id).toBe('evolve.2');
		build.tier = 2;
		expect(evolutionAvailable(build, 15)).toBeNull();
		expect(evolutionAvailable(build, 21)).toBe(3);
	});

	test('full slots only offer upgrades of owned weapons', () => {
		const build = emptyBuild();
		build.secondaries = { knives: 1, molotov: 5, auxPistol: 2 };
		expect(canTake(build, card('weapon.knives'))).toBe(true);
		expect(canTake(build, card('weapon.molotov'))).toBe(false);
		expect(canTake(build, card('weapon.iceShards'))).toBe(false);
	});
});

describe('applyCard', () => {
	test('stat cards scale with rarity and report max hp gains', () => {
		const stats = baseStats(HEROES.jack);
		const build = emptyBuild();
		const r = applyCard(build, stats, card('maxHp'), 'epic');
		expect(r.maxHpDelta).toBeCloseTo(12 * 2.4);
		expect(stats.maxHp).toBeCloseTo(140 + 28.8);
		applyCard(build, stats, card('resistIce'), 'common');
		expect(stats.resist.ice).toBeCloseTo(0.13);
	});

	test('weapons and perks level up; evolution sets the tier', () => {
		const stats = baseStats(HEROES.jack);
		const build = emptyBuild();
		applyCard(build, stats, card('weapon.knives'), 'common');
		applyCard(build, stats, card('weapon.knives'), 'rare');
		expect(build.secondaries.knives).toBe(2);
		expect(slotsUsed(build)).toBe(1);
		const r = applyCard(build, stats, card('perk.ironSkin'), 'common');
		expect(r.exclusive).toBe(true);
		expect(stats.armor).toBe(18);
		expect(applyCard(build, stats, card('evolve.2'), 'legendary').evolvedTo).toBe(2);
		expect(build.tier).toBe(2);
		expect(build.cards).toHaveLength(4);
	});
});
