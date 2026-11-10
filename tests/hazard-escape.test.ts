import { describe, expect, test } from 'bun:test';
import { ELITE_HAZARD_KINDS } from '../src/data/elite-hazard';
import type { HazardKind } from '../src/data/enemies';
import { hazardHits, planHazard } from '../src/logic/boss-hazard';
import { planEliteHazard } from '../src/logic/elite-hazard';
import { type PendingMark, safePoint } from '../src/logic/hazard-escape';
import { Rng } from '../src/logic/rng';

const R = 12;
/** Round-clock units per second of a hero with ~150 move speed at the 2x motion/clock ratio. */
const SPEED = 300;
const boss = { x: 0, y: 0 };
const hero = { x: 300, y: 0 };

function pending(marks: ReturnType<typeof planHazard>): PendingMark[] {
	return marks.map((m) => ({ shape: m.shape, remaining: m.at + m.telegraph, group: m.group }));
}

/** Replays the straight walk: nothing may hold the hero when its mark detonates. */
function survives(marks: PendingMark[], to: { x: number; y: number }): boolean {
	const dist = Math.hypot(to.x - hero.x, to.y - hero.y);
	return marks.every((m) => {
		const k = dist > 0 ? Math.min(1, (m.remaining * SPEED) / dist) : 1;
		return !hazardHits(m.shape, hero.x + (to.x - hero.x) * k, hero.y + (to.y - hero.y) * k, R);
	});
}

describe('safePoint', () => {
	test('no marks: stays', () => {
		expect(safePoint([], hero, R, SPEED)).toEqual(hero);
	});

	test('stays when already clear of the mark', () => {
		const marks: PendingMark[] = [
			{ shape: { kind: 'circle', x: 0, y: 0, r: 60 }, remaining: 1, group: 0 },
		];
		expect(safePoint(marks, hero, R, SPEED)).toEqual(hero);
	});

	test('leaves a circle by the shortest way', () => {
		const marks: PendingMark[] = [
			{ shape: { kind: 'circle', x: 300, y: 0, r: 60 }, remaining: 1, group: 0 },
		];
		const p = safePoint(marks, hero, R, SPEED);
		expect(p).not.toBeNull();
		const d = Math.hypot((p?.x ?? 0) - hero.x, (p?.y ?? 0) - hero.y);
		expect(d).toBeGreaterThan(60);
		expect(d).toBeLessThan(60 + R + 8 + 24 + 1);
	});

	test('prefers the safe gap between ring waves over running out', () => {
		const marks: PendingMark[] = [
			{ shape: { kind: 'annulus', x: 0, y: 0, r0: 270, r1: 334 }, remaining: 1, group: 0 },
		];
		const p = safePoint(marks, hero, R, SPEED);
		expect(p).not.toBeNull();
		const d = Math.hypot(p?.x ?? 0, p?.y ?? 0);
		expect(d < 270 - R || d > 334 + R).toBe(true);
	});

	test('a mark that fires after the hero is gone does not hold him', () => {
		const marks: PendingMark[] = [
			{ shape: { kind: 'circle', x: 300, y: 0, r: 60 }, remaining: 2, group: 0 },
		];
		const p = safePoint(marks, hero, R, SPEED);
		expect(p).not.toEqual(hero);
	});

	test('too slow to get out in time: null', () => {
		const marks: PendingMark[] = [
			{ shape: { kind: 'circle', x: 300, y: 0, r: 400 }, remaining: 0.1, group: 0 },
		];
		expect(safePoint(marks, hero, R, SPEED)).toBeNull();
	});

	const bossKinds: HazardKind[] = ['circles', 'ring', 'lines', 'tiles'];
	test.each(bossKinds)('boss %s: finds a point that survives the whole attack', (kind) => {
		for (let seed = 1; seed <= 20; seed++) {
			const marks = pending(planHazard(kind, boss, hero, new Rng(seed)));
			const p = safePoint(marks, hero, R, SPEED);
			expect(p).not.toBeNull();
			expect(survives(marks, p as { x: number; y: number })).toBe(true);
		}
	});

	test.each([...ELITE_HAZARD_KINDS])('elite %s: finds a point that survives', (kind) => {
		const marks = pending(planEliteHazard(kind, { x: 240, y: 0 }, hero));
		const p = safePoint(marks, hero, R, SPEED);
		expect(p).not.toBeNull();
		expect(survives(marks, p as { x: number; y: number })).toBe(true);
	});
});
