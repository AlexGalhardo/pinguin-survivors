import { ECONOMY } from '../data/economy';

export type MagnetBonus = { radius: number; pull: number };

/**
 * Whether a drop at distance `d` starts being pulled and how fast. XP orbs and Fish get the
 * Magnetic item's extra radius and speed; every other drop (gear, potions, packs) follows the
 * plain pickup range, so the magnet never leaves equipment on the floor.
 */
export function pickupPull(
	kind: string,
	d: number,
	pickupRange: number,
	magnet: MagnetBonus,
	vacuum: boolean,
): { start: boolean; speed: number } {
	const boosted = kind === 'xp' || kind === 'fish';
	return {
		start: vacuum || d < pickupRange + (boosted ? magnet.radius : 0),
		speed: ECONOMY.magnetSpeed * (vacuum ? 3 : 1) * (boosted ? magnet.pull : 1),
	};
}

/** Longest the end-of-round fly-in lasts (motion seconds); what is still on the ground then is banked directly. */
export const ROUND_FLUSH_MAX = 2;

/** The round-end fly-in is over when nothing is left on the ground or the time cap is reached. */
export const roundFlushDone = (anyLeft: boolean, elapsed: number): boolean =>
	!anyLeft || elapsed >= ROUND_FLUSH_MAX;
