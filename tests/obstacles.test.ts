import { describe, expect, test } from 'bun:test';
import { BIOMES } from '../src/art/manifest';
import { arenaBounds, propLayout } from '../src/logic/arena';
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

	test('field returns the arena props within reach', () => {
		const b = arenaBounds(5);
		const props = propLayout(7, BIOMES.antarctica, b);
		expect(props.length).toBeGreaterThan(0);
		const field = new ObstacleField(props);
		for (const p of props) {
			expect(field.near(p.x, p.y, 1).some((o) => o.x === p.x && o.y === p.y)).toBe(true);
		}
	});

	test('queries only return obstacles within reach and follow setProps', () => {
		const field = new ObstacleField(propLayout(3, BIOMES.ruins, arenaBounds(5)));
		for (const o of field.near(100, 100, 10)) {
			expect(Math.abs(o.x - 100)).toBeLessThanOrEqual(23);
			expect(Math.abs(o.y - 100)).toBeLessThanOrEqual(23);
		}
		field.setProps([]);
		expect(field.near(0, 0, 1000)).toHaveLength(0);
	});
});
