import type { PlatformTier } from '../core/platform/types';
import { ARENA } from './arena';

/** Effects budget of a device tier (SDD-007 RF-05, docs/architecture.md §8). */
export interface TierBudget {
	/** Persistent blood decals kept per run (oldest drop first). */
	decalCap: number;
	/** Darkness layer with dynamic lights (hero, shots, fire, elites, boss). */
	dynamicLights: boolean;
	/** Most lights drawn per frame. */
	maxLights: number;
	/** Bloom is still opt-in in Settings: `false` here forces it off. */
	bloom: boolean;
	/** Multiplier on blood spray particles and gibs per kill. */
	particleScale: number;
	/** Most "CRIT!" labels on screen at once (past it a crit is just a bigger number). */
	critLabels: number;
	/** Spark particles on a crit (scaled again by `particleScale`). */
	critSparks: number;
	/** Multiplier on live ambient weather particles and campfire embers (SDD-017). */
	ambientScale: number;
	/** Additive glow under campfires (the flame itself always draws). */
	glow: boolean;
}

/**
 * `high` is the full game (perf budget: 300 enemies + 2.000 decals + lights at 1920x1080).
 * `mid` keeps the look but trims what scales with the horde: half the decals (the perf test
 * already runs on 2.000), a light cap that still covers hero + elites + boss, 75% particles.
 * `low` is the SDD-007 RF-05 floor: 1.000 decals, no dynamic lights, no bloom, half the particles.
 */
export const TIER_BUDGET: Readonly<Record<PlatformTier, TierBudget>> = {
	low: {
		decalCap: 1000,
		dynamicLights: false,
		maxLights: 0,
		bloom: false,
		particleScale: 0.5,
		critLabels: 4,
		critSparks: 3,
		ambientScale: 0.4,
		glow: false,
	},
	mid: {
		decalCap: 2000,
		dynamicLights: true,
		maxLights: 24,
		bloom: true,
		particleScale: 0.75,
		critLabels: 8,
		critSparks: 6,
		ambientScale: 0.75,
		glow: true,
	},
	high: {
		decalCap: ARENA.decalCap,
		dynamicLights: true,
		maxLights: 64,
		bloom: true,
		particleScale: 1,
		critLabels: 14,
		critSparks: 8,
		ambientScale: 1,
		glow: true,
	},
};
