import { describe, expect, test } from 'bun:test';
import { BIOMES } from '../src/art/manifest';
import { generateChunk } from '../src/logic/chunks';
import { ObstacleField, pushOut } from '../src/logic/obstacles';

describe('obstacles', () => {
	test('pushOut moves a circle to the obstacle edge', () => {
		const p = { x: 5, y: 0 };
		expect(pushOut(p, 4, [{ x: 0, y: 0, r: 6 }])).toBe(true);
		expect(p.x).toBeCloseTo(10);
		expect(p.y).toBeCloseTo(0);
		const far = { x: 50, y: 0 };
		expect(pushOut(far, 4, [{ x: 0, y: 0, r: 6 }])).toBe(false);
		const center = { x: 0, y: 0 };
		pushOut(center, 4, [{ x: 0, y: 0, r: 6 }]);
		expect(center).toEqual({ x: 10, y: 0 });
	});

	test('field matches the decorations drawn by the chunk manager', () => {
		const b = BIOMES.antarctica;
		const field = new ObstacleField(7, b);
		const decos = generateChunk(
			7,
			0,
			0,
			b.tileVariants,
			b.decoVariants,
			b.decoDensity,
		).decorations;
		expect(decos.length).toBeGreaterThan(0);
		for (const d of decos) {
			const near = field.near(d.x, d.y, 1);
			expect(near.some((o) => o.x === d.x && o.y === d.y)).toBe(true);
		}
	});

	test('queries only return obstacles within reach', () => {
		const field = new ObstacleField(3, BIOMES.ruins);
		for (const o of field.near(100, 100, 10)) {
			expect(Math.abs(o.x - 100)).toBeLessThanOrEqual(23);
			expect(Math.abs(o.y - 100)).toBeLessThanOrEqual(23);
		}
	});
});
