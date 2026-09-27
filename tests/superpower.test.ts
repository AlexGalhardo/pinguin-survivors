import { expect, test } from 'bun:test';
import { addCharge, chargeFor, superReady, superUnlocked } from '../src/logic/superpower';

test('unlocks at hero level 5 and needs 100 kills of charge (P-39)', () => {
	expect(superUnlocked(4)).toBe(false);
	expect(superUnlocked(5)).toBe(true);
	expect(superReady(100, 4)).toBe(false);
	expect(superReady(99, 9)).toBe(false);
	expect(superReady(100, 9)).toBe(true);
});

test('charge per kill and cap', () => {
	expect(chargeFor('common')).toBe(1);
	expect(chargeFor('elite')).toBe(3);
	expect(chargeFor('boss')).toBe(0);
	expect(addCharge(98, 3)).toBe(100);
});
