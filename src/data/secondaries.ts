import type { HeroId } from '../config/constants';
import type { DamageTag, Element } from '../logic/combat';

/**
 * Hero-exclusive actives (levels 1-5) that are not weapon slots: they come from level-up cards
 * (docs/gdd.md §5.1 and §9). Weapons themselves live in `weapons.ts` (SDD-002). Level scaling:
 * +50% damage per level above 1.
 */
export type SecondaryBehavior = 'stomp' | 'chain' | 'meteor' | 'nova';

export interface SecondaryDef {
	id: string;
	tag: DamageTag;
	behavior: SecondaryBehavior;
	damage: number;
	/** Seconds between activations (orbit: per-enemy hit cooldown). */
	cooldown: number;
	range: number;
	/** Area radius, orbit radius or projectile count depending on behavior. */
	radius?: number;
	count?: number;
	element?: Element;
	/** Exclusive to one hero (only offered to them). */
	hero?: HeroId;
	/** Extra count per level (thrown/orbit/meteor/boomerang/mine). */
	countPerLevel?: number;
	/** Enemies a projectile passes through (crossbow bolts). */
	pierce?: number;
	/** Seconds a deployable lasts (mine, totem, cloud). */
	duration?: number;
}

export const SECONDARIES = {
	seismicStomp: {
		id: 'seismicStomp',
		tag: 'melee',
		behavior: 'stomp',
		damage: 20,
		cooldown: 6,
		range: 110,
		radius: 110,
		element: 'earth',
		hero: 'jack',
	},
	arcaneChain: {
		id: 'arcaneChain',
		tag: 'magic',
		behavior: 'chain',
		damage: 18,
		cooldown: 2,
		range: 200,
		count: 5,
		element: 'energy',
		hero: 'lucia',
	},
	meteorShower: {
		id: 'meteorShower',
		tag: 'magic',
		behavior: 'meteor',
		damage: 40,
		cooldown: 4,
		range: 280,
		radius: 60,
		count: 3,
		element: 'fire',
		hero: 'lucia',
	},
	frostNova: {
		id: 'frostNova',
		tag: 'magic',
		behavior: 'nova',
		damage: 10,
		cooldown: 8,
		range: 120,
		radius: 120,
		element: 'ice',
		hero: 'lucia',
	},
} as const satisfies Record<string, SecondaryDef>;

/** Deployable tuning: totem zap interval, mine arming delay/trigger, boomerang flight speed. */
export const DEPLOYABLES = {
	totemZap: 0.8,
	mineArm: 0.6,
	mineTrigger: 26,
	maxMines: 12,
	boomerangSpeed: 330,
} as const;

export type SecondaryId = keyof typeof SECONDARIES;
export const MAX_SECONDARY_SLOTS = 3;
export const MAX_LEVEL = 5;
export const LEVEL_DAMAGE_STEP = 0.5;

/** Passive hero-exclusive perks (levels 1–5, +50% of the value per level). */
export const PERKS = {
	bloodlust: { id: 'bloodlust', hero: 'jack', value: 0.02, cap: 0.2 },
	counterAttack: { id: 'counterAttack', hero: 'jack', value: 2, radius: 90 },
	ironSkin: { id: 'ironSkin', hero: 'jack', value: 6, thorns: 0.1 },
	butcher: { id: 'butcher', hero: 'jack', value: 0.15, heal: 0.03 },
	hollowPoints: { id: 'hollowPoints', hero: 'bob', value: 1 },
	ricochet: { id: 'ricochet', hero: 'bob', value: 1, share: 0.7, range: 120 },
	runAndGun: { id: 'runAndGun', hero: 'bob', value: 0.15 },
	reflex: { id: 'reflex', hero: 'bob', value: 2 },
	elementalAttunement: { id: 'elementalAttunement', hero: 'lucia', value: 0.05, cap: 0.2 },
	arcaneBarrier: { id: 'arcaneBarrier', hero: 'lucia', value: 10 },
	toxicBloom: { id: 'toxicBloom', hero: 'lucia', value: 8, radius: 60 },
	// SDD-002 RF-07: replace the exclusives that became weapons. Effects are read by systems in T2.3+.
	ironBreath: { id: 'ironBreath', hero: 'jack', value: 0.15, radius: 120, cap: 3 },
	quickReload: { id: 'quickReload', hero: 'bob', value: 0.2, duration: 2 },
	arcaneEcho: { id: 'arcaneEcho', hero: 'lucia', value: 6 },
} as const;

export type PerkId = keyof typeof PERKS;

/** Level multiplier shared by secondaries and perks: 1, 1.5, 2, 2.5, 3. */
export function levelScale(level: number): number {
	return 1 + LEVEL_DAMAGE_STEP * (level - 1);
}
