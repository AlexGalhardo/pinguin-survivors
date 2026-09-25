import type Phaser from 'phaser';
import { settings } from '../core/settings';
import { MUSIC_DUCK, SONGS, type SongId } from '../data/music';
import { midiToHz, songLength, stepEvents, stepSeconds } from '../logic/music';
import { SOUND_MUTED } from './AudioSystem';

/** Seconds scheduled ahead of the audio clock (lookahead scheduler). */
const LOOKAHEAD = 0.12;
const TICK_MS = 25;

/**
 * Tiny chiptune sequencer on Web Audio: square lead, triangle bass, square arpeggio and
 * noise drums, scheduled ahead on the audio clock. Honors the music volume, ducking and
 * SOUND_MUTED (never plays when muted).
 */
export class MusicSystem {
	private static instance: MusicSystem | null = null;
	private readonly ctx: AudioContext | null;
	private readonly master: GainNode | null;
	private readonly noise: AudioBuffer | null;
	private song: SongId | null = null;
	private step = 0;
	private nextTime = 0;
	private timer: ReturnType<typeof setInterval> | null = null;
	private ducked = false;

	private constructor(game: Phaser.Game) {
		const manager = game.sound as Phaser.Sound.BaseSoundManager & { context?: AudioContext };
		this.ctx = manager.context ?? null;
		this.master = this.ctx ? this.ctx.createGain() : null;
		this.master?.connect(this.ctx?.destination as AudioNode);
		this.noise = this.ctx ? this.makeNoise(this.ctx) : null;
		this.applyVolume();
	}

	static init(game: Phaser.Game): MusicSystem {
		if (!MusicSystem.instance) MusicSystem.instance = new MusicSystem(game);
		return MusicSystem.instance;
	}

	static get(): MusicSystem | null {
		return MusicSystem.instance;
	}

	get current(): SongId | null {
		return this.song;
	}

	private makeNoise(ctx: AudioContext): AudioBuffer {
		const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
		const data = buf.getChannelData(0);
		for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
		return buf;
	}

	/** Starts a song (no-op if it is already playing or sound is muted). */
	play(id: SongId): void {
		if (SOUND_MUTED || !this.ctx || this.song === id) return;
		this.stop();
		this.song = id;
		this.step = 0;
		this.nextTime = this.ctx.currentTime + 0.05;
		this.timer = setInterval(() => this.schedule(), TICK_MS);
	}

	stop(): void {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
		this.song = null;
	}

	/** Lowers the music while a menu is open. */
	duck(on: boolean): void {
		this.ducked = on;
		this.applyVolume();
	}

	applyVolume(): void {
		if (!this.master || !this.ctx) return;
		const v = SOUND_MUTED ? 0 : settings.musicVolume * (this.ducked ? MUSIC_DUCK : 1);
		this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
	}

	private schedule(): void {
		const ctx = this.ctx;
		if (!ctx || !this.song || ctx.state !== 'running') return;
		const song = SONGS[this.song];
		const dur = stepSeconds(song.bpm);
		const len = songLength(song);
		while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
			const e = stepEvents(song, this.step);
			const t = this.nextTime;
			if (e.lead !== null) this.tone('square', midiToHz(e.lead), t, dur * 1.8, song.mix.lead);
			if (e.bass !== null)
				this.tone('triangle', midiToHz(e.bass), t, dur * 1.9, song.mix.bass);
			if (e.arp !== null) this.tone('square', midiToHz(e.arp), t, dur * 0.6, song.mix.arp);
			if (e.drum) this.drum(e.drum, t, song.mix.drums);
			this.step = (this.step + 1) % len;
			this.nextTime += dur;
		}
	}

	private tone(type: OscillatorType, freq: number, t: number, dur: number, vol: number): void {
		const ctx = this.ctx;
		if (!ctx || !this.master) return;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = type;
		osc.frequency.value = freq;
		gain.gain.setValueAtTime(vol, t);
		gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
		osc.connect(gain).connect(this.master);
		osc.start(t);
		osc.stop(t + dur + 0.02);
	}

	private drum(kind: 'k' | 's' | 'h', t: number, vol: number): void {
		const ctx = this.ctx;
		if (!ctx || !this.master) return;
		if (kind === 'k') {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.frequency.setValueAtTime(140, t);
			osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
			gain.gain.setValueAtTime(vol * 1.6, t);
			gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
			osc.connect(gain).connect(this.master);
			osc.start(t);
			osc.stop(t + 0.16);
			return;
		}
		if (!this.noise) return;
		const src = ctx.createBufferSource();
		src.buffer = this.noise;
		const filter = ctx.createBiquadFilter();
		filter.type = kind === 'h' ? 'highpass' : 'bandpass';
		filter.frequency.value = kind === 'h' ? 7000 : 1800;
		const gain = ctx.createGain();
		const len = kind === 'h' ? 0.04 : 0.12;
		gain.gain.setValueAtTime(vol * (kind === 'h' ? 0.5 : 1), t);
		gain.gain.exponentialRampToValueAtTime(0.0001, t + len);
		src.connect(filter).connect(gain).connect(this.master);
		src.start(t);
		src.stop(t + len + 0.02);
	}
}
