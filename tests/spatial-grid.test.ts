import { describe, expect, it } from 'bun:test';
import { Rng } from '../src/logic/rng';
import { nearestLinear, SpatialGrid } from '../src/logic/spatial-grid';

describe('SpatialGrid', () => {
	it('finds items within a radius', () => {
		const g = new SpatialGrid<{ x: number; y: number; id: number }>(64, 960, 540);
		g.insert({ x: 100, y: 100, id: 1 });
		g.insert({ x: 130, y: 100, id: 2 });
		g.insert({ x: 400, y: 400, id: 3 });
		const ids = g.queryRadius(100, 100, 40).map((i) => i.id);
		expect(ids.sort()).toEqual([1, 2]);
	});

	it('clamps out-of-bounds positions into edge cells', () => {
		const g = new SpatialGrid<{ x: number; y: number }>(64, 960, 540);
		g.insert({ x: -10, y: -10 });
		expect(g.queryRadius(0, 0, 20)).toHaveLength(1);
	});

	it('nearest matches brute force on random data', () => {
		const rng = new Rng(3);
		const items = Array.from({ length: 300 }, () => ({
			x: rng.range(0, 960),
			y: rng.range(0, 540),
		}));
		const g = new SpatialGrid<{ x: number; y: number }>(64, 960, 540);
		for (const it of items) g.insert(it);
		for (let i = 0; i < 100; i++) {
			const x = rng.range(0, 960);
			const y = rng.range(0, 540);
			const r = rng.range(20, 300);
			expect(g.nearest(x, y, r)).toBe(nearestLinear(items, x, y, r));
		}
	});

	it('nearest honors the accept filter', () => {
		const g = new SpatialGrid<{ x: number; y: number; ok: boolean }>(64, 960, 540);
		g.insert({ x: 10, y: 10, ok: false });
		g.insert({ x: 50, y: 10, ok: true });
		expect(g.nearest(0, 0, 100, (i) => i.ok)?.x).toBe(50);
	});
});
