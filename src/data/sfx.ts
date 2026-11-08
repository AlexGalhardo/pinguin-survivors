/** Sound effects (ElevenLabs, public/assets/audio/sfx/<key>.mp3). Mix rules per key (docs/audio.md). */
export interface SfxDef {
	volume: number;
	/** Max overlapping instances of this sound. */
	polyphony: number;
	/** Random playback-rate variation (±). */
	pitch: number;
	/** Approximate length used by the limiter (ms). */
	ms: number;
}

/**
 * Extra takes of the most repeated sounds, rotated at random so hordes don't sound mechanical
 * (files <key>.<n>.mp3 for n = 2…count; the base file is take 1).
 */
export const SFX_VARIANTS: Partial<Record<string, number>> = {
	'sfx.hit': 3,
	'sfx.shotgun': 3,
	'sfx.splat': 3,
	'sfx.zombieDeath': 3,
	'sfx.swing': 2,
};

export const SFX = {
	'sfx.achievement': { volume: 0.8, polyphony: 1, pitch: 0, ms: 2500 },
	'sfx.hit': { volume: 0.45, polyphony: 4, pitch: 0.12, ms: 500 },
	'sfx.swing': { volume: 0.5, polyphony: 2, pitch: 0.1, ms: 500 },
	'sfx.shotgun': { volume: 0.6, polyphony: 2, pitch: 0.06, ms: 1000 },
	'sfx.cast': { volume: 0.5, polyphony: 2, pitch: 0.1, ms: 800 },
	'sfx.explosion': { volume: 0.6, polyphony: 3, pitch: 0.1, ms: 1500 },
	'sfx.splat': { volume: 0.5, polyphony: 3, pitch: 0.15, ms: 800 },
	'sfx.zombieDeath': { volume: 0.35, polyphony: 2, pitch: 0.15, ms: 800 },
	'sfx.heroHurt': { volume: 0.7, polyphony: 1, pitch: 0.08, ms: 500 },
	'sfx.pickupXp': { volume: 0.25, polyphony: 3, pitch: 0.2, ms: 500 },
	'sfx.pickupFish': { volume: 0.5, polyphony: 2, pitch: 0.1, ms: 500 },
	'sfx.levelUp': { volume: 0.8, polyphony: 1, pitch: 0, ms: 1800 },
	'sfx.card': { volume: 0.7, polyphony: 1, pitch: 0.05, ms: 600 },
	'sfx.potion': { volume: 0.7, polyphony: 1, pitch: 0.05, ms: 1000 },
	'sfx.bossRoar': { volume: 0.9, polyphony: 1, pitch: 0.05, ms: 2500 },
	'sfx.super': { volume: 0.9, polyphony: 1, pitch: 0, ms: 2000 },
	'sfx.uiSelect': { volume: 0.5, polyphony: 2, pitch: 0.05, ms: 500 },
	'sfx.gameOver': { volume: 0.8, polyphony: 1, pitch: 0, ms: 2500 },
} as const satisfies Record<string, SfxDef>;

export type SfxKey = keyof typeof SFX;
/** Minimum gap between two starts of the same sound (ms). */
export const SFX_MIN_INTERVAL = 45;
