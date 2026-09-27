/** XP and Fish (docs/balancing.md §5 and §8). */
export const ECONOMY = {
	maxLevel: 100,
	xpCurve: { base: 30, exponent: 1.55, flat: 50 },
	/** Orb XP grows with the round: xp × (1 + perRound × round). */
	xpPerRound: 0.05,
	fish: {
		commonChance: 0.05,
		elitePurple: 3,
		eliteOrange: 6,
		roundEndBase: 2,
		bossPerCycle: 25,
	},
	magnetSpeed: 320,
	collectRadius: 14,
} as const;
