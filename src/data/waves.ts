/** Wave scaling constants (docs/balancing.md §1). Formulas live in logic/scaling.ts. */
export const WAVE = {
	baseDuration: 20,
	durationPerWave: 5,
	maxDuration: 60,
	baseSpawnRate: 1.2,
	spawnRatePerWave: 0.25,
	hpLinear: 0.15,
	hpExp: 1.04,
	dmgLinear: 0.08,
	dmgExp: 1.02,
	spdLinear: 0.02,
	spdMax: 1.6,
	/** Overflow above the alive cap becomes HP: hpMul *= 1 + excess / overflowDivisor. */
	overflowDivisor: 300,
	eliteEvery: 5,
	bossEvery: 10,
	/** Boss appears this many seconds into its wave. */
	bossDelay: 5,
} as const;

/** When elites appear inside their wave: first at 3 s, then every 6 s. */
export const ELITE_SCHEDULE = { first: 3, every: 6 } as const;
