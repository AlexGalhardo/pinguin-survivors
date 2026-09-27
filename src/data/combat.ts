/** Combat constants (docs/balancing.md §3). */
export const COMBAT = {
	armorK: 100,
	armorCap: 0.8,
	resistCap: 0.75,
	dodgeCap: 0.6,
	parryCap: 0.4,
	parryReflect: 0.5,
	heroIFrames: 0.6,
	knockback: 140,
} as const;

/** Damage-over-time and elemental effects (docs/balancing.md §3). */
export const STATUS = {
	bleed: { share: 0.2, duration: 3, maxStacks: 5 },
	poison: { sharePerSecond: 0.1, duration: 4, maxStacks: 10 },
	burn: { sharePerSecond: 0.15, duration: 3 },
	ice: { slowPerStack: 0.1, maxStacks: 5, duration: 3, freeze: 1.5 },
	earth: { stunChance: 0.1, stun: 0.5, shred: 0.1, shredDuration: 4 },
	energy: { jumps: 2, range: 90, share: 0.6 },
} as const;
