import { Rng } from './rng';
import { isBossRound } from './round';

/** Normal-round themes `music.round.1` to `music.round.9`. */
export const ROUND_TRACKS = 9;

/**
 * Theme (1-9) of a normal round: drawn per round from the run seed, never the same as the previous
 * normal round. Pure in (seed, round), so resuming a run mid-way gives the same music.
 */
export function roundTrack(seed: number, round: number): number {
	let prev = 0;
	for (let r = 1; r <= round; r++) {
		if (isBossRound(r)) continue;
		let pick = new Rng(Math.imul(seed ^ 0x6d757369, 31) + r).int(
			1,
			ROUND_TRACKS - (prev ? 1 : 0),
		);
		if (prev && pick >= prev) pick++;
		prev = pick;
	}
	return prev;
}

/** A volume ramp of one music sound, advanced by real time (never by a scene's tween clock). */
export interface Fade {
	from: number;
	to: number;
	/** Seconds the ramp lasts and seconds already elapsed. */
	duration: number;
	elapsed: number;
}

/** Advances a fade by `dt` seconds: the current volume and whether the ramp is over. */
export function stepFade(fade: Fade, dt: number): { volume: number; done: boolean } {
	fade.elapsed = Math.min(fade.duration, fade.elapsed + Math.max(0, dt));
	const k = fade.duration > 0 ? fade.elapsed / fade.duration : 1;
	return { volume: fade.from + (fade.to - fade.from) * k, done: k >= 1 };
}
