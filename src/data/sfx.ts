import type { SfxrAlgorithm } from 'jsfxr';
import { SFX, type SfxKey } from '../art/manifest';

export interface SfxPreset {
	algorithm: SfxrAlgorithm;
	/** Multipliers/offsets applied to the generated params. */
	freqMul?: number;
	decayMul?: number;
	sustainMul?: number;
	volume?: number;
	/** Max simultaneous voices of this sound. */
	voices?: number;
	/** Random pitch variation (±fraction), for repetitive sounds. */
	pitchVar?: number;
}

/** Starting presets (docs/audio.md). Rendered once at boot to AudioBuffers. */
export const SFX_PRESETS: Record<SfxKey, SfxPreset> = {
	[SFX.blade]: { algorithm: 'hitHurt', freqMul: 1.6, decayMul: 0.6, volume: 0.5, pitchVar: 0.08 },
	[SFX.blaster]: {
		algorithm: 'laserShoot',
		decayMul: 0.5,
		volume: 0.35,
		voices: 3,
		pitchVar: 0.08,
	},
	[SFX.psi]: { algorithm: 'synth', freqMul: 0.6, decayMul: 0.5, volume: 0.4, pitchVar: 0.08 },
	[SFX.enemyHit]: { algorithm: 'hitHurt', decayMul: 0.5, volume: 0.3, voices: 4, pitchVar: 0.08 },
	[SFX.enemyDie]: {
		algorithm: 'explosion',
		decayMul: 0.4,
		volume: 0.35,
		voices: 4,
		pitchVar: 0.08,
	},
	[SFX.playerHurt]: { algorithm: 'hitHurt', freqMul: 0.5, volume: 0.7, voices: 1 },
	[SFX.gold]: { algorithm: 'pickupCoin', decayMul: 0.6, volume: 0.3, voices: 3, pitchVar: 0.08 },
	[SFX.heal]: { algorithm: 'powerUp', volume: 0.4, voices: 1 },
	[SFX.cardPick]: { algorithm: 'powerUp', volume: 0.5, voices: 1 },
	[SFX.buy]: { algorithm: 'powerUp', freqMul: 1.2, volume: 0.5, voices: 1 },
	[SFX.uiClick]: { algorithm: 'blipSelect', volume: 0.4, voices: 1 },
	[SFX.uiHover]: { algorithm: 'blipSelect', freqMul: 1.4, decayMul: 0.5, volume: 0.2, voices: 1 },
	[SFX.waveStart]: { algorithm: 'powerUp', volume: 0.5, voices: 1 },
	[SFX.waveEnd]: { algorithm: 'synth', sustainMul: 1.5, volume: 0.5, voices: 1 },
	[SFX.bossWarn]: { algorithm: 'tone', freqMul: 0.4, sustainMul: 2, volume: 0.5, voices: 1 },
	[SFX.revive]: { algorithm: 'powerUp', sustainMul: 3, decayMul: 2, volume: 0.6, voices: 1 },
	[SFX.gameOver]: { algorithm: 'explosion', sustainMul: 3, decayMul: 3, volume: 0.7, voices: 1 },
};

/** Global voice rules (docs/audio.md). */
export const AUDIO_RULES = {
	defaultVoices: 4,
	/** Minimum time between two starts of the same sound (ms). */
	minIntervalMs: 40,
} as const;
