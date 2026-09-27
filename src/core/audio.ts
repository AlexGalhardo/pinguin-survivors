import type Phaser from 'phaser';
import { SFX, SFX_MIN_INTERVAL, SFX_VARIANTS, type SfxKey } from '../data/sfx';
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
	scene.sound.play(pickTake(scene, key), {
		volume: gain,
		rate: pitchRate(def.pitch, Math.random()),
	});
}

/** Random take among the loaded variants of a key (take 1 is the base file). */
function pickTake(scene: Phaser.Scene, key: SfxKey): string {
	const count = SFX_VARIANTS[key] ?? 1;
	if (count <= 1) return key;
	const n = 1 + Math.floor(Math.random() * count);
	const take = n === 1 ? key : `${key}.${n}`;
	return scene.cache.audio.exists(take) ? take : key;
}
