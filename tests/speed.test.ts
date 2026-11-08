import { expect, test } from 'bun:test';
import { GAME_SPEEDS } from '../src/config/constants';
import { nextSpeed } from '../src/logic/speed';

test('TAB cycles 1x, 2x, 3x, 4x and back', () => {
	expect(GAME_SPEEDS).toEqual([1, 2, 3, 4]);
	expect([1, 2, 3, 4].map((s) => nextSpeed(s as 1 | 2 | 3 | 4))).toEqual([2, 3, 4, 1]);
});

test('the saved game speed survives a reload and bad values fall back to 1x', async () => {
	const { parseSave, SAVE_VERSION } = await import('../src/logic/save');
	const make = (gameSpeed: unknown): string =>
		JSON.stringify({ version: SAVE_VERSION, settings: { gameSpeed } });
	expect(parseSave(make(4)).settings.gameSpeed).toBe(4);
	expect(parseSave(make(7)).settings.gameSpeed).toBe(1);
	expect(parseSave(make('2')).settings.gameSpeed).toBe(1);
	expect(parseSave(null).settings.gameSpeed).toBe(1);
});
