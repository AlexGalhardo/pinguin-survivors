import type { WeaponBehavior } from '../data/weapons';

/**
 * Brotato-style weapon animation (P-56): the weapon sprite moves around the hero instead of
 * baked character frames. Pure so timings are testable; angles in radians, offsets in px.
 */
export interface WeaponPose {
	/** Added to the aim angle. */
	angle: number;
	/** Distance from the hero's hand along the aim (negative = recoil). */
	reach: number;
	scale: number;
	/** 0..1 muzzle flash / staff glow intensity. */
	glow: number;
}

export const WEAPON_ANIM = {
	/** Swing length as a fraction of the cooldown, clamped. */
	swingShare: 0.45,
	swingMin: 0.1,
	swingMax: 0.28,
	recoilTime: 0.12,
	recoil: 5,
	kick: 0.35,
	castTime: 0.2,
	idleReach: 12,
} as const;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export function swingDuration(cooldown: number): number {
	const w = WEAPON_ANIM;
	return Math.min(w.swingMax, Math.max(w.swingMin, cooldown * w.swingShare));
}

/**
 * Pose `t` seconds after the last attack. `arc` is the melee arc width (radians);
 * before the first attack pass t = Infinity.
 */
export function weaponPose(
	kind: WeaponBehavior,
	t: number,
	cooldown: number,
	arc: number,
): WeaponPose {
	const w = WEAPON_ANIM;
	if (kind === 'arc') {
		const d = swingDuration(cooldown);
		if (t >= d) return { angle: arc / 2, reach: w.idleReach, scale: 1, glow: 0 };
		const k = easeOutCubic(Math.max(0, t) / d);
		// Wind-up on one side, slash through the arc, stretched out at mid-swing.
		return {
			angle: -arc / 2 + arc * k,
			reach: w.idleReach + 6 * Math.sin(k * Math.PI),
			scale: 1.1,
			glow: 1 - k,
		};
	}
	if (kind === 'spread') {
		if (t >= w.recoilTime) return { angle: 0, reach: w.idleReach, scale: 1, glow: 0 };
		const k = 1 - Math.max(0, t) / w.recoilTime;
		return { angle: -w.kick * k, reach: w.idleReach - w.recoil * k, scale: 1, glow: k };
	}
	if (t >= w.castTime) return { angle: -0.15, reach: w.idleReach, scale: 1, glow: 0 };
	const k = 1 - Math.max(0, t) / w.castTime;
	return { angle: -0.15 - 0.5 * k, reach: w.idleReach + 4 * k, scale: 1 + 0.15 * k, glow: k };
}
