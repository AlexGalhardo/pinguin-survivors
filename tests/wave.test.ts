import { describe, expect, it } from 'bun:test';
import { WAVE } from '../src/data/waves';
import { bossTimeLeft, isWaveComplete, waveSchedule } from '../src/logic/wave';

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

describe('wave modifiers (beta)', () => {
	it('never rolls before wave 6 or on boss waves, and sometimes rolls later', async () => {
		const { rollWaveModifier, modifierMul } = await import('../src/logic/wave');
		const { Rng } = await import('../src/logic/rng');
		const rng = new Rng(3);
		for (let i = 0; i < 200; i++) {
			expect(rollWaveModifier(5, rng)).toBeNull();
			expect(rollWaveModifier(20, rng)).toBeNull();
		}
		let rolled = 0;
		for (let i = 0; i < 1000; i++) if (rollWaveModifier(7, rng)) rolled++;
		expect(rolled).toBeGreaterThan(180);
		expect(rolled).toBeLessThan(320);
		expect(modifierMul(null)).toEqual({ spawn: 1, hp: 1, spd: 1 });
		expect(modifierMul('swarm').spawn).toBeGreaterThan(1);
	});
});

describe('boss time limit', () => {
	it('counts down from the limit and floors at 0', () => {
		expect(bossTimeLeft(0)).toBe(WAVE.bossTimeLimit);
		expect(bossTimeLeft(120)).toBe(WAVE.bossTimeLimit - 120);
		expect(bossTimeLeft(WAVE.bossTimeLimit + 5)).toBe(0);
	});

	it('the limit is 5 minutes', () => {
		expect(WAVE.bossTimeLimit).toBe(300);
	});
});
