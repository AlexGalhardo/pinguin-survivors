import { describe, expect, it } from 'bun:test';
import { claimKeyEvent } from '../src/logic/key-claim';

describe('claimKeyEvent', () => {
	it('lets only the first listener consume a key event', () => {
		const e = {};
		expect(claimKeyEvent(e)).toBe(true);
		// A second menu activated by the first one must not react to the same Enter press.
		expect(claimKeyEvent(e)).toBe(false);
	});

	it('treats every new key event independently', () => {
		expect(claimKeyEvent({})).toBe(true);
		expect(claimKeyEvent({})).toBe(true);
	});
});
