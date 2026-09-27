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
