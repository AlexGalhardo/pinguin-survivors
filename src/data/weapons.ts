import type { HeroId } from '../config/constants';
import type { DamageTag } from '../logic/combat';

/** Signature weapons per hero and tier (docs/balancing.md §6). Distances in world units. */
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

export const SIGNATURE: Record<HeroId, [SignatureWeapon, SignatureWeapon, SignatureWeapon]> = {
	jack: [
		{
			id: 'machete',
			tag: 'melee',
			kind: 'arc',
			damage: 14,
			rate: 1.4,
			range: 105,
			angle: 110,
			bleedChance: 0.15,
		},
		{
			id: 'katana',
			tag: 'melee',
			kind: 'arc',
			damage: 26,
			rate: 1.8,
			range: 128,
			angle: 140,
			bleedChance: 0.25,
		},
		{
			id: 'chainsword',
			tag: 'melee',
			kind: 'arc',
			damage: 48,
			rate: 2.2,
			range: 135,
			angle: 160,
			bleedChance: 0.4,
		},
	],
	bob: [
		{
			id: 'doubleBarrel',
			tag: 'firearm',
			kind: 'spread',
			damage: 7,
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
			damage: 8,
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
