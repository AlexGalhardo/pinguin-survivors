import { describe, expect, test } from 'bun:test';
import { boomerangDistance, scaledCount } from '../src/logic/boomerang';

describe('boomerang', () => {
	test('goes out to range and comes back', () => {
		expect(boomerangDistance(0, 200, 100)).toBe(0);
		expect(boomerangDistance(1, 200, 100)).toBe(100);
		expect(boomerangDistance(2, 200, 100)).toBe(200);
		expect(boomerangDistance(3, 200, 100)).toBe(100);
		expect(boomerangDistance(4, 200, 100)).toBe(0);
		expect(boomerangDistance(4.01, 200, 100)).toBe(-1);
	});

	test('count grows with level', () => {
		expect(scaledCount(1, 0.5, 1)).toBe(1);
		expect(scaledCount(1, 0.5, 3)).toBe(2);
		expect(scaledCount(1, 0.5, 5)).toBe(3);
		expect(scaledCount(3, 1, 5)).toBe(7);
	});
});
