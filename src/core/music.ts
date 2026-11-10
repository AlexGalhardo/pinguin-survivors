import type Phaser from 'phaser';
import type { BiomeId } from '../config/constants';
import { getSave } from './context';

export type MusicKey =
	| 'music.menu'
	| 'music.round'
	| 'music.boss'
	| 'music.late'
	| 'music.shop'
	| 'music.forest'
	| 'music.city';
export const MUSIC_KEYS: readonly MusicKey[] = [
	'music.menu',
	'music.round',
	'music.boss',
	'music.late',
	'music.shop',
	'music.forest',
	'music.city',
];

/** First round of the late-game track (the ruined city onwards). */
export const LATE_MUSIC_FROM = 21;

/** Track for a gameplay round: boss fights, then the late-game track, else the round loop. */
export function musicForRound(round: number, boss: boolean, biome?: BiomeId): MusicKey {
	if (boss) return 'music.boss';
	if (biome) return MUSIC_BY_BIOME[biome];
	return round >= LATE_MUSIC_FROM ? 'music.late' : 'music.round';
}

/** Track of each biome; station and ruins reuse the original round and late tracks (no dedicated music yet). */
const MUSIC_BY_BIOME: Record<BiomeId, MusicKey> = {
	antarctica: 'music.round',
	forest: 'music.forest',
	city: 'music.city',
	station: 'music.round',
	ruins: 'music.late',
};

const FADE_MS = 800;
/** Music sits under the SFX in the mix. */
const MUSIC_GAIN = 0.55;

let current: { key: MusicKey; sound: Phaser.Sound.BaseSound } | null = null;

function targetVolume(scene: Phaser.Scene): number {
	const v = getSave(scene).settings.volume;
	return v.master * v.music * MUSIC_GAIN;
}

/** Loops `key`, crossfading from whatever is playing (the sound manager is global). */
export function playMusic(scene: Phaser.Scene, key: MusicKey): void {
	if (import.meta.env.SOUND_MUTED === 'true') return;
	if (current?.key === key && current.sound.isPlaying) return;
	// A missing late track falls back to the regular round loop.
	if (!scene.cache.audio.exists(key)) {
		if (key === 'music.late' || key === 'music.forest' || key === 'music.city')
			playMusic(scene, 'music.round');
		return;
	}
	stopMusic(scene);
	const sound = scene.sound.add(key, { loop: true, volume: 0 });
	sound.play();
	scene.tweens.add({ targets: sound, volume: targetVolume(scene), duration: FADE_MS });
	current = { key, sound };
}

export function stopMusic(scene: Phaser.Scene): void {
	if (!current) return;
	const old = current.sound;
	current = null;
	scene.tweens.add({
		targets: old,
		volume: 0,
		duration: FADE_MS,
		onComplete: () => old.destroy(),
	});
}

/** Settings changed: apply the new music volume right away. */
export function refreshMusicVolume(scene: Phaser.Scene): void {
	if (current) (current.sound as Phaser.Sound.WebAudioSound).setVolume(targetVolume(scene));
}
