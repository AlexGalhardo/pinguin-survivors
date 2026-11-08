import { describe, expect, test } from 'bun:test';
import { HERO_IDS } from '../src/config/constants';
import {
	buildShares,
	evaluateGoals,
	median,
	quantile,
	renderReport,
	summaryRows,
} from '../src/logic/sim/balance-report';
import { parseJsonl, type RunEndEvent, toJsonl } from '../src/logic/telemetry';

const ev = (over: Partial<RunEndEvent>): RunEndEvent => ({
	version: 'sim',
	hero: 'jack',
	danger: 1,
	level: 1,
	round: 12,
	weapons: ['machete:1'],
	cause: 'death',
	durationS: 300,
	platform: 'web',
	source: 'sim',
	...over,
});
const many = (n: number, over: Partial<RunEndEvent>) =>
	Array.from({ length: n }, (_, i) => ev({ ...over, round: (over.round ?? 12) + (i % 3) }));
const goal = (events: RunEndEvent[], id: number) => evaluateGoals(events).find((g) => g.id === id);

describe('stats helpers', () => {
	test('quantile interpolates and median works on events', () => {
		expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
		expect(quantile([5], 0.25)).toBe(5);
		expect(quantile([], 0.5)).toBeNaN();
		expect(median([ev({ round: 4 }), ev({ round: 10 }), ev({ round: 30 })])).toBe(10);
	});
});

describe('goal checks', () => {
	test('no data is n/d, never a pass', () => {
		for (const g of evaluateGoals([])) expect(g.status).toBe('n/d');
	});

	test('#1 passes inside 8-20 and fails past 30 or out of range', () => {
		const ok = HERO_IDS.flatMap((hero) => many(10, { hero, round: 12 }));
		expect(goal(ok, 1)?.status).toBe('✓');
		expect(goal([...ok, ev({ round: 31 })], 1)?.status).toBe('✗');
		const low = HERO_IDS.flatMap((hero) => many(10, { hero, round: 3 }));
		expect(goal(low, 1)?.status).toBe('✗');
	});

	test('#3 needs every hero and respects the 30-60 window', () => {
		const heroes = (round: number) =>
			HERO_IDS.flatMap((hero) => many(5, { hero, level: 20, workshop: 4, round }));
		expect(goal(heroes(40), 3)?.status).toBe('✓');
		expect(goal(heroes(61), 3)?.status).toBe('✗');
		expect(goal(heroes(40).slice(5), 3)?.status).toBe('n/d');
	});

	test('#4 compares Danger 0, 1 and 5 at L10', () => {
		const at = (danger: 0 | 1 | 5, round: number) => many(5, { level: 10, danger, round });
		expect(goal([...at(0, 40), ...at(1, 30), ...at(5, 10)], 4)?.status).toBe('✓');
		expect(goal([...at(0, 32), ...at(1, 30), ...at(5, 10)], 4)?.status).toBe('✗');
		expect(goal([...at(0, 40), ...at(1, 30)], 4)?.status).toBe('n/d');
	});

	test('#5 is measured per hero: a dominant weapon or set in one hero fails it', () => {
		const heroRuns = (hero: 'jack' | 'bob' | 'lucia', weapons: string[]) =>
			Array.from({ length: 40 }, () => ev({ hero, level: 10, weapons }));
		const dominant = [
			...heroRuns('jack', ['machete:1', 'hammer:2']),
			...heroRuns('bob', ['doubleBarrel:1']),
			...heroRuns('lucia', ['elementStaff:1']),
		];
		const res = goal(dominant, 5);
		expect(res?.status).toBe('✗');
		expect(res?.detail).toContain('jack: arma hammer 100.0%');
		expect(goal(heroRuns('jack', ['machete:1', 'hammer:2']), 5)?.status).toBe('n/d');
		const shares = buildShares(heroRuns('jack', ['machete:1', 'hammer:2']));
		expect(shares.weapons.hammer).toBe(1);
		expect(shares.weapons.machete).toBeUndefined();
		expect(shares.sets.blunt).toBe(1);
	});

	test('#2 accepts up to 5% early deaths and fails above', () => {
		const heroRuns = (early: number) =>
			HERO_IDS.flatMap((hero) =>
				Array.from({ length: 100 }, (_, i) =>
					ev({ hero, level: 10, workshop: 2, round: i < early ? 10 : 24 }),
				),
			);
		expect(goal(heroRuns(5), 2)?.status).toBe('✓');
		expect(goal(heroRuns(6), 2)?.status).toBe('✗');
		expect(goal(heroRuns(0).slice(100), 2)?.status).toBe('n/d');
	});

	test('#6 checks spent/earned and the reroll share', () => {
		const run = (spent: number, rerolled: number) =>
			ev({ fishEarned: 100, fishSpent: spent, fishRerolled: rerolled });
		expect(goal([run(90, 5)], 6)?.status).toBe('✓');
		expect(goal([run(70, 0)], 6)?.status).toBe('✗');
		expect(goal([run(95, 30)], 6)?.status).toBe('✗');
	});

	test('#7 uses real time from bot runs only', () => {
		expect(goal([ev({})], 7)?.status).toBe('n/d');
		expect(goal([ev({ source: 'bot', wallS: 12 * 60 })], 7)?.status).toBe('✓');
		expect(goal([ev({ source: 'bot', wallS: 4 * 60 })], 7)?.status).toBe('✗');
	});
});

describe('report output', () => {
	test('summary rows are ordered by hero, level and Danger with quartiles', () => {
		const rows = summaryRows([
			ev({ hero: 'bob', level: 10, danger: 2, round: 20 }),
			ev({ hero: 'jack', level: 10, danger: 0, round: 10 }),
			ev({ hero: 'jack', level: 1, danger: 1, round: 4 }),
			ev({ hero: 'jack', level: 1, danger: 1, round: 8 }),
		]);
		expect(rows.map((r) => r.slice(0, 3).join('/'))).toEqual([
			'jack/1/1',
			'jack/10/0',
			'bob/10/2',
		]);
		expect(rows[0]).toEqual(['jack', '1', '1', '2', '6', '5', '7', '0.0%']);
	});

	test('markdown lists every goal and survives a JSONL round-trip', () => {
		const events = parseJsonl(toJsonl(HERO_IDS.flatMap((hero) => many(10, { hero }))));
		const md = renderReport(events, { date: '2026-11-08', sources: ['sim.jsonl'] });
		expect(md).toContain('# Balanço automático (2026-11-08)');
		for (let id = 1; id <= 8; id++) expect(md).toMatch(new RegExp(`| ${id} |`));
		expect(md).toMatch(/\| 1 \|.*\| ✓ \|/);
		expect(md).toContain('## Round de morte por herói, nível e Danger');
	});
});
