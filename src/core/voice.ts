import type Phaser from 'phaser';
import { voiceFiles } from '../art/manifest';
import type { HeroId } from '../config/constants';
import { VOICE, type VoEvent } from '../data/voice';
import type { VoiceDirector } from '../logic/voice';
import { voKey } from '../logic/voice';
import { getSave } from './context';
import { GameEvents } from './events';

/**
 * Queues the recorded lines of one language (only files that exist). Called by the Boot preload
 * and again after a language change, where it starts the loader in the background.
 */
export function loadVoiceLines(scene: Phaser.Scene, lang: string, start = false): void {
	const present = new Set(__ASSET_FILES__);
	let queued = 0;
	for (const [key, url] of Object.entries(voiceFiles(lang))) {
		if (!present.has(url) || scene.cache.audio.exists(key)) continue;
		scene.load.audio(key, url);
		queued++;
	}
	if (start && queued > 0) scene.load.start();
}

export interface VoiceLine {
	hero: HeroId;
	event: VoEvent;
	n: number;
}

/**
 * Plays a hero line on the voice channel (master × voice volume) and announces it for the
 * subtitle. Missing audio is fine until the recorded lines land (PLAN 7.2): the subtitle
 * still shows.
 */
export function playVoice(
	scene: Phaser.Scene,
	director: VoiceDirector,
	hero: HeroId,
	event: VoEvent,
	roll: number,
): void {
	if (!director.tryPlay(event, scene.time.now / 1000)) return;
	const n = 1 + Math.min(VOICE.variants - 1, Math.floor(roll * VOICE.variants));
	const settings = getSave(scene).settings;
	const key = voKey(hero, event, settings.lang, n);
	const gain = settings.volume.master * settings.volume.voice;
	if (import.meta.env.SOUND_MUTED !== 'true' && gain > 0 && scene.cache.audio.exists(key))
		scene.sound.play(key, { volume: gain });
	scene.game.events.emit(GameEvents.Voice, { hero, event, n } satisfies VoiceLine);
}
