import { afterEach, describe, expect, test } from 'bun:test';
import {
	fireTouchAction,
	onTouchAction,
	stickVector,
	touchControlsEnabled,
	touchMove,
} from '../src/core/touch-bridge';
import type { Action } from '../src/logic/keybinds';

afterEach(() => {
	touchMove.x = 0;
	touchMove.y = 0;
});

describe('touch bridge', () => {
	test('stick vector scales with the drag and saturates at the radius', () => {
		expect(stickVector(0, 0, 50)).toEqual({ x: 0, y: 0 });
		expect(stickVector(25, 0, 50)).toEqual({ x: 0.5, y: 0 });
		const full = stickVector(300, 400, 50);
		expect(Math.hypot(full.x, full.y)).toBeCloseTo(1);
		expect(full.x).toBeCloseTo(0.6);
	});

	test('actions reach every listener until it unsubscribes', () => {
		const seen: Action[] = [];
		const off = onTouchAction((a) => seen.push(a));
		fireTouchAction('super');
		fireTouchAction('pause');
		off();
		fireTouchAction('speed');
		expect(seen).toEqual(['super', 'pause']);
	});

	test('controls show on the Android shell or with ?touch=1 only', () => {
		expect(touchControlsEnabled('capacitor', '')).toBe(true);
		expect(touchControlsEnabled('web', '?touch=1')).toBe(true);
		expect(touchControlsEnabled('web', '?touch=0')).toBe(false);
		expect(touchControlsEnabled('electron', '')).toBe(false);
	});
});
