import type { Song } from '../data/music';

/** MIDI note number to frequency (A4 = 69 = 440 Hz). */
export function midiToHz(note: number): number {
	return 440 * 2 ** ((note - 69) / 12);
}

/** Length of a 16th-note step in seconds. */
export function stepSeconds(bpm: number): number {
	return 60 / bpm / 4;
}

/** Steps in the song loop (the longest channel). */
export function songLength(song: Song): number {
	return Math.max(song.lead.length, song.bass.length, song.arp.length, song.drums.length);
}

export interface StepEvent {
	lead: number | null;
	bass: number | null;
	arp: number | null;
	drum: 'k' | 's' | 'h' | null;
}

/** Notes that start at a given step (channels loop independently). */
export function stepEvents(song: Song, step: number): StepEvent {
	const at = <T>(arr: readonly T[]): T | undefined => arr[step % arr.length];
	const d = song.drums[step % song.drums.length];
	return {
		lead: at(song.lead) ?? null,
		bass: at(song.bass) ?? null,
		arp: at(song.arp) ?? null,
		drum: d === 'k' || d === 's' || d === 'h' ? d : null,
	};
}
