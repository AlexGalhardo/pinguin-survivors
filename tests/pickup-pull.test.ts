import { describe, expect, test } from 'bun:test';
import { MAGNETIC } from '../src/data/support';
import { pickupPull, ROUND_FLUSH_MAX, roundFlushDone } from '../src/logic/pickup-pull';
import { magnetBonus } from '../src/logic/support';

const none = magnetBonus({});
const lvl3 = magnetBonus({ magnetic: 3 });

describe('pickupPull', () => {
	test('Magnetic widens the pull for XP and Fish only by its radius', () => {
		const d = 60 + MAGNETIC.radius[2] - 1;
		expect(pickupPull('fish', d, 60, none, false).start).toBe(false);
		expect(pickupPull('fish', d, 60, lvl3, false).start).toBe(true);
		expect(pickupPull('xp', d, 60, lvl3, false).speed).toBeGreaterThan(
			pickupPull('xp', d, 60, none, false).speed,
		);
	});
	test('gear and potions are pulled inside the plain pickup range', () => {
		expect(pickupPull('gear', 50, 60, none, false).start).toBe(true);
		expect(pickupPull('gear', 100, 60, lvl3, false).start).toBe(false);
	});
	test('vacuum pulls everything', () => {
		expect(pickupPull('potion', 9999, 60, none, true).start).toBe(true);
	});
});

describe('roundFlushDone', () => {
	test('ends when the ground is empty or at the cap, never earlier', () => {
		expect(roundFlushDone(true, 0.5)).toBe(false);
		expect(roundFlushDone(false, 0.1)).toBe(true);
		expect(roundFlushDone(true, ROUND_FLUSH_MAX)).toBe(true);
	});
});
