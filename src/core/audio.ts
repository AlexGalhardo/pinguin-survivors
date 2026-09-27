import type Phaser from 'phaser';
import { SFX, SFX_MIN_INTERVAL, type SfxKey } from '../data/sfx';
import { pitchRate, VoiceLimiter } from '../logic/voice-limiter';
import { getSave } from './context';

const limiter = new VoiceLimiter(SFX_MIN_INTERVAL);

/**
 * Plays a sound effect with the Settings volumes (master × sfx), a per-key voice limit (hordes
 * would otherwise stack dozens of hits) and a small random pitch variation.
 */
export function sfx(scene: Phaser.Scene, key: SfxKey, volume = 1): void {
	if (import.meta.env.SOUND_MUTED === 'true') return;
	if (!scene.cache.audio.exists(key)) return;
	const def = SFX[key];
	if (!limiter.tryStart(key, performance.now(), def.ms, def.voices)) return;
	const v = getSave(scene).settings.volume;
	const gain = v.master * v.sfx * def.volume * volume;
	if (gain <= 0) return;
	scene.sound.play(key, { volume: gain, rate: pitchRate(def.pitch, Math.random()) });
}
