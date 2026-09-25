/** Minimal typings for jsfxr (https://github.com/chr15m/jsfxr). */
declare module 'jsfxr' {
	export type SfxrAlgorithm =
		| 'pickupCoin'
		| 'laserShoot'
		| 'explosion'
		| 'powerUp'
		| 'hitHurt'
		| 'jump'
		| 'blipSelect'
		| 'synth'
		| 'tone'
		| 'click'
		| 'random';

	/** sfxr synth parameters (only the ones we tweak are listed; the rest pass through). */
	export interface SfxrParams {
		sound_vol: number;
		sample_rate: number;
		sample_size: number;
		p_base_freq: number;
		p_env_attack: number;
		p_env_sustain: number;
		p_env_punch: number;
		p_env_decay: number;
		[key: string]: number | string;
	}

	export const sfxr: {
		generate(algorithm: SfxrAlgorithm, options?: Partial<SfxrParams>): SfxrParams;
		toWebAudio(params: SfxrParams, ctx: BaseAudioContext): AudioBufferSourceNode;
	};
}
