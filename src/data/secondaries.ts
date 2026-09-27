import type { HeroId } from '../config/constants';
import type { DamageTag, Element } from '../logic/combat';

/**
 * Secondary weapons (max 3 slots, levels 1–5) and hero-exclusive abilities that behave like
 * weapons (docs/game-design.md §5.1 and §9, balancing §4.1). Level scaling: +50% damage per
 * level above 1 unless the weapon says otherwise.
 */
export type SecondaryBehavior =
	| 'thrown'
	| 'lob'
	| 'orbit'
	| 'shooter'
	| 'follower'
	| 'stomp'
	| 'chain'
	| 'meteor'
	| 'nova'
	| 'boomerang'
	| 'mine'
	| 'aura'
	| 'totem'
	| 'cloud';

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
	knives: {
		id: 'knives',
		tag: 'melee',
		behavior: 'thrown',
		damage: 8,
		cooldown: 1.2,
		range: 240,
		count: 1,
		countPerLevel: 1,
	},
	molotov: {
		id: 'molotov',
		tag: 'firearm',
		behavior: 'lob',
		damage: 6,
		cooldown: 3,
		range: 220,
		radius: 50,
		element: 'fire',
	},
	iceShards: {
		id: 'iceShards',
		tag: 'magic',
		behavior: 'orbit',
		damage: 6,
		cooldown: 0.5,
		range: 60,
		count: 2,
		countPerLevel: 1,
		element: 'ice',
	},
	auxPistol: {
		id: 'auxPistol',
		tag: 'firearm',
		behavior: 'shooter',
		damage: 7,
		cooldown: 0.6,
		range: 240,
	},
	bladeWhirl: {
		id: 'bladeWhirl',
		tag: 'melee',
		behavior: 'orbit',
		damage: 8,
		cooldown: 0.4,
		range: 70,
		count: 3,
		countPerLevel: 1,
		hero: 'jack',
	},
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
	droneSentinel: {
		id: 'droneSentinel',
		tag: 'firearm',
		behavior: 'follower',
		damage: 6,
		cooldown: 1 / 3,
		range: 220,
		hero: 'bob',
	},
	grenadeBelt: {
		id: 'grenadeBelt',
		tag: 'firearm',
		behavior: 'lob',
		damage: 30,
		cooldown: 5,
		range: 240,
		radius: 70,
		hero: 'bob',
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
	fishBoomerang: {
		id: 'fishBoomerang',
		tag: 'melee',
		behavior: 'boomerang',
		damage: 10,
		cooldown: 1.8,
		range: 200,
		count: 1,
		countPerLevel: 0.5,
	},
	mine: {
		id: 'mine',
		tag: 'firearm',
		behavior: 'mine',
		damage: 35,
		cooldown: 2.5,
		range: 30,
		radius: 70,
		count: 3,
		countPerLevel: 1,
		duration: 20,
	},
	flameRing: {
		id: 'flameRing',
		tag: 'magic',
		behavior: 'aura',
		damage: 4,
		cooldown: 0.5,
		range: 75,
		radius: 75,
		element: 'fire',
	},
	lightningTotem: {
		id: 'lightningTotem',
		tag: 'magic',
		behavior: 'totem',
		damage: 12,
		cooldown: 7,
		range: 170,
		count: 1,
		duration: 6,
		element: 'energy',
	},
	poisonCloud: {
		id: 'poisonCloud',
		tag: 'magic',
		behavior: 'cloud',
		damage: 5,
		cooldown: 4,
		range: 230,
		radius: 65,
		duration: 4,
	},
	crossbow: {
		id: 'crossbow',
		tag: 'firearm',
		behavior: 'shooter',
		damage: 16,
		cooldown: 1.4,
		range: 320,
		pierce: 3,
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
} as const;

export type PerkId = keyof typeof PERKS;

/** Level multiplier shared by secondaries and perks: 1, 1.5, 2, 2.5, 3. */
export function levelScale(level: number): number {
	return 1 + LEVEL_DAMAGE_STEP * (level - 1);
}
