import { expect, test } from 'bun:test';
import { COMBAT } from '../src/data/combat';
import { WEAPON_LINES, weaponColor } from '../src/data/weapons';

test('every weapon line has its own color, far enough from the others to tell apart', () => {
	expect(WEAPON_LINES).toHaveLength(17);
	const colors = WEAPON_LINES.map((w) => weaponColor(w.id));
	expect(colors.every((c) => typeof c === 'number')).toBe(true);
	expect(new Set(colors).size).toBe(17);
	const dist = (a: number, b: number): number =>
		Math.hypot(
			(a >> 16) - (b >> 16),
			((a >> 8) & 255) - ((b >> 8) & 255),
			(a & 255) - (b & 255),
		);
	for (let i = 0; i < colors.length; i++)
		for (let j = i + 1; j < colors.length; j++) {
			expect(dist(colors[i] as number, colors[j] as number)).toBeGreaterThan(40);
		}
});

test('hero actives have no weapon color', () => {
	expect(weaponColor('stomp')).toBeUndefined();
});

test('a parry returns half of the blocked damage', () => {
	expect(COMBAT.parryReflect).toBe(0.5);
});
