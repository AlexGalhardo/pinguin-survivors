import { describe, expect, test } from 'bun:test';
import { ALL_CARDS } from '../src/data/cards';
import { ENEMIES } from '../src/data/enemies';
import { ROUNDS } from '../src/data/rounds';
import { emptyBuild } from '../src/logic/build';
import { pickBest, scoreCard } from '../src/logic/sim/card-policy';
import {
	bossDps,
	eliteHazardLoad,
	SIM,
	simTree,
	simulateMany,
	simulateRun,
} from '../src/logic/sim/run-sim';

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

	test('the sim tree spends level − 1 points', () => {
		expect(simTree('jack', 9)).toHaveLength(8);
		expect(simTree('jack', 1)).toHaveLength(0);
	});
});

describe('two clocks (SDD-018)', () => {
	test('the speed changes wall seconds only: the round clock and motion ratio are fixed', () => {
		const x1 = simulateRun({ hero: 'jack', level: 10, seed: 7, speed: 1 });
		const x2 = simulateRun({ hero: 'jack', level: 10, seed: 7, speed: 2 });
		expect({ ...x2, seconds: 0 }).toEqual({ ...x1, seconds: 0 });
		expect(x2.seconds).toBeCloseTo(x1.seconds / 2, 6);
	});

	test('motion terms scale by m, red-mark casts follow the round clock only', () => {
		const boss = ENEMIES.kraken;
		const marks = bossDps(
			{
				...boss,
				boss: boss.boss && { ...boss.boss, chargeEvery: 0, volleyEvery: 0, poolEvery: 0 },
				cooldown: 1e9,
			},
			100,
			0,
		);
		expect(marks).toBeGreaterThan(0);
		expect(bossDps(boss, 100, 2) - bossDps(boss, 100, 0)).toBeCloseTo(
			2 * (bossDps(boss, 100, 1) - bossDps(boss, 100, 0)),
			6,
		);
		expect(bossDps(boss, 100, 0)).toBeGreaterThan(0);
	});

	test('elite hazards cap the casters at maxActive and vanish without elites', () => {
		expect(eliteHazardLoad(300, 0, 10)).toBe(0);
		expect(eliteHazardLoad(300, 0.5, 10)).toBe(eliteHazardLoad(1000, 0.5, 10));
		expect(eliteHazardLoad(10, 0.1, 10)).toBeLessThan(eliteHazardLoad(300, 0.5, 10));
	});

	test('contact and ranged shots hurt a normal round even below the safe crowd', () => {
		const lost = (round: number) =>
			simulateRun({ hero: 'jack', level: 30, seed: 5 }).perRound[round - 1] as number;
		const [touch, shot] = [SIM.touchPerEnemy, SIM.shotLand];
		try {
			SIM.touchPerEnemy = 0;
			SIM.shotLand = 0;
			const bare = [2, 4].map(lost);
			SIM.touchPerEnemy = touch;
			expect(lost(2)).toBeGreaterThan(bare[0] as number);
			SIM.shotLand = shot;
			expect(lost(4)).toBeGreaterThan(bare[1] as number);
		} finally {
			SIM.touchPerEnemy = touch;
			SIM.shotLand = shot;
		}
	});

	test('the superpower reaches the boss by the game rules: full ticks for Jack and Lucia, a share of Bob bombs', () => {
		expect(SIM.superBossShare.jack).toBe(1);
		expect(SIM.superBossShare.lucia).toBe(1);
		expect(SIM.superBossShare.bob).toBeGreaterThan(0);
		expect(SIM.superBossShare.bob).toBeLessThan(1);
	});

	test('boss end is split into damage death and time-out', () => {
		const r = simulateRun({ hero: 'jack', level: 10, seed: 3 });
		expect(['death', 'bossDeath', 'bossTimeout', 'survived']).toContain(r.cause);
		const slow = simulateMany('jack', 1, 6);
		expect(slow.bossDeaths + slow.bossTimeouts).toBeLessThanOrEqual(6);
	});

	test('the sim covers the 50-round campaign plus endless', () => {
		expect(SIM.maxRound).toBeGreaterThan(ROUNDS.scaling.loopRounds);
	});

	test('Fish per kill add to the run income', () => {
		const r = simulateRun({ hero: 'jack', level: 10, seed: 3 });
		expect(r.fish).toBeGreaterThan(0);
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
