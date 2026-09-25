import { TEX } from '../art/manifest';
import type { WeaponId } from './characters';

export interface WeaponDef {
	id: WeaponId;
	kind: 'melee' | 'projectile';
	damage: number;
	/** Seconds between attacks (before Attack Speed). */
	cooldown: number;
	/** Targeting range in px (before Range%). */
	range: number;
	/** Melee: total arc in degrees. */
	arc?: number;
	knockback?: number;
	projectileSpeed?: number;
	projectileTexture?: string;
	pierce?: number;
	/** Projectile homing turn rate (rad/s) toward the aimed enemy. */
	homing?: number;
	/** Spread between multiple projectiles, degrees. */
	spread?: number;
	sfx: string;
}

/**
 * Starting weapons (docs/balancing.md §3). User playtest 2026-09-25: Energy Blade +50% damage,
 * attack speed and range; Psi Orb +25% damage and attack speed; Blaster −20% damage and attack speed.
 */
export const WEAPONS: Record<WeaponId, WeaponDef> = {
	energy_blade: {
		id: 'energy_blade',
		kind: 'melee',
		damage: 18,
		cooldown: 0.6,
		range: 78,
		arc: 120,
		knockback: 120,
		spread: 30,
		sfx: 'sfx.blade',
	},
	blaster: {
		id: 'blaster',
		kind: 'projectile',
		damage: 8,
		cooldown: 0.44,
		range: 260,
		projectileSpeed: 380,
		projectileTexture: TEX.projBlaster,
		pierce: 0,
		spread: 10,
		sfx: 'sfx.blaster',
	},
	psi_orb: {
		id: 'psi_orb',
		kind: 'projectile',
		damage: 7.5,
		cooldown: 0.64,
		range: 220,
		projectileSpeed: 180,
		homing: 3,
		projectileTexture: TEX.projPsiOrb,
		pierce: 3,
		spread: 15,
		sfx: 'sfx.psi',
	},
};

/** Enemy count above which auto-target uses the spatial grid (docs/architecture.md). */
export const GRID_TARGET_THRESHOLD = 150;

/** Melee hits reach a bit beyond the weapon range to account for enemy radius. */
export const MELEE_REACH_BONUS = 8;
