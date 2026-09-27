import { expect, test } from 'bun:test';
import {
	addCharge,
	chargeFor,
	superCost,
	superReady,
	superUnlocked,
} from '../src/logic/superpower';

test('each cast makes the next one cost 5 more kills', () => {
	expect(superCost(0)).toBe(100);
	expect(superCost(1)).toBe(105);
	expect(superCost(2)).toBe(110);
	expect(superReady(104, 9, superCost(1))).toBe(false);
	expect(superReady(105, 9, superCost(1))).toBe(true);
	expect(addCharge(100, 10, superCost(2))).toBe(110);
});

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
