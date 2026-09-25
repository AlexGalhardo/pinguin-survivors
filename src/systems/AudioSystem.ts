import { sfxr } from 'jsfxr';
import type Phaser from 'phaser';
import type { SfxKey } from '../art/manifest';
import { settings } from '../core/settings';
import { AUDIO_RULES, SFX_PRESETS } from '../data/sfx';
import { pitchRate, VoiceLimiter } from '../logic/voice-limiter';

/**
 * Procedural SFX (jsfxr): every sound of the catalog is rendered once to an AudioBuffer
 * at boot and played from the cache, with a voice limit, a minimum interval and pitch
 * variation. The AudioContext is resumed on the first user input.
 */
export class AudioSystem {
	private static instance: AudioSystem | null = null;
	private readonly ctx: AudioContext | null;
	private readonly master: GainNode | null;
	private readonly buffers = new Map<string, AudioBuffer>();
	private readonly limiter = new VoiceLimiter(AUDIO_RULES.minIntervalMs);

	private constructor(game: Phaser.Game) {
		const manager = game.sound as Phaser.Sound.BaseSoundManager & { context?: AudioContext };
		this.ctx = manager.context ?? null;
		this.master = this.ctx ? this.ctx.createGain() : null;
		if (this.ctx && this.master) {
			this.master.connect(this.ctx.destination);
			this.render();
			this.installUnlock();
		}
		this.setVolume(settings.sfxVolume);
	}

	static init(game: Phaser.Game): AudioSystem {
		if (!AudioSystem.instance) AudioSystem.instance = new AudioSystem(game);
		return AudioSystem.instance;
	}

	/** The shared instance (a silent no-op until init). */
	static get(): AudioSystem | null {
		return AudioSystem.instance;
	}

	private render(): void {
		if (!this.ctx) return;
		for (const [key, preset] of Object.entries(SFX_PRESETS)) {
			try {
				const p = sfxr.generate(preset.algorithm);
				if (preset.freqMul) p.p_base_freq = Math.min(1, p.p_base_freq * preset.freqMul);
				if (preset.decayMul) p.p_env_decay = Math.min(1, p.p_env_decay * preset.decayMul);
				if (preset.sustainMul)
					p.p_env_sustain = Math.min(1, p.p_env_sustain * preset.sustainMul);
				p.sound_vol = 0.5;
				const source = sfxr.toWebAudio(p, this.ctx);
				if (source.buffer) this.buffers.set(key, source.buffer);
			} catch (err) {
				console.warn(`[audio] could not render ${key}`, err);
			}
		}
	}

	/** Browsers only allow audio after a user gesture: resume on the first click/key. */
	private installUnlock(): void {
		const unlock = () => {
			if (this.ctx && this.ctx.state !== 'running') void this.ctx.resume();
			window.removeEventListener('pointerdown', unlock);
			window.removeEventListener('keydown', unlock);
		};
		window.addEventListener('pointerdown', unlock);
		window.addEventListener('keydown', unlock);
	}

	get unlocked(): boolean {
		return this.ctx?.state === 'running';
	}

	get renderedCount(): number {
		return this.buffers.size;
	}

	setVolume(volume: number): void {
		if (this.master) this.master.gain.value = Math.max(0, Math.min(1, volume));
	}

	play(key: SfxKey | string): void {
		const ctx = this.ctx;
		const buffer = this.buffers.get(key);
		if (!ctx || !this.master || !buffer || ctx.state !== 'running') return;
		const preset = SFX_PRESETS[key as SfxKey];
		const voices = preset?.voices ?? AUDIO_RULES.defaultVoices;
		const now = ctx.currentTime * 1000;
		if (!this.limiter.tryStart(key, now, buffer.duration * 1000, voices)) return;
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		src.playbackRate.value = pitchRate(preset?.pitchVar ?? 0, Math.random());
		const gain = ctx.createGain();
		gain.gain.value = preset?.volume ?? 0.5;
		src.connect(gain).connect(this.master);
		src.start();
	}
}

/** Shortcut used by scenes and systems. */
export function playSfx(key: SfxKey | string): void {
	AudioSystem.get()?.play(key);
}
