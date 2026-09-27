import { expect, test } from 'bun:test';
import { SpatialGrid } from '../src/logic/spatial-grid';
import { type Mover, seekWithSeparation } from '../src/logic/steering';

test('seeks the target at full speed when alone', () => {
	const grid = new SpatialGrid<Mover>(32, 512, 512);
	const a = { x: 0, y: 0, radius: 10, speed: 80 };
	grid.insert(a);
	const v = seekWithSeparation(a, 100, 0, grid, []);
	expect(v.vx).toBeCloseTo(80);
	expect(v.vy).toBeCloseTo(0);
});

test('overlapping neighbors push each other apart', () => {
	const grid = new SpatialGrid<Mover>(32, 512, 512);
	const a = { x: 0, y: 0, radius: 10, speed: 80 };
	const b = { x: 0, y: 5, radius: 10, speed: 80 };
	grid.insert(a);
	grid.insert(b);
	const va = seekWithSeparation(a, 0, 0, grid, []);
	expect(va.vy).toBeLessThan(0);
	expect(Math.hypot(va.vx, va.vy)).toBeLessThanOrEqual(80 + 1e-9);
});
