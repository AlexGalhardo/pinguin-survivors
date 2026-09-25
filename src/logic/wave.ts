import { ELITE_SCHEDULE, WAVE } from '../data/waves';
import { elitesForWave, isBossWave, waveDuration } from './scaling';

export interface WaveSchedule {
	wave: number;
	duration: number;
	/** Seconds after the start when each elite spawns. */
	eliteTimes: number[];
	/** Seconds after the start when the boss spawns (null if none). */
	bossTime: number | null;
}

export function waveSchedule(wave: number): WaveSchedule {
	const duration = waveDuration(wave);
	const eliteTimes = Array.from({ length: elitesForWave(wave) }, (_, i) =>
		Math.min(ELITE_SCHEDULE.first + ELITE_SCHEDULE.every * i, duration - 2),
	);
	return { wave, duration, eliteTimes, bossTime: isBossWave(wave) ? WAVE.bossDelay : null };
}

/** A wave ends when its timer runs out and, on boss waves, the boss is dead. */
export function isWaveComplete(remaining: number, bossPending: boolean): boolean {
	return remaining <= 0 && !bossPending;
}
