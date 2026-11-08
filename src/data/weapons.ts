import type { HeroId } from '../config/constants';
import type { DamageTag } from '../logic/combat';

/** Signature weapons per hero and tier (docs/balancing-and-simulation.md §6). Distances in world units. */
export type WeaponKind = 'arc' | 'spread' | 'bolt';

export interface SignatureWeapon {
	id: string;
	tag: DamageTag;
	kind: WeaponKind;
	damage: number;
	/** Attacks per second. */
	rate: number;
	range: number;
	/** Arc width (arc) or spread cone (spread), degrees. */
	angle?: number;
	/** Projectiles per attack (spread). */
	count?: number;
	projectileSpeed?: number;
	/** Extra enemies a projectile passes through. */
	pierce?: number;
	bleedChance?: number;
}

/** Lucia's fire bolts splash on impact (share of the hit, radius in world units). */
export const MAGIC_FIRE_SPLASH = { radius: 36, share: 0.5 } as const;

export const SIGNATURE: Record<HeroId, [SignatureWeapon, SignatureWeapon, SignatureWeapon]> = {
	jack: [
		{
			id: 'machete',
			tag: 'melee',
			kind: 'arc',
			damage: 14,
			rate: 1.4,
			range: 150,
			angle: 140,
			bleedChance: 0.15,
		},
		{
			id: 'katana',
			tag: 'melee',
			kind: 'arc',
			damage: 26,
			rate: 1.8,
			range: 180,
			angle: 170,
			bleedChance: 0.25,
		},
		{
			id: 'chainsword',
			tag: 'melee',
			kind: 'arc',
			damage: 48,
			rate: 2.2,
			range: 195,
			angle: 200,
			bleedChance: 0.4,
		},
	],
	bob: [
		{
			id: 'doubleBarrel',
			tag: 'firearm',
			kind: 'spread',
			damage: 8,
			rate: 1.1,
			range: 220,
			angle: 30,
			count: 6,
			projectileSpeed: 480,
		},
		{
			id: 'autoShotgun',
			tag: 'firearm',
			kind: 'spread',
			damage: 9,
			rate: 1.6,
			range: 240,
			angle: 35,
			count: 7,
			projectileSpeed: 500,
			pierce: 1,
		},
		{
			id: 'rocketShotgun',
			tag: 'firearm',
			kind: 'spread',
			damage: 10,
			rate: 1.4,
			range: 260,
			angle: 35,
			count: 7,
			projectileSpeed: 520,
			pierce: 1,
		},
	],
	lucia: [
		{
			id: 'elementStaff',
			tag: 'magic',
			kind: 'bolt',
			damage: 16,
			rate: 1.3,
			range: 260,
			projectileSpeed: 300,
			pierce: 1,
		},
		{
			id: 'arcaneStaff',
			tag: 'magic',
			kind: 'bolt',
			damage: 24,
			rate: 1.4,
			range: 280,
			projectileSpeed: 320,
			pierce: 1,
		},
		{
			id: 'stormStaff',
			tag: 'magic',
			kind: 'bolt',
			damage: 30,
			rate: 1.8,
			range: 300,
			projectileSpeed: 340,
			pierce: 2,
		},
	],
};
