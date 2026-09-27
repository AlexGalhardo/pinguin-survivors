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
	test('evolution always wins', () => {
		const offers = [
			{ card: card('damage'), rarity: 'legendary' as const },
			{ card: card('evolve.2'), rarity: 'legendary' as const },
		];
		expect(pickBest(offers, emptyBuild(1), 'jack')).toBe(1);
	});

	test('a full weapon bar rejects new secondaries', () => {
		const build = emptyBuild(1);
		build.secondaries = { knives: 1, molotov: 1, iceShards: 1 };
		expect(scoreCard(card('weapon.auxPistol'), 'common', build, 'jack')).toBe(0);
		expect(scoreCard(card('weapon.knives'), 'common', build, 'jack')).toBeGreaterThan(0);
	});

	test('rarity scales stat cards', () => {
		const b = emptyBuild(1);
		expect(scoreCard(card('damage'), 'epic', b, 'bob')).toBeGreaterThan(
			scoreCard(card('damage'), 'common', b, 'bob'),
		);
	});
});
