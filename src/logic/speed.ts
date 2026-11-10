import { GAME_SPEEDS, type GameSpeed } from '../config/constants';

export function nextSpeed(current: GameSpeed): GameSpeed {
	const i = GAME_SPEEDS.indexOf(current);
	return GAME_SPEEDS[(i + 1) % GAME_SPEEDS.length] as GameSpeed;
}

/** Time multipliers of a game speed (SDD-018): `motion` drives movement and attacks, `clock` the round timer. */
export interface SpeedFactors {
	motion: number;
	clock: number;
}

export function speedFactors(speed: GameSpeed): SpeedFactors {
	return { motion: 2 * speed, clock: speed };
}

/** Saved value → a valid speed; the old 1-4 scale had 3x/4x, which now clamp to the top speed. */
export function parseGameSpeed(value: unknown, fallback: GameSpeed): GameSpeed {
	const found = GAME_SPEEDS.find((v) => v === value);
	if (found !== undefined) return found;
	return typeof value === 'number' && value > 2 ? 2 : fallback;
}
