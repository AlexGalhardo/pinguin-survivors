import { expect, test } from 'bun:test';
import { formatTime } from '../src/logic/format';

test('formatTime rounds up and pads seconds', () => {
	expect(formatTime(180)).toBe('3:00');
	expect(formatTime(34.2)).toBe('0:35');
	expect(formatTime(-1)).toBe('0:00');
});
