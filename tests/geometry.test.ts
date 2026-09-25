import { describe, expect, it } from 'bun:test';
import { angleDiff, inArc, spreadAngles } from '../src/logic/geometry';

describe('geometry', () => {
	it('angleDiff wraps around', () => {
		expect(angleDiff(0.1, -0.1)).toBeCloseTo(0.2);
		expect(angleDiff(Math.PI - 0.1, -Math.PI + 0.1)).toBeCloseTo(-0.2);
	});

	it('inArc checks distance and angle (120° arc facing +X)', () => {
		const arc = (120 * Math.PI) / 180;
		expect(inArc(0, 0, 0, arc, 45, 30, 0)).toBe(true);
		expect(inArc(0, 0, 0, arc, 45, 30, 30)).toBe(true);
		expect(inArc(0, 0, 0, arc, 45, 10, 30)).toBe(false);
		expect(inArc(0, 0, 0, arc, 45, -30, 0)).toBe(false);
		expect(inArc(0, 0, 0, arc, 45, 50, 0)).toBe(false);
		expect(inArc(0, 0, 0, arc, 45, 50, 0, 8)).toBe(true);
	});

	it('spreads projectiles symmetrically', () => {
		expect(spreadAngles(1, 1, 0.2)).toEqual([1]);
		const a = spreadAngles(0, 3, 0.2);
		expect(a[0]).toBeCloseTo(-0.2);
		expect(a[1]).toBeCloseTo(0);
		expect(a[2]).toBeCloseTo(0.2);
	});
});
