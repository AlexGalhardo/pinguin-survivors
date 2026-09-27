import { expect, test } from 'bun:test';
import { nextSpeed } from '../src/logic/speed';

test('TAB cycles 1x ↔ 2x', () => {
	expect(nextSpeed(1)).toBe(2);
	expect(nextSpeed(2)).toBe(1);
});
