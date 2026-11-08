import { describe, expect, it } from 'bun:test';
import { ARENA } from '../src/data/arena';
import { OBSTACLES } from '../src/data/obstacles';
import {
	arenaBounds,
	arenaSide,
	type Bounds,
	clampCameraCenter,
	clampToArena,
	insideBounds,
	propLayout,
	spawnRing,
	tileVariant,
} from '../src/logic/arena';
import { Rng } from '../src/logic/rng';

function edgeDistance(p: { x: number; y: number }, b: Bounds): number {
	return Math.min(p.x - b.minX, b.maxX - p.x, p.y - b.minY, b.maxY - p.y);
}

describe('arenaSide (A1)', () => {
	it('starts at 10, grows 1 per round and caps at 40', () => {
		expect(arenaSide(1)).toBe(10);
		expect(arenaSide(2)).toBe(11);
		expect(arenaSide(31)).toBe(40);
		expect(arenaSide(99)).toBe(40);
	});

	it('bounds are centered on the origin and grow centered', () => {
		const b1 = arenaBounds(1);
		expect(b1).toEqual({ minX: -320, minY: -320, maxX: 320, maxY: 320 });
		const b2 = arenaBounds(2);
		expect(b2.maxX - b2.minX).toBe(11 * ARENA.tile);
		expect(b2.minX + b2.maxX).toBe(0);
		expect(arenaBounds(1, 40).maxX).toBe(20 * ARENA.tile);
	});
});

describe('spawnRing (A2)', () => {
	it('1.000 points stay within 64 u of the edge, inside bounds and outside the view', () => {
		const b = arenaBounds(20);
		const view: Bounds = { minX: -480, minY: -270, maxX: 480, maxY: 270 };
		const points = spawnRing(b, view, new Rng(7), 1000);
		expect(points).toHaveLength(1000);
		for (const p of points) {
			expect(insideBounds(p, b)).toBe(true);
			expect(edgeDistance(p, b)).toBeLessThanOrEqual(ARENA.tile);
			expect(p.telegraph).toBe(false);
			const m = ARENA.spawnViewMargin;
			const inView =
				p.x >= view.minX - m &&
				p.x <= view.maxX + m &&
				p.y >= view.minY - m &&
				p.y <= view.maxY + m;
			expect(inView).toBe(false);
		}
	});

	it('telegraphs when the whole arena is visible', () => {
		const b = arenaBounds(1);
		const view: Bounds = { minX: -960, minY: -540, maxX: 960, maxY: 540 };
		const points = spawnRing(b, view, new Rng(3), 200);
		for (const p of points) {
			expect(insideBounds(p, b)).toBe(true);
			expect(edgeDistance(p, b)).toBeLessThanOrEqual(ARENA.tile);
			expect(p.telegraph).toBe(true);
		}
	});
});

describe('clampToArena (A3)', () => {
	it('a hero pushing into the corner for 5 s stays inside', () => {
		const b = arenaBounds(1);
		const hero = { x: 0, y: 0 };
		for (let i = 0; i < 300; i++) {
			hero.x += 4;
			hero.y -= 4;
			clampToArena(hero, 12, b);
		}
		expect(hero.x).toBe(b.maxX - 12);
		expect(hero.y).toBe(b.minY + 12);
	});
});

describe('propLayout', () => {
	const layout = { decoVariants: 3, decoDensity: 0.2 };

	it('is deterministic per seed and keeps clear of the hero spawn and the ring', () => {
		const b = arenaBounds(31);
		const a = propLayout(42, layout, b);
		expect(propLayout(42, layout, b)).toEqual(a);
		expect(a.length).toBeGreaterThan(0);
		for (const p of a) {
			expect(Math.hypot(p.x, p.y)).toBeGreaterThanOrEqual(ARENA.propClearTiles * ARENA.tile);
			expect(edgeDistance(p, b)).toBeGreaterThan(ARENA.tile);
		}
	});
});

describe('tileVariant (RF-07)', () => {
	it('is stable per (seed, tx, ty), in range, and mostly the plain variant', () => {
		let plain = 0;
		for (let ty = 0; ty < 20; ty++) {
			for (let tx = 0; tx < 20; tx++) {
				const v = tileVariant(1, tx, ty, 4);
				expect(tileVariant(1, tx, ty, 4)).toBe(v);
				expect(v).toBeGreaterThanOrEqual(0);
				expect(v).toBeLessThan(4);
				if (v === 0) plain++;
			}
		}
		expect(plain).toBeGreaterThan(150);
		expect(plain).toBeLessThan(400);
	});
});

describe('clampCameraCenter (RF-05)', () => {
	it('stays centered on an axis where the arena is smaller than the view', () => {
		const b = arenaBounds(1);
		expect(clampCameraCenter({ x: 300, y: -300 }, 1000, 700, b)).toEqual({ x: 0, y: 0 });
	});

	it('follows the hero but never shows past the walls when the arena is bigger', () => {
		const b = arenaBounds(31);
		const c = clampCameraCenter({ x: 5000, y: -5000 }, 960, 540, b);
		expect(c).toEqual({ x: b.maxX - 480, y: b.minY + 270 });
		expect(clampCameraCenter({ x: 10, y: 20 }, 960, 540, b)).toEqual({ x: 10, y: 20 });
	});
});

it('big obstacles keep a free lane between them and leave most of the floor open', () => {
	for (let seed = 1; seed <= 50; seed++) {
		for (const round of [1, 10, 30]) {
			const b = arenaBounds(round);
			const props = propLayout(seed, { decoVariants: 4, decoDensity: 0.05 }, b);
			let covered = 0;
			for (const [i, p] of props.entries()) {
				covered += Math.PI * p.r * p.r;
				for (const q of props.slice(i + 1))
					expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThanOrEqual(
						p.r + q.r + OBSTACLES.minGap,
					);
			}
			expect(covered).toBeLessThanOrEqual(
				(b.maxX - b.minX) * (b.maxY - b.minY) * OBSTACLES.maxCoverage,
			);
		}
	}
});
