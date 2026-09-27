/** Sound effects (ElevenLabs, public/assets/audio/sfx/<key>.mp3). Mix rules per key (docs/audio.md). */
export interface SfxDef {
	volume: number;
	/** Max overlapping instances of this sound. */
	voices: number;
	/** Random playback-rate variation (±). */
	pitch: number;
	/** Approximate length used by the limiter (ms). */
	ms: number;
}

export const SFX = {
	'sfx.achievement': { volume: 0.8, voices: 1, pitch: 0, ms: 2500 },
	'sfx.hit': { volume: 0.45, voices: 4, pitch: 0.12, ms: 500 },
	'sfx.swing': { volume: 0.5, voices: 2, pitch: 0.1, ms: 500 },
	'sfx.shotgun': { volume: 0.6, voices: 2, pitch: 0.06, ms: 1000 },
	'sfx.cast': { volume: 0.5, voices: 2, pitch: 0.1, ms: 800 },
	'sfx.explosion': { volume: 0.6, voices: 3, pitch: 0.1, ms: 1500 },
	'sfx.splat': { volume: 0.5, voices: 3, pitch: 0.15, ms: 800 },
	'sfx.zombieDeath': { volume: 0.35, voices: 2, pitch: 0.15, ms: 800 },
	'sfx.heroHurt': { volume: 0.7, voices: 1, pitch: 0.08, ms: 500 },
	'sfx.pickupXp': { volume: 0.25, voices: 3, pitch: 0.2, ms: 500 },
	'sfx.pickupFish': { volume: 0.5, voices: 2, pitch: 0.1, ms: 500 },
	'sfx.levelUp': { volume: 0.8, voices: 1, pitch: 0, ms: 1800 },
	'sfx.card': { volume: 0.7, voices: 1, pitch: 0.05, ms: 600 },
	'sfx.potion': { volume: 0.7, voices: 1, pitch: 0.05, ms: 1000 },
	'sfx.bossRoar': { volume: 0.9, voices: 1, pitch: 0.05, ms: 2500 },
	'sfx.super': { volume: 0.9, voices: 1, pitch: 0, ms: 2000 },
	'sfx.uiSelect': { volume: 0.5, voices: 2, pitch: 0.05, ms: 500 },
	'sfx.gameOver': { volume: 0.8, voices: 1, pitch: 0, ms: 2500 },
} as const satisfies Record<string, SfxDef>;

export type SfxKey = keyof typeof SFX;
/** Minimum gap between two starts of the same sound (ms). */
export const SFX_MIN_INTERVAL = 45;
