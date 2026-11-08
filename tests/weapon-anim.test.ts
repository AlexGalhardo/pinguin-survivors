import { describe, expect, test } from 'bun:test';
import { swingDuration, WEAPON_ANIM, weaponPose } from '../src/logic/weapon-anim';

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
			scale: WEAPON_ANIM.gunBase,
			glow: 0,
			alpha: 1,
		});
	});

	test('staff lifts and glows on cast', () => {
		expect(weaponPose('bolt', 0, 1, 0).glow).toBe(1);
		expect(weaponPose('bolt', 5, 1, 0).glow).toBe(0);
	});

	test('melee lunges towards the target and settles', () => {
		const mid = weaponPose('arc', swingDuration(0.7) / 2, 0.7, Math.PI / 2);
		expect(mid.reach).toBeGreaterThan(WEAPON_ANIM.idleReach + WEAPON_ANIM.lunge / 3);
		expect(weaponPose('arc', 5, 0.7, Math.PI / 2).reach).toBe(WEAPON_ANIM.idleReach);
	});

	test('pistols and crossbows recoil like shotguns', () => {
		expect(weaponPose('shooter', 0, 1, 0).reach).toBeLessThan(WEAPON_ANIM.idleReach);
		expect(weaponPose('shooter', 0, 1, 0).glow).toBe(1);
	});

	test('thrown weapons leave the hand and come back', () => {
		for (const kind of ['thrown', 'boomerang', 'lob'] as const) {
			const out = weaponPose(kind, WEAPON_ANIM.throwTime * 0.99, 1, 0);
			expect(out.reach).toBeGreaterThan(WEAPON_ANIM.idleReach + WEAPON_ANIM.throwReach / 2);
			expect(out.alpha).toBeLessThan(0.5);
			expect(weaponPose(kind, 5, 1, 0).alpha).toBe(1);
		}
	});

	test('planted weapons dip and orbiting ones spin, then both idle', () => {
		for (const kind of ['mine', 'totem', 'cloud'] as const) {
			expect(weaponPose(kind, 0, 1, 0).angle).toBeGreaterThan(0.3);
			expect(weaponPose(kind, 5, 1, 0).glow).toBe(0);
		}
		for (const kind of ['orbit', 'follower'] as const) {
			const half = weaponPose(kind, WEAPON_ANIM.pulseTime / 2, 1, 0);
			expect(Math.abs(half.angle)).toBeGreaterThan(1);
			expect(weaponPose(kind, 5, 1, 0).scale).toBe(1);
		}
		expect(weaponPose('aura', 0, 1, 0).scale).toBeGreaterThan(1);
	});

	test('the lunge stops at the given distance and the staff pushes towards the target', () => {
		const mid = swingDuration(0.7) / 2;
		expect(weaponPose('arc', mid, 0.7, 1, 0).reach).toBe(WEAPON_ANIM.idleReach);
		expect(weaponPose('arc', mid, 0.7, 1, 20).reach).toBeLessThan(
			weaponPose('arc', mid, 0.7, 1, 90).reach,
		);
		expect(weaponPose('bolt', WEAPON_ANIM.castTime / 2, 1, 0).reach).toBeGreaterThan(
			WEAPON_ANIM.idleReach,
		);
		expect(weaponPose('bolt', 0, 1, 0).angle).toBeLessThan(-0.5);
	});
});
