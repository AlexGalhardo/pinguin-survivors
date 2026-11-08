import type { HeroId } from '../config/constants';

/** Superpowers (P-39, docs/balancing-and-simulation.md §4.2). Damage is a multiple of the lead weapon hit. */
export const SUPER = {
	unlockLevel: 5,
	charge: 100,
	/** Every use makes the next one cost this many more kills (100, 105, 110…; user request). */
	chargeStep: 5,
	eliteCharge: 3,
	invulnerable: 0.8,
	tick: 0.25,
} as const;

export interface SuperpowerDef {
	id: string;
	hero: HeroId;
	duration: number;
	/** Weapon-damage multiplier per tick (Harvest, Cataclysm) or per explosion (Bombing). */
	damageMul: number;
	radius: number;
	/** Bombing: explosions spread over the duration. */
	explosions?: number;
	/** Bombing: rings around the hero, filled in order; their counts add up to `explosions`. */
	rings?: readonly { count: number; distance: number }[];
	/** Harvest: pull towards the hero (world units/s). */
	pull?: number;
}

export const SUPERPOWERS: Record<HeroId, SuperpowerDef> = {
	jack: { id: 'redHarvest', hero: 'jack', duration: 3, damageMul: 2, radius: 180, pull: 60 },
	bob: {
		id: 'carpetBombing',
		hero: 'bob',
		duration: 2.5,
		damageMul: 6,
		radius: 80,
		explosions: 16,
		// Bombs fall in rings around Bob, inner ring first: 6 at 100 px, then 10 at 200 px.
		rings: [
			{ count: 6, distance: 100 },
			{ count: 10, distance: 200 },
		],
	},
	lucia: { id: 'elementalCataclysm', hero: 'lucia', duration: 4, damageMul: 1.5, radius: 260 },
};
