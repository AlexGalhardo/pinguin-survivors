import type { HeroId } from '../config/constants';

/** Superpowers (P-39, docs/balancing.md §4.2). Damage is a multiple of the signature weapon hit. */
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
	},
	lucia: { id: 'elementalCataclysm', hero: 'lucia', duration: 4, damageMul: 1.5, radius: 260 },
};
