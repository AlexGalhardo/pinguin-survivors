import { expect, test } from 'bun:test';
import { GAME_SPEEDS, type GameSpeed, MAX_STEP } from '../src/config/constants';
import { spawnRate } from '../src/logic/round';
import { nextSpeed, parseGameSpeed, speedFactors } from '../src/logic/speed';

test('TAB cycles 1x, 1.5x, 2x and back', () => {
	expect(GAME_SPEEDS).toEqual([1, 1.5, 2]);
	expect(GAME_SPEEDS.map(nextSpeed)).toEqual([1.5, 2, 1]);
});

test.each([
	[1, 2, 1],
	[1.5, 3, 1.5],
	[2, 4, 2],
] as const)('speed %p: motion %p, clock %p', (s, motion, clock) => {
	expect(speedFactors(s)).toEqual({ motion, clock });
});

/** Simulates `real` seconds of frames the way GameScene.update does. */
function simulate(speed: GameSpeed, real: number, frame = 1 / 60) {
	const f = speedFactors(speed);
	let timeLeft = 30;
	let distance = 0;
	let spawned = 0;
	const v = 100;
	for (let t = 0; t < real - 1e-9; t += frame) {
		const dt = frame * f.motion;
		const clockDt = frame * f.clock;
		const steps = Math.ceil(dt / MAX_STEP);
		for (let i = 0; i < steps; i++) {
			timeLeft -= clockDt / steps;
			distance += (v * dt) / steps;
			spawned += (spawnRate(1) * clockDt) / steps;
		}
	}
	return { timeLeft, distance, spawned };
}

test('a 30 s round lasts 30 s real at 1x and 15 s real at 2x', () => {
	expect(simulate(1, 30).timeLeft).toBeCloseTo(0, 3);
	expect(simulate(2, 15).timeLeft).toBeCloseTo(0, 3);
	expect(simulate(1.5, 20).timeLeft).toBeCloseTo(0, 3);
});

test('the new 1x moves twice as far per real second as the old 1x; 2x four times', () => {
	expect(simulate(1, 1).distance).toBeCloseTo(200, 3);
	expect(simulate(2, 1).distance).toBeCloseTo(400, 3);
});

test('a round spawns the same count at any speed', () => {
	const at = (s: GameSpeed) => simulate(s, 30 / s).spawned;
	expect(at(1)).toBeCloseTo(spawnRate(1) * 30, 3);
	expect(at(1.5)).toBeCloseTo(at(1), 3);
	expect(at(2)).toBeCloseTo(at(1), 3);
});

test.each([
	[1, 1],
	[1.5, 1.5],
	[2, 2],
	[3, 2],
	[4, 2],
	[7, 2],
	['2', 1],
	[null, 1],
	[0, 1],
] as const)('saved gameSpeed %p becomes %p', (value, expected) => {
	expect(parseGameSpeed(value, 1)).toBe(expected);
});

test('the saved game speed survives a reload and bad values fall back', async () => {
	const { parseSave, SAVE_VERSION } = await import('../src/logic/save');
	const make = (gameSpeed: unknown): string =>
		JSON.stringify({ version: SAVE_VERSION, settings: { gameSpeed } });
	expect(parseSave(make(1.5)).settings.gameSpeed).toBe(1.5);
	expect(parseSave(make(4)).settings.gameSpeed).toBe(2);
	expect(parseSave(make('2')).settings.gameSpeed).toBe(1);
	expect(parseSave(null).settings.gameSpeed).toBe(1);
});
