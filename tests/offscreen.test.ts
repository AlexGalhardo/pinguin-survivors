import { describe, expect, test } from 'bun:test';
import { offscreenArrow } from '../src/logic/offscreen';

const view = { x: 0, y: 0, width: 960, height: 540 };

describe('offscreenArrow', () => {
	test('nothing to point at while the target is on screen', () => {
		expect(offscreenArrow({ x: 480, y: 270 }, view)).toBeNull();
		expect(offscreenArrow({ x: 0, y: 540 }, view)).toBeNull();
	});

	test('sits on the edge the target left through and points at it', () => {
		const right = offscreenArrow({ x: 3000, y: 270 }, view);
		expect(right?.x).toBeCloseTo(0.94);
		expect(right?.y).toBeCloseTo(0.5);
		expect(right?.angle).toBeCloseTo(0);
		const up = offscreenArrow({ x: 480, y: -900 }, view);
		expect(up?.x).toBeCloseTo(0.5);
		expect(up?.y).toBeCloseTo(0.06);
		expect(up?.angle).toBeCloseTo(-Math.PI / 2);
	});

	test('a diagonal target stays inside the inset on both axes', () => {
		const a = offscreenArrow({ x: -5000, y: 4000 }, view, 0.1);
		expect(a).not.toBeNull();
		expect(a?.x).toBeGreaterThanOrEqual(0.1 - 1e-9);
		expect(a?.y).toBeLessThanOrEqual(0.9 + 1e-9);
		expect(Math.min(a?.x ?? 1, 1 - (a?.y ?? 0))).toBeCloseTo(0.1);
	});
});
