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
	/** Seconds the player has to kill a boss after it spawns; running out ends the run. */
	bossTimeLimit: 300,
} as const;

/** When elites appear inside their wave: first at 3 s, then every 6 s. */
export const ELITE_SCHEDULE = { first: 3, every: 6 } as const;

export type WaveModifier = 'swarm' | 'armored' | 'fast' | null;

/** Occasional wave modifiers (Beta): multipliers over the normal wave. */
export const WAVE_MODIFIERS: Record<
	Exclude<WaveModifier, null>,
	{ spawn: number; hp: number; spd: number }
> = {
	swarm: { spawn: 1.6, hp: 0.65, spd: 1 },
	armored: { spawn: 0.85, hp: 1.5, spd: 0.9 },
	fast: { spawn: 1, hp: 0.9, spd: 1.3 },
};

/** Modifiers start at this wave, never on boss waves, with this chance. */
export const MODIFIER_RULES = { fromWave: 6, chance: 0.25 } as const;
