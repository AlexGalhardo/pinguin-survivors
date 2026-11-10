import type Phaser from 'phaser';
import { BOSS_ROUNDS } from '../data/enemies';
import { ROUND_TRACKS, roundTrack } from '../logic/music';
import { isBossRound } from '../logic/round';
import { getSave } from './context';

type RoundTrack = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type MusicKey =
	| 'music.menu'
	| 'music.round'
	| 'music.boss'
	| 'music.late'
	| 'music.shop'
	| 'music.forest'
	| 'music.city'
	| 'music.shop.theme'
	| `music.round.${RoundTrack}`
	| `music.boss.${(typeof BOSS_ROUNDS)[number]}`;

const ROUND_KEYS = Array.from(
	{ length: ROUND_TRACKS },
	(_, i) => `music.round.${i + 1}` as MusicKey,
);
/** Registered tracks: the legacy ones stay loaded but only act as fallbacks. */
export const MUSIC_KEYS: readonly MusicKey[] = [
	'music.menu',
	'music.round',
	'music.boss',
	'music.late',
	'music.shop',
	'music.forest',
	'music.city',
	'music.shop.theme',
	...ROUND_KEYS,
	...BOSS_ROUNDS.map((id) => `music.boss.${id}` as const),
];

/**
 * Track for a gameplay round: a boss fight plays its own boss theme (`bossId` is the boss on the
 * field, also in the endless), a normal round one of the nine round themes drawn by the run seed.
 */
export function musicForRound(round: number, seed: number, bossId?: string): MusicKey {
	if (isBossRound(round)) {
		const key = `music.boss.${bossId}` as MusicKey;
		return MUSIC_KEYS.includes(key) ? key : 'music.boss';
	}
	return `music.round.${roundTrack(seed, round) as RoundTrack}`;
}

/** Where a track falls back to when its file is missing. */
function fallbackFor(key: MusicKey): MusicKey | null {
	if (key.startsWith('music.boss.')) return 'music.boss';
	if (key === 'music.shop.theme') return 'music.shop';
	if (key.startsWith('music.round.')) return 'music.round';
	return null;
}

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
	if (!scene.cache.audio.exists(key)) {
		const fallback = fallbackFor(key);
		if (fallback) playMusic(scene, fallback);
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
