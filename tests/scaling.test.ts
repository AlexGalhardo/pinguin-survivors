import { describe, expect, it } from 'bun:test';
import {
	dmgMul,
	elitesForWave,
	hpMul,
	isBossWave,
	overflowHpMul,
	spawnRate,
	spdMul,
	waveDuration,
} from '../src/logic/scaling';

describe('wave scaling (balancing §1)', () => {
	it('duration grows 5 s per wave up to 60 s', () => {
		expect(waveDuration(1)).toBe(20);
		expect(waveDuration(5)).toBe(40);
		expect(waveDuration(9)).toBe(60);
		expect(waveDuration(50)).toBe(60);
	});

	it('spawn rate grows linearly', () => {
		expect(spawnRate(1)).toBeCloseTo(1.2);
		expect(spawnRate(11)).toBeCloseTo(3.7);
	});

	it('hp multiplier matches the documented checkpoints', () => {
		expect(hpMul(1)).toBe(1);
		expect(hpMul(10)).toBeCloseTo(3.3, 1);
		expect(hpMul(20)).toBeCloseTo(8.1, 1);
		expect(hpMul(40)).toBeCloseTo(32, 0);
	});

	it('damage multiplier matches the documented checkpoints', () => {
		expect(dmgMul(1)).toBe(1);
		expect(dmgMul(10)).toBeCloseTo(2.1, 1);
		expect(dmgMul(20)).toBeCloseTo(3.7, 1);
	});

	it('speed multiplier is capped at 1.6', () => {
		expect(spdMul(1)).toBe(1);
		expect(spdMul(11)).toBeCloseTo(1.2);
		expect(spdMul(100)).toBe(1.6);
	});

	it('converts overflow above the cap into HP', () => {
		expect(overflowHpMul(0)).toBe(1);
		expect(overflowHpMul(150)).toBeCloseTo(1.5);
		expect(overflowHpMul(-5)).toBe(1);
	});

	it('schedules elites and bosses', () => {
		expect(elitesForWave(4)).toBe(0);
		expect(elitesForWave(5)).toBe(1);
		expect(elitesForWave(10)).toBe(2);
		expect(elitesForWave(15)).toBe(2);
		expect(elitesForWave(20)).toBe(3);
		expect(isBossWave(10)).toBe(true);
		expect(isBossWave(15)).toBe(false);
	});
});
