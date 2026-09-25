/**
 * Chiptune songs for the Web Audio sequencer (Beta). Steps are 16th notes.
 * Notes are MIDI numbers (null = rest). Drums: k = kick, s = snare, h = hat, '.' = rest.
 */
export interface Song {
	bpm: number;
	/** Square-wave melody. */
	lead: (number | null)[];
	/** Triangle bass. */
	bass: (number | null)[];
	/** Short square arpeggio (quiet). */
	arp: (number | null)[];
	drums: string;
	/** Channel volumes (0..1). */
	mix: { lead: number; bass: number; arp: number; drums: number };
}

export type SongId = 'menu' | 'combat' | 'boss';

const _ = null;

/** Repeats each chord's pattern 16 steps (one bar). */
function bars(...chunks: (number | null)[][]): (number | null)[] {
	return chunks.flat();
}

/** 16-step arpeggio of a triad starting at `root` (MIDI). */
function arp(root: number, third: number): (number | null)[] {
	const t = [root, root + third, root + 7, root + 12];
	return Array.from({ length: 16 }, (_x, i) => t[i % 4] ?? root);
}

/** 16-step bass line: root on 8ths with an octave pop. */
function bassBar(root: number): (number | null)[] {
	return [root, _, root, _, root + 12, _, root, _, root, _, root, _, root + 12, _, root + 7, _];
}

// Am - F - C - G
const combatLead = bars(
	[69, _, 72, _, 76, _, 74, 72, 69, _, _, _, 67, _, 69, _],
	[65, _, 69, _, 72, _, 69, _, 65, _, 67, 69, 72, _, _, _],
	[67, _, 72, _, 76, _, 79, _, 76, _, 72, _, 74, _, 76, _],
	[74, _, 71, _, 67, _, 71, 74, 79, _, 77, _, 76, _, 74, _],
);

export const SONGS: Record<SongId, Song> = {
	menu: {
		bpm: 96,
		lead: bars(
			[69, _, _, _, 72, _, _, _, 76, _, _, _, 74, _, _, _],
			[72, _, _, _, 69, _, _, _, 65, _, _, _, 67, _, _, _],
			[64, _, _, _, 67, _, _, _, 72, _, _, _, 71, _, _, _],
			[67, _, _, _, 71, _, _, _, 74, _, _, _, _, _, _, _],
		),
		bass: bars(bassBar(45), bassBar(41), bassBar(48), bassBar(43)),
		arp: bars(arp(57, 3), arp(53, 4), arp(60, 4), arp(55, 4)),
		drums: 'k...h...k...h...'.repeat(4),
		mix: { lead: 0.1, bass: 0.18, arp: 0.04, drums: 0.12 },
	},
	combat: {
		bpm: 132,
		lead: combatLead,
		bass: bars(bassBar(45), bassBar(41), bassBar(48), bassBar(43)),
		arp: bars(arp(69, 3), arp(65, 4), arp(72, 4), arp(67, 4)),
		drums: 'k.h.s.h.k.khs.h.'.repeat(4),
		mix: { lead: 0.08, bass: 0.16, arp: 0.035, drums: 0.14 },
	},
	boss: {
		bpm: 150,
		lead: bars(
			[69, 68, 69, _, 72, _, 69, _, 75, _, 74, _, 72, _, 69, _],
			[69, 68, 69, _, 72, _, 69, _, 76, _, 75, _, 74, _, 72, _],
			[70, 69, 70, _, 74, _, 70, _, 77, _, 76, _, 74, _, 70, _],
			[68, _, 71, _, 74, _, 77, _, 80, _, 77, _, 74, _, 71, _],
		),
		bass: bars(bassBar(45), bassBar(45), bassBar(46), bassBar(44)),
		arp: bars(arp(69, 3), arp(69, 3), arp(70, 4), arp(68, 3)),
		drums: 'k.hsk.hsk.hsk.hs'.repeat(4),
		mix: { lead: 0.08, bass: 0.18, arp: 0.03, drums: 0.15 },
	},
};

/** Music volume multiplier while a menu (cards, shop, pause) is open. */
export const MUSIC_DUCK = 0.3;
