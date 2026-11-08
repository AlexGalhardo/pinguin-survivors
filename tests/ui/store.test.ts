import { describe, expect, test } from 'bun:test';
import { paletteCss } from '../../scripts/export-palette-css';
import { bindCommands, commands } from '../../src/ui/commands';
import { createStore } from '../../src/ui/store';

describe('ui store', () => {
	test('set merges, notifies subscribers and unsubscribes', () => {
		const s = createStore({ a: 1, b: 2 });
		let calls = 0;
		const off = s.subscribe(() => calls++);
		s.set({ a: 5 });
		expect(s.get()).toEqual({ a: 5, b: 2 });
		off();
		s.set({ b: 9 });
		expect(calls).toBe(1);
	});
});

describe('game commands', () => {
	test('unbound commands are ignored; bound ones reach the game', () => {
		bindCommands({});
		expect(() => commands.pause()).not.toThrow();
		const bought: string[] = [];
		bindCommands({ buy: (id) => bought.push(id) });
		commands.buy('offer-1');
		expect(bought).toEqual(['offer-1']);
		bindCommands({});
	});
});

describe('theme tokens', () => {
	test('src/ui/palette.css is in sync with palette.ts', async () => {
		const file = await Bun.file(new URL('../../src/ui/palette.css', import.meta.url)).text();
		expect(file.replace(/\r\n/g, '\n')).toBe(paletteCss());
	});
});
