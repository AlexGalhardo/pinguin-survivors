import { describe, expect, test } from 'bun:test';
import { parseDebugParams } from '../src/debug/params';

describe('parseDebugParams', () => {
	test('reads every option', () => {
		expect(
			parseDebugParams('?skipMenu=1&hero=bob&round=10&seed=42&debug=true&god=1&tier=2'),
		).toEqual({
			seed: 42,
			hero: 'bob',
			round: 10,
			tier: 2,
			god: true,
			debug: true,
			skipMenu: true,
		});
	});

	test('ignores invalid values', () => {
		const p = parseDebugParams('?hero=mage&round=0&seed=-3&tier=4&god=yes');
		expect(p.hero).toBeUndefined();
		expect(p.round).toBeUndefined();
		expect(p.seed).toBeUndefined();
		expect(p.tier).toBeUndefined();
		expect(p.god).toBe(false);
	});
});
