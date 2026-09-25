import { describe, expect, it } from 'bun:test';
import { computeView, computeZoom } from '../src/logic/viewport';

describe('computeZoom', () => {
	it('uses the largest integer zoom that fits 480x270', () => {
		expect(computeZoom(1920, 1080)).toBe(4);
		expect(computeZoom(1366, 768)).toBe(2);
		expect(computeZoom(2560, 1440)).toBe(5);
		expect(computeZoom(1440, 810)).toBe(3);
	});

	it('is limited by the smaller axis', () => {
		expect(computeZoom(3000, 300)).toBe(1);
		expect(computeZoom(500, 2000)).toBe(1);
	});

	it('never goes below 1', () => {
		expect(computeZoom(200, 100)).toBe(1);
	});
});

describe('computeView', () => {
	it('returns the visible logical size', () => {
		expect(computeView(1366, 768)).toEqual({ zoom: 2, width: 683, height: 384 });
		expect(computeView(1920, 1080)).toEqual({ zoom: 4, width: 480, height: 270 });
	});
});
