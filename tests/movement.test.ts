import { describe, expect, it } from 'bun:test';
import { moveVector } from '../src/logic/movement';

describe('moveVector', () => {
	it('is zero with no input or opposite inputs', () => {
		expect(moveVector(false, false, false, false)).toEqual({ x: 0, y: 0 });
		expect(moveVector(true, true, true, true)).toEqual({ x: 0, y: 0 });
	});

	it('moves along one axis at unit speed', () => {
		expect(moveVector(false, false, false, true)).toEqual({ x: 1, y: 0 });
		expect(moveVector(true, false, false, false)).toEqual({ x: 0, y: -1 });
	});

	it('normalizes diagonals', () => {
		const v = moveVector(true, false, true, false);
		expect(Math.hypot(v.x, v.y)).toBeCloseTo(1);
		expect(v.x).toBeCloseTo(-Math.SQRT1_2);
	});
});
