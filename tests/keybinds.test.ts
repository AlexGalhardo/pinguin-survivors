import { describe, expect, test } from 'bun:test';
import { bindConflict, DEFAULT_BINDS, keyLabel, parseBinds, rebind } from '../src/logic/keybinds';

describe('keybinds', () => {
	test('bindConflict names the action that already owns a key', () => {
		const b = { ...DEFAULT_BINDS };
		expect(bindConflict(b, 'up', 'KeyS')).toBe('down');
		// Its own key and a free key are no conflict.
		expect(bindConflict(b, 'up', 'KeyW')).toBeNull();
		expect(bindConflict(b, 'up', 'KeyZ')).toBeNull();
	});

	test('rebind swaps on conflict and rejects reserved keys', () => {
		const b = { ...DEFAULT_BINDS };
		expect(rebind(b, 'up', 'KeyZ')).toBe(true);
		expect(b.up).toBe('KeyZ');
		expect(rebind(b, 'down', 'KeyZ')).toBe(true);
		expect(b.down).toBe('KeyZ');
		expect(b.up).toBe('KeyS');
		expect(rebind(b, 'pause', 'Escape')).toBe(false);
		expect(b.pause).toBe('KeyP');
	});

	test('parse is tolerant', () => {
		expect(parseBinds(null)).toEqual(DEFAULT_BINDS);
		expect(parseBinds({ up: 'KeyI', super: 42 })).toEqual({ ...DEFAULT_BINDS, up: 'KeyI' });
		expect(parseBinds({ up: 'KeyS' })).toEqual(DEFAULT_BINDS);
		expect(parseBinds({ pause: 'Enter' }).pause).toBe('KeyP');
	});

	test('labels', () => {
		expect(keyLabel('KeyW')).toBe('W');
		expect(keyLabel('Digit3')).toBe('3');
		expect(keyLabel('Space')).toBe('Space');
	});
});
