import type { HeroId } from '../config/constants';

/** Level-1 hero profiles (docs/balancing.md §4). */
export interface HeroDef {
	id: HeroId;
	hp: number;
	regen: number;
	armor: number;
	/** World units per second. */
	moveSpeed: number;
	dodge: number;
	parry: number;
	crit: number;
	critDamage: number;
	resist: { fire: number; earth: number; ice: number; energy: number };
	tagMul: { melee: number; firearm: number; magic: number };
}

export const HEROES: Record<HeroId, HeroDef> = {
	jack: {
		id: 'jack',
		hp: 140,
		regen: 0.8,
		armor: 12,
		moveSpeed: 95,
		dodge: 0.03,
		parry: 0.15,
		crit: 0.05,
		critDamage: 1.5,
		resist: { fire: 0, earth: 0.1, ice: 0.05, energy: 0 },
		tagMul: { melee: 1.3, firearm: 1, magic: 0.65 },
	},
	bob: {
		id: 'bob',
		hp: 100,
		regen: 0.4,
		armor: 4,
		moveSpeed: 135,
		dodge: 0.12,
		parry: 0,
		crit: 0.12,
		critDamage: 1.75,
		resist: { fire: 0.05, earth: 0, ice: 0.05, energy: 0 },
		tagMul: { melee: 0.7, firearm: 1.3, magic: 1 },
	},
	lucia: {
		id: 'lucia',
		hp: 70,
		regen: 0.3,
		armor: 1,
		moveSpeed: 115,
		dodge: 0.06,
		parry: 0,
		crit: 0.05,
		critDamage: 1.5,
		resist: { fire: 0.1, earth: 0.1, ice: 0.1, energy: 0.1 },
		tagMul: { melee: 0.8, firearm: 0.85, magic: 1.5 },
	},
};
