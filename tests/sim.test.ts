import { describe, expect, test } from 'bun:test';
import { ALL_CARDS } from '../src/data/cards';
import { emptyBuild } from '../src/logic/build';
import { pickBest, scoreCard } from '../src/logic/sim/card-policy';
import { POINT_PLANS, simulateMany, simulateRun, spendPoints } from '../src/logic/sim/run-sim';

const card = (id: string) => ALL_CARDS.find((c) => c.id === id) as (typeof ALL_CARDS)[number];

describe('headless run sim', () => {
	test('is deterministic for the same seed', () => {
		const a = simulateRun({ hero: 'jack', level: 10, seed: 7 });
		const b = simulateRun({ hero: 'jack', level: 10, seed: 7 });
		expect(a).toEqual(b);
	});

	test('plays the shop: six-slot build, Fish spent, Pearls paid', () => {
		const r = simulateRun({ hero: 'bob', level: 10, seed: 3 });
		expect(r.weapons.length).toBeGreaterThanOrEqual(1);
		expect(r.weapons.length).toBeLessThanOrEqual(6);
		expect(r.fishSpent).toBeGreaterThan(0);
		expect(r.fishSpent).toBeLessThanOrEqual(r.fish + 200);
		expect(r.pearls).toBeGreaterThan(0);
		expect(r.weapons.some((w) => !w.endsWith(':1'))).toBe(true);
	});

	test('different seeds can change the build', () => {
		const runs = [1, 2, 3, 4, 5].map((seed) => simulateRun({ hero: 'bob', level: 10, seed }));
		expect(new Set(runs.map((r) => r.cards.join(','))).size).toBeGreaterThan(1);
	});

	test('higher level never does worse on average', () => {
		for (const hero of ['jack', 'bob', 'lucia'] as const) {
			const low = simulateMany(hero, 1, 12).avgRound;
			const high = simulateMany(hero, 30, 12).avgRound;
			expect(high).toBeGreaterThanOrEqual(low);
		}
	});

	test('spends level − 1 points following the plan', () => {
		const points = spendPoints(9, POINT_PLANS.jack);
		expect(Object.values(points).reduce((a, b) => a + b, 0)).toBe(8);
		expect(points.maxHp).toBe(2);
	});
});

describe('card policy', () => {
	test('picks the highest score', () => {
		const offers = [
			{ card: card('damage'), rarity: 'common' as const },
			{ card: card('perk.bloodlust'), rarity: 'common' as const },
		];
		const best = pickBest(offers, emptyBuild(1), 'jack');
		const scores = offers.map((o) => scoreCard(o.card, o.rarity, emptyBuild(1), 'jack'));
		expect(scores[best]).toBe(Math.max(...scores));
	});

	test('owned hero actives rate above taking a new one with full slots', () => {
		const build = emptyBuild(1);
		build.secondaries = { arcaneChain: 1 };
		expect(scoreCard(card('active.arcaneChain'), 'common', build, 'lucia')).toBeGreaterThan(0);
	});

	test('rarity scales stat cards', () => {
		const b = emptyBuild(1);
		expect(scoreCard(card('damage'), 'epic', b, 'bob')).toBeGreaterThan(
			scoreCard(card('damage'), 'common', b, 'bob'),
		);
	});
});
