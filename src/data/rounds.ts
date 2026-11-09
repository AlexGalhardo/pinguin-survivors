/** Round rules (docs/balancing-and-simulation.md §1–2). */
export const ROUNDS = {
	firstDuration: 20,
	durationStep: 5,
	maxDuration: 60,
	bossEvery: 10,
	bossTimeLimit: 180,
	eliteEvery: 3,
	/** Orange elites start after the first boss. */
	orangeFrom: 11,
	purpleShare: 0.08,
	orangeShare: 0.04,
	elite: {
		purple: { hp: 2, damage: 2, scale: 1.25 },
		orange: { hp: 3, damage: 3, scale: 1.4 },
	},
	scaling: {
		hpPerRound: 0.15,
		hpPerCycle: 1.3,
		dmgPerRound: 0.26,
		dmgPerCycle: 1.15,
		bossHpPerCycle: 1.35,
		spawnBase: 1.5,
		spawnPerRound: 0.5,
		spawnMax: 25,
		/** Horde spawn rate during boss rounds (the fight is about the boss; auto-aim hits the nearest). */
		bossSpawnMul: 0.5,
		/** Endless: every full tour of the 3 biomes (30 rounds) multiplies HP/damage again. */
		loopRounds: 30,
		hpPerLoop: 4.5,
		dmgPerLoop: 1.6,
		/** Enemy speed per endless loop (1 = off; hook for balancing). */
		speedPerLoop: 1,
	},
	/** Share of max HP restored when a round ends (the hero carries HP into the next round). */
	roundEndHeal: 0.25,
} as const;
