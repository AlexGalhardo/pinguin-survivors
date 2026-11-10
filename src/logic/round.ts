import { BOSS_ROUNDS } from '../data/enemies';
import { ROUNDS } from '../data/rounds';

export type EliteTier = 'purple' | 'orange';

export function isBossRound(round: number): boolean {
	return round % ROUNDS.bossEvery === 0;
}

/** Seconds of a round; a boss round gives one more minute per boss (5 → 2 min, 10 → 3 min…) up to `bossTimeMax`. */
export function roundDuration(round: number): number {
	if (isBossRound(round))
		return Math.min(
			ROUNDS.bossTimeMax,
			ROUNDS.bossTimeLimit + ROUNDS.bossTimeStep * (round / ROUNDS.bossEvery - 1),
		);
	return ROUNDS.firstDuration + ROUNDS.durationStep * (round - 1);
}

/** 0-based biome block: rounds 1–10 → 0, 11–20 → 1… (biome, scaling per cycle). */
export function cycle(round: number): number {
	return Math.floor((round - 1) / ROUNDS.biomeRounds);
}

export function isEliteRound(round: number): boolean {
	return round % ROUNDS.eliteEvery === 0 && !isBossRound(round);
}

/** Elite tiers that may spawn this round (empty on normal and boss rounds). */
export function eliteTiers(round: number): EliteTier[] {
	if (!isEliteRound(round)) return [];
	return round >= ROUNDS.orangeFrom ? ['purple', 'orange'] : ['purple'];
}

/** Rolls the elite tier of one spawn given a uniform roll in [0, 1). */
export function rollElite(round: number, roll: number): EliteTier | null {
	const tiers = eliteTiers(round);
	if (tiers.includes('orange') && roll < ROUNDS.orangeShare) return 'orange';
	if (tiers.includes('purple') && roll < ROUNDS.orangeShare + ROUNDS.purpleShare) return 'purple';
	return null;
}

/** 0-based endless loop: rounds 1–50 → 0, 51–100 → 1… (the biomes start over, harder). */
export function loop(round: number): number {
	return Math.floor((round - 1) / ROUNDS.scaling.loopRounds);
}

export function hpMul(round: number): number {
	const s = ROUNDS.scaling;
	return (
		(1 + s.hpPerRound * (round - 1)) * s.hpPerCycle ** cycle(round) * s.hpPerLoop ** loop(round)
	);
}

export function dmgMul(round: number): number {
	const s = ROUNDS.scaling;
	return (
		(1 + s.dmgPerRound * (round - 1)) *
		s.dmgPerCycle ** cycle(round) *
		s.dmgPerLoop ** loop(round)
	);
}

/** Enemy speed multiplier for the round (grows per endless loop). */
export function speedMul(round: number): number {
	return ROUNDS.scaling.speedPerLoop ** loop(round);
}

/** Endless boss HP multiplier over its `BOSS_HP`: 1 up to round 50, then `endlessBossStep` per boss (55 -> x1.2, 60 -> x1.44...). */
export function bossHpMul(round: number): number {
	const past = Math.max(0, Math.floor(round / ROUNDS.bossEvery) - BOSS_ROUNDS.length);
	return ROUNDS.scaling.endlessBossStep ** past;
}

/** Enemies per second. */
export function spawnRate(round: number): number {
	const s = ROUNDS.scaling;
	const rate = Math.min(s.spawnBase + s.spawnPerRound * round, s.spawnMax);
	return isBossRound(round) ? rate * s.bossSpawnMul : rate;
}
