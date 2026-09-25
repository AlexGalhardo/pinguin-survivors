import { describe, expect, it } from 'bun:test';
import {
	chainAt,
	cryoAt,
	distToSegmentSq,
	dronesAt,
	laserAt,
	missilesAt,
	novaAt,
} from '../src/logic/abilities';

describe('ability level tables (balancing §8)', () => {
	it('orbital drones: 2 drones / 4 dmg, +1 drone and +2 dmg per level', () => {
		expect(dronesAt(1)).toEqual({ count: 2, damage: 4 });
		expect(dronesAt(5)).toEqual({ count: 6, damage: 12 });
	});

	it('chain lightning: 8 dmg, 3 jumps, 2.0 s -0.15 s per level', () => {
		expect(chainAt(1)).toEqual({ damage: 8, jumps: 3, cooldown: 2 });
		const l5 = chainAt(5);
		expect(l5.damage).toBe(20);
		expect(l5.jumps).toBe(7);
		expect(l5.cooldown).toBeCloseTo(1.4);
	});

	it('plasma nova: 10 dmg, radius 60, 3.0 s', () => {
		expect(novaAt(1)).toEqual({ damage: 10, radius: 60, cooldown: 3 });
		expect(novaAt(5).cooldown).toBeCloseTo(2.2);
		expect(novaAt(5).radius).toBe(100);
	});

	it('cryo field: 1.5 dps, radius 50, 25% slow', () => {
		expect(cryoAt(1)).toEqual({ dps: 1.5, radius: 50, slow: 0.25 });
		expect(cryoAt(5).slow).toBeCloseTo(0.45);
	});

	it('homing missiles and laser', () => {
		expect(missilesAt(3)).toEqual({ count: 4, damage: 11 });
		const l = laserAt(2);
		expect(l.damage).toBe(7);
		expect(l.duration).toBeCloseTo(1.0);
		expect(l.width).toBe(8);
	});

	it('clamps levels to 1..5', () => {
		expect(dronesAt(0)).toEqual(dronesAt(1));
		expect(dronesAt(9)).toEqual(dronesAt(5));
	});

	it('distance to segment', () => {
		expect(distToSegmentSq(5, 3, 0, 0, 10, 0)).toBeCloseTo(9);
		expect(distToSegmentSq(-4, 3, 0, 0, 10, 0)).toBeCloseTo(25);
		expect(distToSegmentSq(1, 1, 0, 0, 0, 0)).toBeCloseTo(2);
	});
});
