import { describe, expect, test } from 'bun:test';
import { BOSS_ROUNDS, ENEMIES } from '../src/data/enemies';
import { ROUNDS } from '../src/data/rounds';
import {
	bossHpMul,
	cycle,
	dmgMul,
	eliteTiers,
	hpMul,
	isBossRound,
	loop,
	rollElite,
	roundDuration,
	spawnRate,
	speedMul,
} from '../src/logic/round';

describe('round timing (P-14)', () => {
	test('30s, +5s per round, no cap', () => {
		expect([1, 2, 3, 8, 9, 14, 21, 41].map(roundDuration)).toEqual([
			30, 35, 40, 65, 70, 95, 130, 230,
		]);
	});

	test('boss every 5 rounds: 2 minutes at round 5, one more minute per boss', () => {
		expect([5, 10, 15, 20].every(isBossRound)).toBe(true);
		expect(isBossRound(11)).toBe(false);
		expect([5, 10, 15, 20].map(roundDuration)).toEqual([120, 180, 240, 300]);
	});

	test('boss time limit caps at 10 minutes (boss 45 onward)', () => {
		const rounds = [5, 10, 40, 45, 50, 55, 100];
		expect(rounds.map(roundDuration)).toEqual([120, 180, 540, 600, 600, 600, 600]);
	});

	test('boss HP comes from the BOSS_HP table; the endless steps it by endlessBossStep per boss', () => {
		const expected = [3000, 4000, 5500, 7500, 10000, 12500, 17000, 22000, 27000, 33000];
		BOSS_ROUNDS.forEach((id, i) => {
			expect(ENEMIES[id].hp * bossHpMul((i + 1) * 5)).toBe(expected[i] as number);
		});
		expect([55, 60].map(bossHpMul)).toEqual([1.2, 1.2 ** 2]);
		expect(bossHpMul(51)).toBe(1);
	});

	test('biomes stay in blocks of 10', () => {
		expect([10, 11, 20].map(cycle)).toEqual([0, 1, 1]);
	});
});

describe('elites (P-16)', () => {
	test('purple on multiples of 3, orange too after the first boss, never on boss rounds', () => {
		expect(eliteTiers(1)).toEqual([]);
		expect(eliteTiers(3)).toEqual(['purple']);
		expect(eliteTiers(9)).toEqual(['purple']);
		expect(eliteTiers(12)).toEqual(['purple', 'orange']);
		expect(eliteTiers(30)).toEqual([]);
	});

	test('roll shares', () => {
		expect(rollElite(4, 0)).toBeNull();
		expect(rollElite(6, 0.01)).toBe('purple');
		expect(rollElite(12, 0.01)).toBe('orange');
		expect(rollElite(12, 0.1)).toBe('purple');
		expect(rollElite(12, 0.5)).toBeNull();
	});
});

describe('scaling', () => {
	test('cycles of 10 rounds', () => {
		expect([1, 10, 11, 20, 21].map(cycle)).toEqual([0, 0, 1, 1, 2]);
	});

	test('multipliers grow and jump at each cycle', () => {
		const k = ROUNDS.scaling;
		expect(hpMul(1)).toBe(1);
		expect(hpMul(11)).toBeCloseTo((1 + k.hpPerRound * 10) * k.hpPerCycle);
		expect(dmgMul(1)).toBe(1);
		expect(dmgMul(10)).toBeLessThan(dmgMul(11));
	});

	test('each 50-round loop multiplies again (endless)', () => {
		const k = ROUNDS.scaling;
		expect([1, 50, 51, 100, 101].map(loop)).toEqual([0, 0, 1, 1, 2]);
		const plain = (r: number) => (1 + k.hpPerRound * (r - 1)) * k.hpPerCycle ** cycle(r);
		expect(hpMul(51)).toBeCloseTo(plain(51) * k.hpPerLoop);
		expect(dmgMul(51) / dmgMul(50)).toBeGreaterThan(k.dmgPerLoop);
	});

	test('spawn rate is capped and slower on boss rounds', () => {
		const k = ROUNDS.scaling;
		expect(spawnRate(1)).toBeCloseTo(k.spawnBase + k.spawnPerRound);
		expect(spawnRate(99)).toBe(k.spawnMax);
		expect(spawnRate(100)).toBeCloseTo(k.spawnMax * k.bossSpawnMul);
	});
});

test('speed multiplier hook per endless loop (off by default)', () => {
	expect(speedMul(1)).toBe(1);
	expect(speedMul(31)).toBeCloseTo(ROUNDS.scaling.speedPerLoop);
});
