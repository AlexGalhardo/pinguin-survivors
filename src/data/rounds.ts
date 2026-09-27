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
		spawnBase: 2,
		spawnPerRound: 0.6,
		spawnMax: 25,
	},
} as const;
