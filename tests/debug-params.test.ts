import { describe, expect, it } from 'bun:test';
import { parseDebugParams } from '../src/debug/params';

describe('parseDebugParams', () => {
	it('returns defaults for an empty query', () => {
		expect(parseDebugParams('')).toEqual({
			seed: undefined,
			char: undefined,
			wave: undefined,
			god: false,
			debug: false,
			skipMenu: false,
			unlockAll: false,
		});
	});

	it('parses all known params', () => {
		expect(parseDebugParams('?seed=123&char=mage&wave=10&god=1&debug=true&skipMenu=1')).toEqual(
			{
				seed: 123,
				char: 'mage',
				wave: 10,
				god: true,
				debug: true,
				skipMenu: true,
				unlockAll: false,
			},
		);
	});

	it('ignores invalid values', () => {
		const p = parseDebugParams('?seed=abc&char=paladin&wave=0&god=yes');
		expect(p.seed).toBeUndefined();
		expect(p.char).toBeUndefined();
		expect(p.wave).toBeUndefined();
		expect(p.god).toBe(false);
	});
});
