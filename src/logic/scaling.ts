import { WAVE } from '../data/waves';

/** Wave duration in seconds: min(20 + 5(N-1), 60). */
export function waveDuration(wave: number): number {
	return Math.min(WAVE.baseDuration + WAVE.durationPerWave * (wave - 1), WAVE.maxDuration);
}

/** Enemies per second: 1.2 + 0.25(N-1). */
export function spawnRate(wave: number): number {
	return WAVE.baseSpawnRate + WAVE.spawnRatePerWave * (wave - 1);
}

/** (1 + 0.15(N-1)) * 1.04^(N-1) */
export function hpMul(wave: number): number {
	return (1 + WAVE.hpLinear * (wave - 1)) * WAVE.hpExp ** (wave - 1);
}

/** (1 + 0.08(N-1)) * 1.02^(N-1) */
export function dmgMul(wave: number): number {
	return (1 + WAVE.dmgLinear * (wave - 1)) * WAVE.dmgExp ** (wave - 1);
}

/** min(1 + 0.02(N-1), 1.6) */
export function spdMul(wave: number): number {
	return Math.min(1 + WAVE.spdLinear * (wave - 1), WAVE.spdMax);
}

/** Extra HP multiplier from spawns that did not fit under the alive cap. */
export function overflowHpMul(excess: number): number {
	return 1 + Math.max(0, excess) / WAVE.overflowDivisor;
}

/** Elites in a wave: 1 on multiples of 5, +1 for every 10 waves. */
export function elitesForWave(wave: number): number {
	if (wave % WAVE.eliteEvery !== 0) return 0;
	return 1 + Math.floor(wave / WAVE.bossEvery);
}

export function isBossWave(wave: number): boolean {
	return wave % WAVE.bossEvery === 0;
}
