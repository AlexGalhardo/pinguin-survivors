import { describe, expect, it } from 'bun:test';
import { applyDeadzone, BUTTON_KEYS, buttonEdges, PAD, stickDirection } from '../src/logic/gamepad';

describe('gamepad', () => {
	it('ignores small stick drift and rescales outside the deadzone', () => {
		expect(applyDeadzone(0.1, 0.1, 0.2)).toEqual({ x: 0, y: 0 });
		const full = applyDeadzone(1, 0, 0.2);
		expect(full.x).toBeCloseTo(1);
		const half = applyDeadzone(0.6, 0, 0.2);
		expect(half.x).toBeCloseTo(0.5);
	});

	it('detects pressed and released buttons', () => {
		expect(buttonEdges([false, true], [true, false])).toEqual({ pressed: [0], released: [1] });
		expect(buttonEdges([], [false, false, true])).toEqual({ pressed: [2], released: [] });
	});

	it('maps the stick to menu directions', () => {
		expect(stickDirection(0.1, 0.2, 0.5)).toBeNull();
		expect(stickDirection(0.9, 0.2, 0.5)).toBe('ArrowRight');
		expect(stickDirection(-0.2, -0.8, 0.5)).toBe('ArrowUp');
	});

	it('maps Cross to confirm, Circle/Options to back and the d-pad to arrows', () => {
		expect(BUTTON_KEYS[PAD.south]).toBe('Enter');
		expect(BUTTON_KEYS[PAD.east]).toBe('Escape');
		expect(BUTTON_KEYS[PAD.start]).toBe('Escape');
		expect(BUTTON_KEYS[PAD.left]).toBe('ArrowLeft');
	});
});
