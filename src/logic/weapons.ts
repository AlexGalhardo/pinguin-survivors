import {
	WEAPON_LINE_BY_ID,
	type WeaponBehavior,
	type WeaponId,
	type WeaponTier,
	weaponTierStats,
} from '../data/weapons';
import type { DamageTag, Element } from './combat';

/** A weapon slot flattened for the systems: line + tier stats in one plain object. */
export interface ActiveWeapon {
	id: WeaponId;
	tier: WeaponTier;
	tag: DamageTag;
	behavior: WeaponBehavior;
	element?: Element;
	damage: number;
	/** Seconds between activations (orbit/aura: per-enemy hit cooldown). */
	cooldown: number;
	range: number;
	/** Arc width (arc) or spread cone (spread), degrees. */
	angle: number;
	count: number;
	pierce: number;
	radius: number;
	bleedChance: number;
	duration: number;
	projectileSpeed: number;
}

/** Weapons that hit by themselves (swing or fire projectiles); the rest are deployables. */
export const DIRECT_BEHAVIORS: readonly WeaponBehavior[] = ['arc', 'spread', 'bolt'];

export const isDirect = (w: ActiveWeapon): boolean => DIRECT_BEHAVIORS.includes(w.behavior);

const cache = new Map<string, ActiveWeapon>();

/** Flattens a slot; results are cached per (id, tier) so per-frame loops do not allocate. */
export function resolveWeapon(inst: { id: WeaponId; tier: WeaponTier }): ActiveWeapon {
	const key = `${inst.id}:${inst.tier}`;
	const hit = cache.get(key);
	if (hit) return hit;
	const def = WEAPON_LINE_BY_ID[inst.id];
	const t = weaponTierStats(def, inst.tier);
	const x = t.extra;
	const w: ActiveWeapon = {
		id: inst.id,
		tier: inst.tier,
		tag: def.classTag,
		behavior: def.behavior,
		element: def.element,
		damage: t.damage,
		cooldown: t.cooldown,
		range: t.range,
		angle: x.angle ?? (def.behavior === 'spread' ? 30 : 90),
		count: x.count ?? 1,
		pierce: x.pierce ?? 0,
		radius: x.radius ?? 0,
		bleedChance: x.bleedChance ?? 0,
		duration: x.duration ?? 0,
		projectileSpeed: x.projectileSpeed ?? 400,
	};
	cache.set(key, w);
	return w;
}

/** Highest single-activation damage in the build: the base of superpowers and counters. */
export function leadWeapon(
	slots: readonly { id: WeaponId; tier: WeaponTier }[],
): ActiveWeapon | null {
	let best: ActiveWeapon | null = null;
	for (const s of slots) {
		const w = resolveWeapon(s);
		if (!best || w.damage * w.count > best.damage * best.count) best = w;
	}
	return best;
}

/** Angle of ring slot `i` of `n` after `time` seconds of slow rotation (radians). */
export function ringAngle(i: number, n: number, time: number, speed: number): number {
	return (i / Math.max(1, n)) * Math.PI * 2 + time * speed;
}
