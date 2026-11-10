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
