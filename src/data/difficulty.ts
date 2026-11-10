/**
 * Difficulty (ADR-025, SDD-019): Easy, Normal and Hard, picked per run. Hard unlocks per hero by
 * beating the round 20 boss on Normal. Replaces the Danger 0–5 of ADR-008.
 */
export const DIFFICULTY_LEVELS = [0, 1, 2] as const;
export type Difficulty = (typeof DIFFICULTY_LEVELS)[number];

export interface DifficultyMods {
	/** Enemy HP and damage multipliers (bosses included). */
	hp: number;
	dmg: number;
	/** Neutral hooks (1): enemy speed, and Fish/XP dropped by enemies. */
	speed: number;
	drops: number;
	/** Neutral hook (0): extra elite/horde waves per run, drawn by seed among rounds `EXTRA_WAVES.rounds`. */
	extraWaves: number;
}

export const DIFFICULTY: Readonly<Record<Difficulty, DifficultyMods>> = {
	0: { hp: 0.5, dmg: 0.5, speed: 1, drops: 1, extraWaves: 0 },
	1: { hp: 1, dmg: 1, speed: 1, drops: 1, extraWaves: 0 },
	2: { hp: 2, dmg: 2, speed: 1, drops: 1, extraWaves: 0 },
};

export const EXTRA_WAVES = {
	/** Inclusive round range the extra waves are drawn from. */
	rounds: [4, 19],
	/** Elite wave: share of elites ×this. Horde wave: spawn rate ×this. */
	eliteMul: 3,
	hordeMul: 2,
} as const;

/** Highest value of `progress.hero[h].difficultyUnlocked` (1 = Easy and Normal, 2 = Hard open, 3 = Hard beaten). */
export const MAX_DIFFICULTY_UNLOCKED = 3;
