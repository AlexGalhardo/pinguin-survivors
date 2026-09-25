import { describe, expect, it } from 'bun:test';
import { SONGS } from '../src/data/music';
import { midiToHz, songLength, stepEvents, stepSeconds } from '../src/logic/music';

describe('music sequencer', () => {
	it('converts MIDI to Hz', () => {
		expect(midiToHz(69)).toBeCloseTo(440);
		expect(midiToHz(81)).toBeCloseTo(880);
		expect(midiToHz(57)).toBeCloseTo(220);
	});

	it('computes step length from bpm', () => {
		expect(stepSeconds(120)).toBeCloseTo(0.125);
	});

	it('every song loops in whole bars and reads drums', () => {
		for (const song of Object.values(SONGS)) {
			expect(songLength(song) % 16).toBe(0);
			expect(song.drums.length % 16).toBe(0);
		}
		const e = stepEvents(SONGS.combat, 0);
		expect(e.drum).toBe('k');
		expect(e.bass).toBe(45);
		expect(stepEvents(SONGS.combat, 1).drum).toBeNull();
	});
});
