import { describe, expect, test } from 'bun:test';
import { BOSS_HAZARD, type HazardKind } from '../src/data/enemies';
import { type HazardShape, hazardDuration, hazardHits, planHazard } from '../src/logic/boss-hazard';
import { Rng } from '../src/logic/rng';

const KINDS: HazardKind[] = ['circles', 'ring', 'lines', 'tiles'];
const boss = { x: 0, y: 0 };
const hero = { x: 300, y: 0 };

describe('hazardHits geometry', () => {
	const circle: HazardShape = { kind: 'circle', x: 100, y: 100, r: 50 };
	const annulus: HazardShape = { kind: 'annulus', x: 0, y: 0, r0: 70, r1: 134 };
	const line: HazardShape = { kind: 'line', x: 0, y: 0, angle: 0, length: 200, width: 40 };
	const cell: HazardShape = { kind: 'cell', x: 96, y: 0, size: 96 };
	const cases: [string, HazardShape, number, number, number, boolean][] = [
		['circle center', circle, 100, 100, 10, true],
		['circle edge + hero radius', circle, 155, 100, 10, true],
		['circle outside', circle, 170, 100, 10, false],
		['annulus on band', annulus, 100, 0, 10, true],
		['annulus inner hole', annulus, 20, 0, 10, false],
		['annulus safe gap beyond band', annulus, 160, 0, 10, false],
		['line along', line, 100, 10, 10, true],
		['line beside', line, 100, 40, 10, false],
		['line behind origin', line, -50, 0, 10, false],
		['line past the end', line, 250, 0, 10, false],
		['cell inside', cell, 100, 20, 10, true],
		['cell neighbour (other color)', cell, 96 + 96, 0, 10, false],
		['cell diagonal neighbour is outside', cell, 96 + 96, 96, 10, false],
	];
	test.each(cases)('%s', (_n, shape, x, y, r, hit) => {
		expect(hazardHits(shape, x, y, r)).toBe(hit);
	});
});

describe('planHazard', () => {
	test.each(KINDS)('%s is deterministic and every telegraph is dodgeable', (kind) => {
		const a = planHazard(kind, boss, hero, new Rng(7));
		const b = planHazard(kind, boss, hero, new Rng(7));
		expect(a).toEqual(b);
		expect(a.length).toBeGreaterThan(0);
		for (const m of a) expect(m.telegraph).toBeGreaterThanOrEqual(0.8);
		expect(hazardDuration(a)).toBeGreaterThanOrEqual(0.8);
	});

	test('circles: first lands on the hero', () => {
		const m = planHazard('circles', boss, hero, new Rng(1))[0];
		expect(m?.shape).toMatchObject({ kind: 'circle', x: hero.x, y: hero.y });
	});

	test('ring: a hero standing in the gap between waves is safe, one on a band is hit', () => {
		const c = BOSS_HAZARD.ring;
		const marks = planHazard('ring', boss, hero, new Rng(1));
		expect(marks).toHaveLength(c.waves);
		const gapR = c.start + c.width + c.gap / 2;
		const bandR = c.start + c.width / 2;
		const hitsAt = (r: number) => marks.filter((m) => hazardHits(m.shape, r, 0, 4)).length;
		expect(hitsAt(gapR)).toBe(0);
		expect(hitsAt(bandR)).toBe(1);
	});

	test('lines: first line aims at the hero, second volley covers the first safe wedge', () => {
		const marks = planHazard('lines', boss, hero, new Rng(1));
		const first = marks[0];
		expect(first?.shape).toMatchObject({ kind: 'line', angle: 0 });
		expect(first && hazardHits(first.shape, hero.x, hero.y, 0)).toBe(true);
		expect(new Set(marks.map((m) => m.group)).size).toBe(2);
		const a = (2 * Math.PI) / BOSS_HAZARD.lines.count;
		const between = { x: Math.cos(a / 2) * 200, y: Math.sin(a / 2) * 200 };
		const g0 = marks.filter((m) => m.group === 0);
		const g1 = marks.filter((m) => m.group === 1);
		expect(g0.some((m) => hazardHits(m.shape, between.x, between.y, 0))).toBe(false);
		expect(g1.some((m) => hazardHits(m.shape, between.x, between.y, 0))).toBe(true);
	});

	test('tiles: two alternating groups, no cell of a group touches another of the same group', () => {
		const marks = planHazard('tiles', boss, hero, new Rng(1));
		const groups = new Set(marks.map((m) => m.group));
		expect([...groups].sort()).toEqual([0, 1]);
		const cell = BOSS_HAZARD.tiles.cell;
		for (const m of marks) {
			if (m.shape.kind !== 'cell') throw new Error('expected cell');
			const { x, y } = m.shape;
			const sameGroupNeighbour = marks.some(
				(o) =>
					o !== m &&
					o.group === m.group &&
					o.shape.kind === 'cell' &&
					Math.abs(o.shape.x - x) + Math.abs(o.shape.y - y) === cell,
			);
			expect(sameGroupNeighbour).toBe(false);
		}
	});
});
