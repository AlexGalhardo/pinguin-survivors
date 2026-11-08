import { describe, expect, test } from 'bun:test';
import {
	depthOf,
	dirFromWorld,
	inputToWorld,
	screenToWorld,
	worldToScreen,
} from '../src/logic/projection';

describe('top-down projection', () => {
	test('world units are screen pixels and height lifts on screen', () => {
		expect(worldToScreen(32, 48)).toEqual({ x: 32, y: 48 });
		expect(worldToScreen(10, 10, 5)).toEqual({ x: 10, y: 5 });
	});

	test('screenToWorld is the identity', () => {
		expect(screenToWorld(-7, 123)).toEqual({ x: -7, y: 123 });
	});

	test('depth is y: larger y draws on top', () => {
		expect(depthOf(500, 10)).toBeGreaterThan(depthOf(-500, 0));
	});
});

describe('facing', () => {
	test('8 directions from the movement vector', () => {
		expect(dirFromWorld(0, 1)).toBe('s');
		expect(dirFromWorld(1, 1)).toBe('se');
		expect(dirFromWorld(1, 0)).toBe('e');
		expect(dirFromWorld(1, -1)).toBe('ne');
		expect(dirFromWorld(0, -1)).toBe('n');
		expect(dirFromWorld(-1, -1)).toBe('nw');
		expect(dirFromWorld(-1, 0)).toBe('w');
		expect(dirFromWorld(-1, 1)).toBe('sw');
	});

	test('zero vector keeps the fallback', () => {
		expect(dirFromWorld(0, 0, 'w')).toBe('w');
	});
});

describe('inputToWorld', () => {
	test('no rotation: up is -y, right is +x', () => {
		expect(inputToWorld(0, -1)).toEqual({ x: 0, y: -1 });
		expect(inputToWorld(1, 0)).toEqual({ x: 1, y: 0 });
	});

	test('diagonals are normalised and zero stays zero', () => {
		const d = inputToWorld(1, 1);
		expect(Math.hypot(d.x, d.y)).toBeCloseTo(1);
		expect(inputToWorld(0, 0)).toEqual({ x: 0, y: 0 });
	});
});
