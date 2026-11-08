import { ACHIEVEMENTS } from './achievements';

/** Steamworks limits an achievement API name to 128 bytes; we keep it well under 64 characters. */
export const STEAM_NAME_MAX = 64;

/** `heroRound.jack.1` → `ACH_HERO_ROUND_JACK_1`; the convention is fixed so Steamworks can mirror it. */
export function steamApiName(id: string): string {
	return `ACH_${id
		.replace(/([a-z\d])([A-Z])/g, '$1_$2')
		.replace(/\./g, '_')
		.toUpperCase()}`;
}

/**
 * Internal achievement id → Steam API name, for every achievement in the game (SDD-007 RF-03).
 * The desktop shell calls `platform.achievements.unlock(id)`; it translates through this map.
 */
export const STEAM_ACHIEVEMENTS: Readonly<Record<string, string>> = Object.fromEntries(
	ACHIEVEMENTS.map((a) => [a.id, steamApiName(a.id)]),
);
