import { describe, expect, test } from 'bun:test';
import { pickFrames } from '../scripts/pick-frames';

describe('pickFrames (boss attack cleanup)', () => {
	test.each([
		[
			'clean set drops the reference frame',
			[500, 510, 490, 505, 495, 500, 510, 490, 500],
			[1, 2, 3, 4, 5, 6, 7, 8],
		],
		[
			'impact frames are dropped and the peak held',
			[600, 540, 590, 550, 1600, 1300, 570, 555, 600],
			[0, 1, 2, 3, 3, 6, 7, 8],
		],
		[
			'all effect frames fall back to the reference',
			[10, 900, 900, 900, 900, 900, 900, 900, 900],
			[0, 0, 0, 0, 0, 0, 0, 0],
		],
	])('%s', (_name, counts, want) => {
		expect(pickFrames(counts)).toEqual(want);
	});

	test('always returns 8 frames in order', () => {
		const out = pickFrames([50, 60, 2000, 55, 58, 2100, 52, 51, 53]);
		expect(out).toHaveLength(8);
		expect([...out].sort((a, b) => a - b)).toEqual(out);
	});
});
