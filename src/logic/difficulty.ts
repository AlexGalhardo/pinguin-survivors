import type { HeroId } from '../config/constants';
import {
	DIFFICULTY,
	type Difficulty,
	type DifficultyMods,
	EXTRA_WAVES,
	MAX_DIFFICULTY_UNLOCKED,
} from '../data/difficulty';
import { Rng } from './rng';
import type { SaveData } from './save';

/** Whole drops after the Difficulty multiplier; fractions become a chance of one extra (`roll` in [0, 1)). */
export function scaleDrops(count: number, mul: number, roll: number): number {
	const raw = count * mul;
	const whole = Math.floor(raw);
	return whole + (roll < raw - whole ? 1 : 0);
}

export function difficultyMods(d: Difficulty): DifficultyMods {
	return DIFFICULTY[d];
}

export interface ExtraWave {
	round: number;
	kind: 'elite' | 'horde';
}

/** Rounds (distinct, by seed) that get an elite or horde wave in this run, sorted by round. */
export function extraWaves(seed: number, d: Difficulty): ExtraWave[] {
	const [min, max] = EXTRA_WAVES.rounds;
	const rng = new Rng((seed ^ 0x9e3779b9) + d);
	const rounds = new Set<number>();
	while (rounds.size < DIFFICULTY[d].extraWaves) rounds.add(rng.int(min, max));
	return [...rounds]
		.sort((a, b) => a - b)
		.map((round) => ({ round, kind: rng.chance(0.5) ? 'elite' : 'horde' }));
}

/** Highest Difficulty the hero can pick (Easy and Normal are always available). */
export function maxSelectableDifficulty(save: SaveData, hero: HeroId): Difficulty {
	return Math.min(2, save.progress.hero[hero].difficultyUnlocked) as Difficulty;
}

/** Beating the round 20 boss on Difficulty `d` unlocks `d + 1` for that hero only. */
export function unlockDifficulty(save: SaveData, hero: HeroId, d: Difficulty): void {
	const stats = save.progress.hero[hero];
	if (d > stats.difficultyUnlocked) return;
	stats.difficultyUnlocked = Math.min(
		MAX_DIFFICULTY_UNLOCKED,
		Math.max(stats.difficultyUnlocked, d + 1),
	);
}

/** Keeps the best round reached on a Difficulty for the hero. */
export function recordBestRound(save: SaveData, hero: HeroId, d: Difficulty, round: number): void {
	const best = save.bestRoundByDifficulty[hero];
	best[d] = Math.max(best[d] ?? 0, round);
}
