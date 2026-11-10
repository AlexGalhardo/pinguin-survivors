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

	test('difficulty and weapon are validated', () => {
		expect(parseDebugParams('?difficulty=2&weapon=hammer')).toMatchObject({
			difficulty: 2,
			weapon: 'hammer',
		});
		expect(parseDebugParams('?difficulty=3&weapon=nope').difficulty).toBeUndefined();
		expect(parseDebugParams('?difficulty=3&weapon=nope').weapon).toBeUndefined();
		expect(parseDebugParams('?difficulty=0').difficulty).toBe(0);
	});

	test('arena forces the side, clamped to the maximum', () => {
		expect(parseDebugParams('?arena=12').arena).toBe(12);
		expect(parseDebugParams('?arena=99').arena).toBe(40);
		expect(parseDebugParams('?arena=0').arena).toBeUndefined();
		expect(parseDebugParams('?arena=x').arena).toBeUndefined();
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
