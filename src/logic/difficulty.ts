import type { HeroId } from '../config/constants';
import {
	DANGER,
	type Danger,
	type DangerMods,
	EXTRA_WAVES,
	MAX_DANGER_UNLOCKED,
} from '../data/difficulty';
import { Rng } from './rng';
import type { SaveData } from './save';

/** Whole drops after the Danger multiplier; fractions become a chance of one extra (`roll` in [0, 1)). */
export function scaleDrops(count: number, mul: number, roll: number): number {
	const raw = count * mul;
	const whole = Math.floor(raw);
	return whole + (roll < raw - whole ? 1 : 0);
}

export function dangerMods(d: Danger): DangerMods {
	return DANGER[d];
}

export interface ExtraWave {
	round: number;
	kind: 'elite' | 'horde';
}

/** Rounds (distinct, by seed) that get an elite or horde wave in this run, sorted by round. */
export function extraWaves(seed: number, d: Danger): ExtraWave[] {
	const [min, max] = EXTRA_WAVES.rounds;
	const rng = new Rng((seed ^ 0x9e3779b9) + d);
	const rounds = new Set<number>();
	while (rounds.size < DANGER[d].extraWaves) rounds.add(rng.int(min, max));
	return [...rounds]
		.sort((a, b) => a - b)
		.map((round) => ({ round, kind: rng.chance(0.5) ? 'elite' : 'horde' }));
}

/** Highest Danger the hero can pick (D0 is always available). */
export function maxSelectableDanger(save: SaveData, hero: HeroId): Danger {
	return Math.min(5, save.progress.hero[hero].dangerUnlocked) as Danger;
}

/** Beating the round 20 boss on Danger `d` unlocks `d + 1` for that hero only. */
export function unlockDanger(save: SaveData, hero: HeroId, d: Danger): void {
	const stats = save.progress.hero[hero];
	if (d > stats.dangerUnlocked) return;
	stats.dangerUnlocked = Math.min(MAX_DANGER_UNLOCKED, Math.max(stats.dangerUnlocked, d + 1));
}

/** Keeps the best round reached on a Danger for the hero. */
export function recordBestRound(save: SaveData, hero: HeroId, d: Danger, round: number): void {
	const best = save.bestRoundByDanger[hero];
	best[d] = Math.max(best[d] ?? 0, round);
}
