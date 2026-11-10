import type Phaser from 'phaser';
import { BOSS_ROUNDS } from '../data/enemies';
import { type Fade, ROUND_TRACKS, roundTrack, stepFade } from '../logic/music';
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

const FADE_S = 0.8;
/** Music sits under the SFX in the mix. */
const MUSIC_GAIN = 0.55;

type MusicSound = Phaser.Sound.BaseSound & { volume: number };

let current: { key: MusicKey; sound: MusicSound } | null = null;
/**
 * Fades run on the game clock, not on a scene's tweens: a scene that stops or restarts (back to
 * menu, play again) used to take the fade-out with it, so the old track looped forever under the new
 * one. A fade-out destroys its sound when it ends.
 */
const fades = new Map<MusicSound, Fade & { destroy: boolean }>();
let ticking: Phaser.Game | null = null;

function tick(_time: number, deltaMs: number): void {
	for (const [sound, fade] of fades) {
		const { volume, done } = stepFade(fade, deltaMs / 1000);
		sound.volume = volume;
		if (!done) continue;
		fades.delete(sound);
		if (fade.destroy) sound.destroy();
	}
}

function fadeTo(scene: Phaser.Scene, sound: MusicSound, to: number, destroy: boolean): void {
	if (ticking !== scene.game) {
		ticking?.events.off('step', tick);
		ticking = scene.game;
		ticking.events.on('step', tick);
	}
	fades.set(sound, { from: sound.volume, to, duration: FADE_S, elapsed: 0, destroy });
}

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
	// Safety net: any other music sound still alive (and not already fading out) goes too.
	for (const s of scene.sound.getAllPlaying() as MusicSound[])
		if (String(s.key).startsWith('music.') && !fades.get(s)?.destroy) fadeTo(scene, s, 0, true);
	const sound = scene.sound.add(key, { loop: true, volume: 0 }) as MusicSound;
	sound.play();
	fadeTo(scene, sound, targetVolume(scene), false);
	current = { key, sound };
}

export function stopMusic(scene: Phaser.Scene): void {
	if (!current) return;
	const old = current.sound;
	current = null;
	fadeTo(scene, old, 0, true);
}

/** Settings changed: apply the new music volume right away. */
export function refreshMusicVolume(scene: Phaser.Scene): void {
	if (!current) return;
	const fade = fades.get(current.sound);
	if (fade && !fade.destroy) fade.to = targetVolume(scene);
	else current.sound.volume = targetVolume(scene);
}
