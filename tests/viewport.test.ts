import { describe, expect, test } from 'bun:test';
import { computeView } from '../src/logic/viewport';

describe('computeView (integer zoom by height, P-06)', () => {
	test.each([
		[2560, 1080, 2, 1280, 540],
		[1920, 1080, 2, 960, 540],
		[2560, 1440, 2, 1280, 720],
		[3840, 2160, 4, 960, 540],
		[1366, 768, 1, 1366, 768],
		[800, 400, 1, 800, 400],
	])('%ix%i → zoom %i, %ix%i logical', (w, h, zoom, lw, lh) => {
		expect(computeView(w, h)).toEqual({ zoom, width: lw, height: lh });
	});
});
