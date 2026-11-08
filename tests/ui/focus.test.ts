import { describe, expect, test } from 'bun:test';
import { nextFocus } from '../../src/ui/focus-nav';

const grid = [
	{ x: 0, y: 0, w: 10, h: 10 },
	{ x: 20, y: 0, w: 10, h: 10 },
	{ x: 0, y: 20, w: 10, h: 10 },
	{ x: 20, y: 20, w: 10, h: 10 },
];

describe('nextFocus', () => {
	test('moves across a 2x2 grid and stays at the edges', () => {
		expect(nextFocus(grid, 0, 'right')).toBe(1);
		expect(nextFocus(grid, 0, 'down')).toBe(2);
		expect(nextFocus(grid, 3, 'left')).toBe(2);
		expect(nextFocus(grid, 3, 'up')).toBe(1);
		expect(nextFocus(grid, 0, 'left')).toBe(0);
		expect(nextFocus(grid, 3, 'down')).toBe(3);
	});

	test('prefers the aligned item over a closer diagonal one', () => {
		const r = [
			{ x: 0, y: 0, w: 10, h: 10 },
			{ x: 12, y: 30, w: 10, h: 10 },
			{ x: 0, y: 60, w: 10, h: 10 },
		];
		expect(nextFocus(r, 0, 'down')).toBe(1);
		expect(nextFocus(r, 1, 'down')).toBe(2);
	});

	test('no current item focuses the first', () => {
		expect(nextFocus(grid, -1, 'down')).toBe(0);
		expect(nextFocus([], -1, 'down')).toBe(-1);
	});
});
