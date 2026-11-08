import type { HeroId } from '../config/constants';
import { PALETTE } from '../config/palette';
import type { DamageTag, Element } from '../logic/combat';

/**
 * 1.0 weapon lines (SDD-002): one entry per weapon, 4 tiers each. Tier I = the old
 * signature/secondary numbers (docs/balancing-and-simulation.md §6); tiers II–IV derive from
 * `TIER_SCALE`. Not wired into the game yet: `weapons.ts` (SIGNATURE) and `secondaries.ts`
 * keep running until T2.3 swaps WeaponSystem to these lines.
 */
export type WeaponTier = 1 | 2 | 3 | 4;
export const WEAPON_TIERS = [1, 2, 3, 4] as const satisfies readonly WeaponTier[];

export const SET_IDS = [
	'blade',
	'blunt',
	'thrown',
	'gun',
	'explosive',
	'elemental',
	'support',
] as const;
export type SetId = (typeof SET_IDS)[number];

export type WeaponBehavior =
	| 'arc'
	| 'spread'
	| 'bolt'
	| 'thrown'
	| 'lob'
	| 'orbit'
	| 'shooter'
	| 'follower'
	| 'boomerang'
	| 'mine'
	| 'aura'
	| 'totem'
	| 'cloud';

export interface WeaponExtra {
	/** Arc width (arc) or spread cone (spread), degrees. */
	angle?: number;
	/** Projectiles / blades / mines per activation, depending on behavior. */
	count?: number;
	/** Extra enemies a projectile passes through. */
	pierce?: number;
	/** Area, orbit or aura radius in world units. */
	radius?: number;
	bleedChance?: number;
	/** Seconds a deployable lasts (mine, totem, cloud). */
	duration?: number;
	projectileSpeed?: number;
}

export interface WeaponTierStats {
	damage: number;
	/** Seconds between activations (orbit/aura: per-enemy hit cooldown). */
	cooldown: number;
	range: number;
	extra: WeaponExtra;
}

export interface WeaponDef {
	id: string;
	classTag: DamageTag;
	sets: readonly [SetId] | readonly [SetId, SetId];
	behavior: WeaponBehavior;
	element?: Element;
	/** Exclusive to one hero (only offered to them). */
	hero?: HeroId;
	tiers: readonly [WeaponTierStats, WeaponTierStats, WeaponTierStats, WeaponTierStats];
}

/** Per tier (I..IV): damage, cooldown, range and radius multipliers; tier IV DPS ≈ 3.5× tier I. */
const TIER_SCALE = {
	damage: [1, 1.5, 2.2, 3.1],
	cooldown: [1, 0.95, 0.9, 0.88],
	range: [1, 1.05, 1.1, 1.15],
	radius: [1, 1.1, 1.2, 1.3],
} as const;

interface Base {
	id: string;
	classTag: DamageTag;
	sets: WeaponDef['sets'];
	behavior: WeaponBehavior;
	element?: Element;
	hero?: HeroId;
	damage: number;
	cooldown: number;
	range: number;
	extra?: WeaponExtra;
	/** Added to `extra.count` per tier above I (floored). */
	countPerTier?: number;
}

const scale = (table: readonly number[], i: number): number => table[i] ?? 1;

function line<const I extends string>(b: Base & { id: I }): WeaponDef & { id: I } {
	const tiers = WEAPON_TIERS.map((tier): WeaponTierStats => {
		const i = tier - 1;
		const extra: WeaponExtra = { ...b.extra };
		if (extra.count !== undefined)
			extra.count = Math.floor(extra.count + (b.countPerTier ?? 0) * i);
		if (extra.pierce !== undefined && tier >= 3) extra.pierce += 1;
		if (extra.radius !== undefined)
			extra.radius = Math.round(extra.radius * scale(TIER_SCALE.radius, i));
		if (extra.bleedChance !== undefined)
			extra.bleedChance = Number((extra.bleedChance + 0.05 * i).toFixed(2));
		return {
			damage: Math.round(b.damage * scale(TIER_SCALE.damage, i)),
			cooldown: Number((b.cooldown * scale(TIER_SCALE.cooldown, i)).toFixed(3)),
			range: Math.round(b.range * scale(TIER_SCALE.range, i)),
			extra,
		};
	}) as unknown as WeaponDef['tiers'];
	return {
		id: b.id,
		classTag: b.classTag,
		sets: b.sets,
		behavior: b.behavior,
		...(b.element && { element: b.element }),
		...(b.hero && { hero: b.hero }),
		tiers,
	};
}

const LINES = [
	line({
		id: 'machete',
		classTag: 'melee',
		sets: ['blade'],
		behavior: 'arc',
		damage: 14,
		cooldown: 1 / 1.4,
		range: 150,
		extra: { angle: 140, bleedChance: 0.15 },
	}),
	line({
		id: 'hammer',
		classTag: 'melee',
		sets: ['blunt'],
		behavior: 'arc',
		damage: 22,
		cooldown: 1.2,
		range: 120,
		extra: { angle: 100 },
	}),
	line({
		id: 'knives',
		classTag: 'melee',
		sets: ['blade', 'thrown'],
		behavior: 'thrown',
		damage: 8,
		cooldown: 1.2,
		range: 240,
		extra: { count: 1 },
		countPerTier: 1,
	}),
	line({
		id: 'fishBoomerang',
		classTag: 'melee',
		sets: ['thrown'],
		behavior: 'boomerang',
		damage: 10,
		cooldown: 1.8,
		range: 200,
		extra: { count: 1 },
		countPerTier: 0.5,
	}),
	line({
		id: 'bladeWhirl',
		classTag: 'melee',
		sets: ['blade'],
		behavior: 'orbit',
		hero: 'jack',
		damage: 8,
		cooldown: 0.4,
		range: 70,
		extra: { count: 3 },
		countPerTier: 1,
	}),
	line({
		id: 'doubleBarrel',
		classTag: 'firearm',
		sets: ['gun'],
		behavior: 'spread',
		damage: 8,
		cooldown: 1 / 1.1,
		range: 220,
		extra: { angle: 30, count: 6, projectileSpeed: 480 },
	}),
	line({
		id: 'auxPistol',
		classTag: 'firearm',
		sets: ['gun'],
		behavior: 'shooter',
		damage: 7,
		cooldown: 0.6,
		range: 240,
	}),
	line({
		id: 'crossbow',
		classTag: 'firearm',
		sets: ['gun'],
		behavior: 'shooter',
		damage: 16,
		cooldown: 1.4,
		range: 320,
		extra: { pierce: 3 },
	}),
	line({
		id: 'molotov',
		classTag: 'firearm',
		sets: ['explosive', 'elemental'],
		behavior: 'lob',
		element: 'fire',
		damage: 6,
		cooldown: 3,
		range: 220,
		extra: { radius: 50 },
	}),
	line({
		id: 'mine',
		classTag: 'firearm',
		sets: ['explosive'],
		behavior: 'mine',
		damage: 35,
		cooldown: 2.5,
		range: 30,
		extra: { radius: 70, count: 3, duration: 20 },
		countPerTier: 1,
	}),
	line({
		id: 'grenadeBelt',
		classTag: 'firearm',
		sets: ['explosive'],
		behavior: 'lob',
		hero: 'bob',
		damage: 30,
		cooldown: 5,
		range: 240,
		extra: { radius: 70 },
	}),
	line({
		id: 'droneSentinel',
		classTag: 'firearm',
		sets: ['gun', 'support'],
		behavior: 'follower',
		hero: 'bob',
		damage: 6,
		cooldown: 1 / 3,
		range: 220,
	}),
	line({
		id: 'elementStaff',
		classTag: 'magic',
		sets: ['elemental'],
		behavior: 'bolt',
		damage: 16,
		cooldown: 1 / 1.3,
		range: 260,
		extra: { pierce: 1, projectileSpeed: 300 },
	}),
	line({
		id: 'iceShards',
		classTag: 'magic',
		sets: ['elemental'],
		behavior: 'orbit',
		element: 'ice',
		damage: 6,
		cooldown: 0.5,
		range: 60,
		extra: { count: 2 },
		countPerTier: 1,
	}),
	line({
		id: 'flameRing',
		classTag: 'magic',
		sets: ['elemental'],
		behavior: 'aura',
		element: 'fire',
		damage: 8,
		cooldown: 0.4,
		range: 75,
		extra: { radius: 75 },
	}),
	line({
		id: 'lightningTotem',
		classTag: 'magic',
		sets: ['elemental'],
		behavior: 'totem',
		element: 'energy',
		damage: 12,
		cooldown: 7,
		range: 170,
		extra: { count: 1, duration: 6 },
	}),
	line({
		id: 'poisonCloud',
		classTag: 'magic',
		sets: ['support'],
		behavior: 'cloud',
		damage: 5,
		cooldown: 4,
		range: 230,
		extra: { radius: 65, duration: 4 },
	}),
] as const satisfies readonly WeaponDef[];

export type WeaponId = (typeof LINES)[number]['id'];

export const WEAPON_LINES: readonly WeaponDef[] = LINES;

export const WEAPON_LINE_BY_ID: Readonly<Record<WeaponId, WeaponDef>> = Object.fromEntries(
	LINES.map((w) => [w.id, w]),
) as Record<WeaponId, WeaponDef>;

/** Placeholder tint by tier until the tier art lands: I gray, II green, III blue, IV gold. */
export const WEAPON_TIER_TINT: Readonly<Record<WeaponTier, number>> = {
	1: PALETTE.weaponTier1,
	2: PALETTE.weaponTier2,
	3: PALETTE.weaponTier3,
	4: PALETTE.weaponTier4,
};
