import type { BiomeId } from '../config/constants';
import { PALETTE } from '../config/palette';

export type WeatherKind = 'snow' | 'wind' | 'spores' | 'rain' | 'embers';

/** Texture shape of a weather particle (drawn once in `src/art/ambient-art.ts`). */
export type WeatherShape = 'dot' | 'streak' | 'leaf';

export interface AmbientDef {
	kind: WeatherKind;
	shape: WeatherShape;
	/** Live particles at tier `high` (scaled by `TierBudget.ambientScale`). */
	count: number;
	/** Lifespan range, ms. */
	life: readonly [number, number];
	/** Velocity ranges in world px/s. */
	vx: readonly [number, number];
	vy: readonly [number, number];
	/** Size multiplier range of the base texture. */
	scale: readonly [number, number];
	/** Peak alpha: low enough to keep ground marks and elites readable. */
	alpha: number;
	colors: readonly number[];
	additive: boolean;
}

/** One weather effect per biome (SDD-017 RF-02): small, cheap and never covering the red marks. */
export const AMBIENT: Readonly<Record<BiomeId, AmbientDef>> = {
	antarctica: {
		kind: 'snow',
		shape: 'dot',
		count: 120,
		life: [3500, 5500],
		vx: [-28, -6],
		vy: [38, 70],
		scale: [1.5, 2.5],
		alpha: 0.75,
		colors: [PALETTE.textLight, PALETTE.snowLight],
		additive: false,
	},
	forest: {
		kind: 'wind',
		shape: 'leaf',
		count: 36,
		life: [2200, 3200],
		vx: [170, 280],
		vy: [20, 70],
		scale: [1, 1.6],
		alpha: 0.7,
		colors: [PALETTE.leaf, PALETTE.forestMoss, PALETTE.forestDirt, PALETTE.dust],
		additive: false,
	},
	city: {
		kind: 'spores',
		shape: 'dot',
		count: 50,
		life: [3500, 5500],
		vx: [-14, 14],
		vy: [-34, -12],
		scale: [1.5, 3],
		alpha: 0.5,
		colors: [PALETTE.goo, PALETTE.xp],
		additive: true,
	},
	station: {
		kind: 'rain',
		shape: 'streak',
		count: 150,
		life: [500, 750],
		vx: [-90, -60],
		vy: [520, 640],
		scale: [1, 1.4],
		alpha: 0.4,
		colors: [PALETTE.rain],
		additive: false,
	},
	ruins: {
		kind: 'embers',
		shape: 'dot',
		count: 60,
		life: [3000, 5000],
		vx: [-16, 20],
		vy: [-52, -20],
		scale: [1, 2],
		alpha: 0.8,
		colors: [PALETTE.elFire, PALETTE.fish, PALETTE.ash],
		additive: true,
	},
};

/** Campfire props (SDD-017 RF-05): flat, no collision, warm pulsing light. */
export const CAMPFIRE = {
	/** One campfire per this many arena tiles of side (at least `min`). */
	tilesPerFire: 8,
	min: 2,
	/** Candidate positions rolled over the largest arena; the current bounds reveal them in order. */
	candidates: 16,
	/** Free margin to the arena wall, to a prop and between two fires (px). */
	edgeMargin: 100,
	propMargin: 70,
	fireGap: 160,
	/** Hero spawn is kept clear (px from the arena center). */
	clearRadius: 140,
	scale: 2,
	/** Seconds per flame frame. */
	frame: 0.12,
	frames: 4,
	/** Light erased from the darkness layer and the additive glow, px. */
	lightRadius: 190,
	glowRadius: 150,
	lightStrength: 0.9,
	/** Pulse: base level, swing and speed (rad/s); `reducedFlashes` freezes it at the base. */
	pulse: { base: 0.85, swing: 0.15, speed: 7 },
	/** Embers rising from every fire (shared emitter, scaled by the tier). */
	embersPerSecond: 5,
} as const;

export interface LightingDef {
	/** Colour and strength of the night layer (never above `maxDarkness`). */
	tint: number;
	darkness: number;
	/** Vignette strength at the screen corners (0 = off). */
	vignette: number;
}

/** Darkness never exceeds this: enemies and the red marks must read in the dark. */
export const MAX_DARKNESS = 0.66;

/** Ambient light per biome (SDD-017 RF-06): cold blue, green dusk, grey dusk, teal, ember red. */
export const LIGHTING: Readonly<Record<BiomeId, LightingDef>> = {
	antarctica: { tint: PALETTE.nightAntarctica, darkness: 0.52, vignette: 0.4 },
	forest: { tint: PALETTE.nightForest, darkness: 0.62, vignette: 0.45 },
	city: { tint: PALETTE.nightCity, darkness: 0.6, vignette: 0.42 },
	station: { tint: PALETTE.nightStation, darkness: 0.58, vignette: 0.42 },
	ruins: { tint: PALETTE.nightRuins, darkness: 0.64, vignette: 0.45 },
};

/** Soft hero halo drawn on top of the core light, and the drop light (rarity >= `dropMinRarity`). */
export const EXTRA_LIGHTS = {
	heroHalo: { radius: 440, strength: 0.32 },
	drop: { radius: 70, strength: 0.5, minRarity: 3, max: 6 },
} as const;
