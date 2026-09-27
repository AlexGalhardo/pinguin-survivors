import { DIFFICULTIES, DIFFICULTY, type Difficulty, type DifficultyMods } from '../data/difficulty';

export function difficultyMods(d: Difficulty | undefined): DifficultyMods {
	return DIFFICULTY[d ?? 'normal'];
}

/** Whole fish after the reward multiplier; fractions become a chance of one extra fish. */
export function scaleFish(fish: number, mods: DifficultyMods, roll: number): number {
	const raw = fish * mods.rewards;
	const whole = Math.floor(raw);
	return whole + (roll < raw - whole ? 1 : 0);
}

export function nextDifficulty(d: Difficulty, dir: -1 | 1): Difficulty {
	const i = DIFFICULTIES.indexOf(d);
	return DIFFICULTIES[(i + dir + DIFFICULTIES.length) % DIFFICULTIES.length] as Difficulty;
}
