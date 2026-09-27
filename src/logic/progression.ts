import { ECONOMY } from '../data/economy';

/** XP needed to go from `level` to `level + 1`. */
export function xpToNext(level: number): number {
	const c = ECONOMY.xpCurve;
	return Math.floor(c.base * level ** c.exponent + c.flat);
}

export interface LevelState {
	level: number;
	/** XP inside the current level. */
	xp: number;
}

/** Adds XP, rolling over levels up to the cap. Returns how many levels were gained. */
export function addXp(state: LevelState, amount: number): number {
	let gained = 0;
	state.xp += amount;
	while (state.level < ECONOMY.maxLevel && state.xp >= xpToNext(state.level)) {
		state.xp -= xpToNext(state.level);
		state.level++;
		gained++;
	}
	if (state.level >= ECONOMY.maxLevel) state.xp = 0;
	return gained;
}

/** Unspent stat points: 1 per level above 1 minus the ones already spent (P-25). */
export function freePoints(level: number, spent: Record<string, number>): number {
	const used = Object.values(spent).reduce((a, b) => a + b, 0);
	return Math.max(0, level - 1 - used);
}

export function orbXp(baseXp: number, round: number): number {
	return baseXp * (1 + ECONOMY.xpPerRound * round);
}

export function roundEndFish(round: number): number {
	return ECONOMY.fish.roundEndBase + Math.floor(round / 2);
}
