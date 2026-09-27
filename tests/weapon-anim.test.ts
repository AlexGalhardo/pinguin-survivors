import { describe, expect, test } from 'bun:test';
import { screenAngle, swingDuration, WEAPON_ANIM, weaponPose } from '../src/logic/weapon-anim';

describe('weapon animation (P-56)', () => {
	test('melee swings through the whole arc within the swing time', () => {
		const arc = Math.PI / 2;
		expect(weaponPose('arc', 0, 0.7, arc).angle).toBeCloseTo(-arc / 2);
		expect(weaponPose('arc', 10, 0.7, arc).angle).toBeCloseTo(arc / 2);
		const mid = weaponPose('arc', swingDuration(0.7) / 2, 0.7, arc);
		expect(mid.angle).toBeGreaterThan(-arc / 2);
		expect(mid.reach).toBeGreaterThan(WEAPON_ANIM.idleReach);
	});

	test('swing time follows the cooldown, clamped', () => {
		expect(swingDuration(0.1)).toBe(WEAPON_ANIM.swingMin);
		expect(swingDuration(2)).toBe(WEAPON_ANIM.swingMax);
	});

	test('guns recoil and flash, then settle', () => {
		const shot = weaponPose('spread', 0, 1, 0);
		expect(shot.reach).toBeLessThan(WEAPON_ANIM.idleReach);
		expect(shot.glow).toBe(1);
		expect(weaponPose('spread', 1, 1, 0)).toEqual({
			angle: 0,
			reach: WEAPON_ANIM.idleReach,
			scale: 1,
			glow: 0,
		});
	});

	test('staff lifts and glows on cast', () => {
		expect(weaponPose('bolt', 0, 1, 0).glow).toBe(1);
		expect(weaponPose('bolt', 5, 1, 0).glow).toBe(0);
	});

	test('world axes map to 2:1 screen angles', () => {
		expect(screenAngle(0)).toBeCloseTo(Math.atan2(0.5, 1));
		expect(screenAngle(Math.PI / 4)).toBeCloseTo(Math.PI / 2);
	});
});
