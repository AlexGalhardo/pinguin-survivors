import { WEAPON_ANIM } from '../data/weapon-anim';
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
	/** Sprite opacity (a thrown weapon is out of the hand for a moment). */
	alpha: number;
}

export { WEAPON_ANIM };

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
	lunge: number = WEAPON_ANIM.lunge,
): WeaponPose {
	const w = WEAPON_ANIM;
	const idle: WeaponPose = { angle: -0.15, reach: w.idleReach, scale: 1, glow: 0, alpha: 1 };
	if (kind === 'arc') {
		const d = swingDuration(cooldown);
		if (t >= d) return { ...idle, angle: arc / 2 };
		const k = easeOutCubic(Math.max(0, t) / d);
		// Wind-up on one side, then a lunge towards the target while the blade slashes through the arc.
		return {
			angle: -arc / 2 + arc * k,
			reach: w.idleReach + lunge * Math.sin(k * Math.PI),
			scale: 1.1,
			glow: 1 - k,
			alpha: 1,
		};
	}
	if (kind === 'spread' || kind === 'shooter') {
		if (t >= w.recoilTime) return { ...idle, angle: 0, scale: w.gunBase };
		const k = 1 - Math.max(0, t) / w.recoilTime;
		return {
			...idle,
			angle: -w.kick * k,
			reach: w.idleReach - w.recoil * k,
			scale: w.gunBase + w.gunScale * k,
			glow: k,
		};
	}
	if (kind === 'thrown' || kind === 'boomerang' || kind === 'lob') {
		if (t >= w.throwGone) return idle;
		if (t < w.throwTime) {
			// The hand pushes the weapon out towards the target and it leaves.
			const k = easeOutCubic(Math.max(0, t) / w.throwTime);
			return { ...idle, angle: 0, reach: w.idleReach + w.throwReach * k, alpha: 1 - 0.7 * k };
		}
		const k = (t - w.throwTime) / (w.throwGone - w.throwTime);
		return { ...idle, reach: w.idleReach, alpha: 0.3 + 0.7 * k };
	}
	if (kind === 'mine' || kind === 'totem' || kind === 'cloud') {
		if (t >= w.plantTime) return idle;
		const k = 1 - Math.max(0, t) / w.plantTime;
		return {
			angle: -0.15 + w.plantDip * k,
			reach: w.idleReach - 6 * k,
			scale: 1 - w.plantSquash * k * 0.5,
			glow: k,
			alpha: 1,
		};
	}
	if (kind === 'orbit' || kind === 'aura' || kind === 'follower') {
		if (t >= w.pulseTime) return idle;
		const k = 1 - Math.max(0, t) / w.pulseTime;
		return {
			angle: -0.15 + (kind === 'aura' ? 0 : w.spin * (1 - k)),
			reach: w.idleReach + (kind === 'orbit' ? lunge * Math.sin((1 - k) * Math.PI) : 0),
			scale: 1 + w.pulseScale * k,
			glow: k,
			alpha: 1,
		};
	}
	// Staff: lifts, pushes towards the target and pulses at the tip.
	if (t >= w.castTime) return idle;
	const k = 1 - Math.max(0, t) / w.castTime;
	return {
		angle: -0.15 - w.castLift * k,
		reach: w.idleReach + w.castPush * Math.sin((1 - k) * Math.PI),
		scale: 1 + w.castScale * k,
		glow: k,
		alpha: 1,
	};
}
