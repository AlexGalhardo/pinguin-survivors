import { GAME_SPEEDS, type GameSpeed } from '../config/constants';

export function nextSpeed(current: GameSpeed): GameSpeed {
	const i = GAME_SPEEDS.indexOf(current);
	return GAME_SPEEDS[(i + 1) % GAME_SPEEDS.length] as GameSpeed;
}
