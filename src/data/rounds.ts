/** Round rules (docs/balancing.md §1–2). */
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
		hpPerCycle: 1.25,
		dmgPerRound: 0.08,
		dmgPerCycle: 1.15,
		bossHpPerCycle: 1.6,
		spawnBase: 1.5,
		spawnPerRound: 0.5,
		spawnMax: 25,
		/** Horde spawn rate during boss rounds (the fight is about the boss; auto-aim hits the nearest). */
		bossSpawnMul: 0.5,
		/** Endless: every full tour of the 3 biomes (30 rounds) multiplies HP/damage again. */
		loopRounds: 30,
		hpPerLoop: 1.6,
		dmgPerLoop: 1.5,
	},
} as const;
