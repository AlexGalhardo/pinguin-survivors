/** Round rules (docs/balancing-and-simulation.md §1–2). */
export const ROUNDS = {
	firstDuration: 20,
	durationStep: 5,
	/** Biome and scaling block: Antarctica 1–10, forest 11–20, city 21–30, station 31–40, ruins 41–50 (ADR-023), then endless blocks of 10 from 51. */
	biomeRounds: 10,
	/** Boss rounds: 5, 10, 15… (developer rule, 2026-11-08). */
	bossEvery: 5,
	/** Seconds to kill the boss of round 5; each later boss gets `bossTimeStep` more (10: 3 min, 15: 4 min…). */
	bossTimeLimit: 120,
	bossTimeStep: 60,
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
		/** Boss HP doubles with every boss: round 5 ×1, 10 ×2, 15 ×4… (developer rule, 2026-11-08). */
		bossHpPerBoss: 2,
		spawnBase: 1.5,
		spawnPerRound: 0.5,
		spawnMax: 25,
		/** Horde spawn rate during boss rounds (the fight is about the boss; auto-aim hits the nearest). */
		bossSpawnMul: 0.5,
		/** Endless: every full tour of the 5 biomes (50 rounds) multiplies HP/damage again. */
		loopRounds: 50,
		hpPerLoop: 4.5,
		dmgPerLoop: 1.6,
		/** Enemy speed per endless loop (1 = off; hook for balancing). */
		speedPerLoop: 1,
	},
	/** Share of max HP restored when a round ends (the hero carries HP into the next round). */
	roundEndHeal: 0.25,
} as const;
