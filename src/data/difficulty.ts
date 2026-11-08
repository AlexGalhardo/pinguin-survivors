/**
 * Difficulty levels picked before a run (P-62). Global multipliers on top of the round scaling:
 * enemy damage, HP and speed, and the fish/XP they drop. NORMAL is the balanced baseline.
 */
export const DIFFICULTIES = ['easy', 'normal', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface DifficultyMods {
	damage: number;
	hp: number;
	speed: number;
	rewards: number;
}

export const DIFFICULTY: Record<Difficulty, DifficultyMods> = {
	easy: { damage: 0.75, hp: 0.75, speed: 0.75, rewards: 0.75 },
	normal: { damage: 1, hp: 1, speed: 1, rewards: 1 },
	hard: { damage: 1.25, hp: 1.25, speed: 1.25, rewards: 1.25 },
};

/**
 * Danger 0–5 (ADR-008, SDD-005 RF-01): replaces the three global difficulties above, which stay
 * only until HeroSelect and GameScene move to Danger. D1 is the balanced baseline.
 */
export const DANGER_LEVELS = [0, 1, 2, 3, 4, 5] as const;
export type Danger = (typeof DANGER_LEVELS)[number];

export interface DangerMods {
	/** Enemy HP, damage and speed multipliers. */
	hp: number;
	dmg: number;
	speed: number;
	/** Fish and XP dropped by enemies. */
	drops: number;
	/** Extra elite/horde waves per run, drawn by seed among rounds `EXTRA_WAVES.rounds`. */
	extraWaves: number;
}

/** Initial values, to calibrate with the sim (docs/balancing-and-simulation.md). */
export const DANGER: Readonly<Record<Danger, DangerMods>> = {
	0: { hp: 0.8, dmg: 0.8, speed: 0.95, drops: 0.9, extraWaves: 0 },
	1: { hp: 1, dmg: 1, speed: 1, drops: 1, extraWaves: 0 },
	2: { hp: 1.15, dmg: 1.1, speed: 1.02, drops: 1.1, extraWaves: 1 },
	3: { hp: 1.3, dmg: 1.2, speed: 1.05, drops: 1.2, extraWaves: 1 },
	4: { hp: 1.5, dmg: 1.35, speed: 1.08, drops: 1.35, extraWaves: 3 },
	5: { hp: 1.75, dmg: 1.5, speed: 1.12, drops: 1.5, extraWaves: 3 },
};

export const EXTRA_WAVES = {
	/** Inclusive round range the extra waves are drawn from. */
	rounds: [4, 19],
	/** Elite wave: share of elites ×this. Horde wave: spawn rate ×this. */
	eliteMul: 3,
	hordeMul: 2,
} as const;

/** Highest value of `progress.hero[h].dangerUnlocked` (beating D5 → 6). */
export const MAX_DANGER_UNLOCKED = 6;
