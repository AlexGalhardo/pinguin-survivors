/** Game feel constants (Beta): shake presets, hit-stop and animation. */

export interface ShakePreset {
	ms: number;
	intensity: number;
}

/** Calibrated camera shakes (disabled by the Screen shake setting). */
export const SHAKE = {
	hurt: { ms: 90, intensity: 0.004 },
	explosion: { ms: 120, intensity: 0.005 },
	slam: { ms: 110, intensity: 0.006 },
	revive: { ms: 250, intensity: 0.008 },
	bossSpawn: { ms: 350, intensity: 0.006 },
	bossDeath: { ms: 450, intensity: 0.01 },
	uiError: { ms: 90, intensity: 0.004 },
} as const satisfies Record<string, ShakePreset>;

/** Short freezes that sell big hits (ms). Crits have a cooldown so they never stack. */
export const HIT_STOP = {
	crit: 30,
	critCooldown: 300,
	eliteDeath: 90,
	bossDeath: 220,
} as const;

/** Squash/stretch and bob. */
export const ANIM = {
	playerBobSpeed: 18,
	playerSquash: 0.07,
	playerBreath: 0.025,
	enemyBobSpeed: 10,
	enemySquash: 0.05,
} as const;

/** Pixel block transition between scenes. */
export const TRANSITION = {
	cell: 20,
	durationMs: 260,
} as const;
