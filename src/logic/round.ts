import { ROUNDS } from '../data/rounds';

export type EliteTier = 'purple' | 'orange';

export function isBossRound(round: number): boolean {
	return round % ROUNDS.bossEvery === 0;
}

/** Seconds of a round (no cap); a boss round gives one more minute per boss: 5 → 2 min, 10 → 3 min… */
export function roundDuration(round: number): number {
	if (isBossRound(round))
		return ROUNDS.bossTimeLimit + ROUNDS.bossTimeStep * (round / ROUNDS.bossEvery - 1);
	return ROUNDS.firstDuration + ROUNDS.durationStep * (round - 1);
}

/** 0-based biome block: rounds 1–10 → 0, 11–20 → 1… (biome, scaling per cycle). */
export function cycle(round: number): number {
	return Math.floor((round - 1) / ROUNDS.biomeRounds);
}

/** The boss met halfway through a biome block (rounds 5, 15, 25…). */
export function isMidBoss(round: number): boolean {
	return isBossRound(round) && round % ROUNDS.biomeRounds !== 0;
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

/** 0-based endless loop: rounds 1–30 → 0, 31–60 → 1… (the biomes start over, harder). */
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

/** Boss HP grows per cycle as the rotating pool comes back stronger (round 10 → ×1, 20 → ×1.6). */
export function bossHpMul(round: number): number {
	return (
		ROUNDS.scaling.bossHpPerCycle ** cycle(round) * (isMidBoss(round) ? ROUNDS.midBossHp : 1)
	);
}

/** Enemies per second. */
export function spawnRate(round: number): number {
	const s = ROUNDS.scaling;
	const rate = Math.min(s.spawnBase + s.spawnPerRound * round, s.spawnMax);
	return isBossRound(round) ? rate * s.bossSpawnMul : rate;
}
