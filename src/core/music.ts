import type Phaser from 'phaser';
import { getSave } from './context';

export type MusicKey = 'music.menu' | 'music.round' | 'music.boss';
export const MUSIC_KEYS: readonly MusicKey[] = ['music.menu', 'music.round', 'music.boss'];

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
	if (!scene.cache.audio.exists(key)) return;
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
