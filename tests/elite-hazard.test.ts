import { describe, expect, test } from 'bun:test';
import { ELITE_HAZARD, ELITE_HAZARD_KINDS, type EliteHazardKind } from '../src/data/elite-hazard';
import { ROUNDS } from '../src/data/rounds';
import { type HazardShape, hazardDuration, hazardHits } from '../src/logic/boss-hazard';
import { drawEliteHazard, eliteCanCast, planEliteHazard } from '../src/logic/elite-hazard';
import { Rng } from '../src/logic/rng';

const elite = { x: 0, y: 0 };
const hero = { x: 300, y: 0 };
const R = 12;

function hits(kind: EliteHazardKind, x: number, y: number): boolean {
	return planEliteHazard(kind, elite, hero).some((m) => hazardHits(m.shape, x, y, R));
}

describe('elite stats', () => {
	test.each([
		['purple', 4, 2.5],
		['orange', 6, 2.8],
	] as const)('%s has double HP and double size', (tier, hp, scale) => {
		expect(ROUNDS.elite[tier].hp).toBe(hp);
		expect(ROUNDS.elite[tier].scale).toBe(scale);
	});
});

describe('sector geometry', () => {
	const s: HazardShape = { kind: 'sector', x: 0, y: 0, angle: 0, r: 200, arc: Math.PI / 3 };
	const cases: [string, number, number, boolean][] = [
		['on the axis', 150, 0, true],
		['inside the wedge', 150, 50, true],
		['outside the wedge', 150, 150, false],
		['behind the elite', -100, 0, false],
		['past the radius', 230, 0, false],
		['touching the origin', 5, -5, true],
	];
	test.each(cases)('%s', (_n, x, y, hit) => {
		expect(hazardHits(s, x, y, R)).toBe(hit);
	});
});

describe('planEliteHazard geometry (hit and miss)', () => {
	const cases: [EliteHazardKind, string, number, number, boolean][] = [
		['nova', 'next to the elite', 100, 0, true],
		['nova', 'far away', 300, 0, false],
		['cone', 'in front, toward the hero', 200, 0, true],
		['cone', 'behind', -100, 0, false],
		['cone', 'beside the cone', 100, 150, false],
		['cross', 'on the + arm', 150, 0, true],
		['cross', 'on the x arm (second volley)', 120, 120, true],
		['cross', 'in a wedge between arms', 150, 70, false],
		['cross', 'past the arm length', 300, 0, false],
		['stomp', 'where the hero stood', 300, 0, true],
		['stomp', 'last stomp of the trail', 300 + 2 * ELITE_HAZARD.stomp.step, 0, true],
		['stomp', 'beside the trail', 300, 200, false],
		['cage', 'hero in the safe center', 300, 0, false],
		['cage', 'on a cage circle', 300 + ELITE_HAZARD.cage.ringRadius, 0, true],
		['cage', 'outside the cage', 300 + 300, 0, false],
	];
	test.each(cases)('%s: %s', (kind, _n, x, y, hit) => {
		expect(hits(kind, x, y)).toBe(hit);
	});

	test('cross rotates: the first volley is "+", the second "x"', () => {
		const marks = planEliteHazard('cross', elite, hero);
		expect(marks.filter((m) => m.group === 0)).toHaveLength(4);
		expect(marks.filter((m) => m.group === 1)).toHaveLength(4);
		expect(Math.max(...marks.map((m) => m.at))).toBeGreaterThan(0);
	});

	test('stomp lands in sequence', () => {
		const ats = planEliteHazard('stomp', elite, hero).map((m) => m.at);
		expect(ats).toEqual([...ats].sort((a, b) => a - b));
		expect(new Set(ats).size).toBe(ELITE_HAZARD.stomp.count);
	});
});

describe('every pattern', () => {
	test.each([...ELITE_HAZARD_KINDS])(
		'%s telegraphs at least 0.8 s and is deterministic',
		(kind) => {
			const a = planEliteHazard(kind, elite, hero);
			expect(a).toEqual(planEliteHazard(kind, elite, hero));
			expect(a.length).toBeGreaterThan(0);
			for (const m of a) {
				expect(m.telegraph).toBeGreaterThanOrEqual(0.8);
				expect(m.damage).toBeGreaterThan(0);
				expect(m.damage).toBeLessThanOrEqual(1);
			}
			expect(hazardDuration(a)).toBeGreaterThanOrEqual(0.8);
		},
	);
});

describe('drawEliteHazard', () => {
	test('is deterministic per seed', () => {
		const draw = (seed: number) => {
			const rng = new Rng(seed);
			return Array.from({ length: 20 }, () => drawEliteHazard(rng));
		};
		expect(draw(5)).toEqual(draw(5));
		expect(draw(5)).not.toEqual(draw(6));
	});

	test('covers all 5 patterns', () => {
		const rng = new Rng(1);
		const seen = new Set(Array.from({ length: 200 }, () => drawEliteHazard(rng)));
		expect([...seen].sort()).toEqual([...ELITE_HAZARD_KINDS].sort());
		expect(ELITE_HAZARD_KINDS).toHaveLength(5);
	});
});

describe('eliteCanCast', () => {
	const near = ELITE_HAZARD.maxDist - 1;
	const cases: [string, number, number, number, boolean][] = [
		['ready', near, 0, 0, true],
		['cooling down', near, 1, 0, false],
		['hero too far', ELITE_HAZARD.maxDist + 1, 0, 0, false],
		['one slot left', near, 0, ELITE_HAZARD.maxActive - 1, true],
		['screen cap reached', near, 0, ELITE_HAZARD.maxActive, false],
	];
	test.each(cases)('%s', (_n, dist, cd, active, ok) => {
		expect(eliteCanCast(dist, cd, active)).toBe(ok);
	});
});
