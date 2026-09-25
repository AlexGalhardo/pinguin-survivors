import {
	ELITE_SCHEDULE,
	MODIFIER_RULES,
	WAVE,
	WAVE_MODIFIERS,
	type WaveModifier,
} from '../data/waves';
import type { Rng } from './rng';
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

/** Rolls the wave modifier (null most of the time; never before wave 6 or on boss waves). */
export function rollWaveModifier(wave: number, rng: Rng): WaveModifier {
	if (wave < MODIFIER_RULES.fromWave || isBossWave(wave)) return null;
	if (!rng.chance(MODIFIER_RULES.chance)) return null;
	return rng.pick(['swarm', 'armored', 'fast'] as const);
}

/** Multipliers of a modifier (identity for null). */
export function modifierMul(mod: WaveModifier): { spawn: number; hp: number; spd: number } {
	return mod ? WAVE_MODIFIERS[mod] : { spawn: 1, hp: 1, spd: 1 };
}
