import { describe, expect, it } from 'bun:test';
import { isWaveComplete, waveSchedule } from '../src/logic/wave';

describe('wave schedule', () => {
	it('plain waves have no elites or boss', () => {
		expect(waveSchedule(1)).toEqual({ wave: 1, duration: 20, eliteTimes: [], bossTime: null });
	});

	it('every 5th wave has elites', () => {
		expect(waveSchedule(5).eliteTimes).toEqual([3]);
		expect(waveSchedule(20).eliteTimes).toEqual([3, 9, 15]);
	});

	it('every 10th wave has a boss at 5 s', () => {
		expect(waveSchedule(10).bossTime).toBe(5);
		expect(waveSchedule(15).bossTime).toBeNull();
	});

	it('elite times stay inside the wave', () => {
		const s = waveSchedule(100);
		for (const t of s.eliteTimes) expect(t).toBeLessThanOrEqual(s.duration - 2);
	});

	it('boss waves only end when the boss is dead', () => {
		expect(isWaveComplete(0, true)).toBe(false);
		expect(isWaveComplete(0, false)).toBe(true);
		expect(isWaveComplete(3, false)).toBe(false);
	});
});
