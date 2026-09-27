import { describe, expect, test } from 'bun:test';
import {
	dirFromScreen,
	dirFromWorld,
	inputToWorld,
	isoDepth,
	screenToWorld,
	worldToScreen,
} from '../src/logic/iso';

describe('projection', () => {
	test('one world tile (32u) is a 64x32 diamond', () => {
		expect(worldToScreen(32, 0)).toEqual({ x: 32, y: 16 });
		expect(worldToScreen(0, 32)).toEqual({ x: -32, y: 16 });
		expect(worldToScreen(32, 32)).toEqual({ x: 0, y: 32 });
	});

	test('height lifts on screen', () => {
		expect(worldToScreen(10, 10, 5).y).toBe(5);
	});

	test('screenToWorld inverts worldToScreen', () => {
		for (const [x, y] of [
			[0, 0],
			[123.5, -40],
			[-900, 777],
		] as const) {
			const s = worldToScreen(x, y);
			const w = screenToWorld(s.x, s.y);
			expect(w.x).toBeCloseTo(x);
			expect(w.y).toBeCloseTo(y);
		}
	});

	test('depth grows towards the viewer', () => {
		expect(isoDepth(10, 10)).toBeGreaterThan(isoDepth(0, 0));
	});
});

describe('facing', () => {
	test('screen vectors', () => {
		expect(dirFromScreen(0, 1)).toBe('s');
		expect(dirFromScreen(1, 0)).toBe('e');
		expect(dirFromScreen(0, -1)).toBe('n');
		expect(dirFromScreen(-1, -1)).toBe('nw');
		expect(dirFromScreen(0, 0, 'w')).toBe('w');
	});

	test('world axes map to diagonal sprites', () => {
		expect(dirFromWorld(1, 0)).toBe('se');
		expect(dirFromWorld(0, 1)).toBe('sw');
		expect(dirFromWorld(1, 1)).toBe('s');
		expect(dirFromWorld(-1, -1)).toBe('n');
	});
});

describe('inputToWorld', () => {
	test('up on the keyboard walks straight up the screen', () => {
		const w = inputToWorld(0, -1);
		const s = worldToScreen(w.x, w.y);
		expect(s.x).toBeCloseTo(0);
		expect(s.y).toBeLessThan(0);
	});

	test('right walks straight right', () => {
		const w = inputToWorld(1, 0);
		const s = worldToScreen(w.x, w.y);
		expect(s.y).toBeCloseTo(0);
		expect(s.x).toBeGreaterThan(0);
	});

	test('is a unit vector in world space', () => {
		const w = inputToWorld(1, 1);
		expect(Math.hypot(w.x, w.y)).toBeCloseTo(1);
		expect(inputToWorld(0, 0)).toEqual({ x: 0, y: 0 });
	});
});
