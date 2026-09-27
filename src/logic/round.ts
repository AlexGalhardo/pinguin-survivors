import { ROUNDS } from '../data/rounds';

export type EliteTier = 'purple' | 'orange';

export function isBossRound(round: number): boolean {
	return round % ROUNDS.bossEvery === 0;
}

/** Seconds of a round; boss rounds use the boss time limit instead. */
export function roundDuration(round: number): number {
	if (isBossRound(round)) return ROUNDS.bossTimeLimit;
	return Math.min(ROUNDS.firstDuration + ROUNDS.durationStep * (round - 1), ROUNDS.maxDuration);
}

/** 0-based boss cycle: rounds 1–10 → 0, 11–20 → 1… */
export function cycle(round: number): number {
	return Math.floor((round - 1) / ROUNDS.bossEvery);
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

export function hpMul(round: number): number {
	const s = ROUNDS.scaling;
	return (1 + s.hpPerRound * (round - 1)) * s.hpPerCycle ** cycle(round);
}

export function dmgMul(round: number): number {
	const s = ROUNDS.scaling;
	return (1 + s.dmgPerRound * (round - 1)) * s.dmgPerCycle ** cycle(round);
}

/** Boss HP grows per cycle as the rotating pool comes back stronger (round 10 → ×1, 20 → ×1.6). */
export function bossHpMul(round: number): number {
	return ROUNDS.scaling.bossHpPerCycle ** cycle(round);
}

/** Enemies per second. */
export function spawnRate(round: number): number {
	const s = ROUNDS.scaling;
	return Math.min(s.spawnBase + s.spawnPerRound * round, s.spawnMax);
}
