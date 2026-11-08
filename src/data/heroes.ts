import type { HeroId } from '../config/constants';
import { STARTING_WEAPONS } from './unlocks';
import type { WeaponId } from './weapon-lines';

/** Level-1 hero profiles (docs/balancing-and-simulation.md §4). */
export interface HeroDef {
	id: HeroId;
	/** Approved PixelLab concept (docs/visual.md §13); tiers and animations derive from it. */
	pixellabId: string;
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
	/** Weapons selectable at run start (SDD-002 RF-05). */
	startingWeapons: readonly [WeaponId, WeaponId, WeaponId];
}

export const HEROES: Record<HeroId, HeroDef> = {
	jack: {
		id: 'jack',
		pixellabId: '74719afa-d601-4428-8510-d199eef347de',
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
		startingWeapons: STARTING_WEAPONS.jack,
	},
	bob: {
		id: 'bob',
		pixellabId: '61a0d0eb-21f7-4bc9-ac2d-69f42c8bcbd3',
		hp: 120,
		regen: 0.4,
		armor: 6,
		moveSpeed: 135,
		dodge: 0.12,
		parry: 0,
		crit: 0.12,
		critDamage: 1.75,
		resist: { fire: 0.05, earth: 0, ice: 0.05, energy: 0 },
		tagMul: { melee: 0.7, firearm: 1.3, magic: 1 },
		startingWeapons: STARTING_WEAPONS.bob,
	},
	lucia: {
		id: 'lucia',
		pixellabId: '68a38f74-4a05-4de5-a38b-d990780b7414',
		hp: 85,
		regen: 0.3,
		armor: 1,
		moveSpeed: 115,
		dodge: 0.06,
		parry: 0,
		crit: 0.05,
		critDamage: 1.5,
		resist: { fire: 0.1, earth: 0.1, ice: 0.1, energy: 0.1 },
		tagMul: { melee: 0.8, firearm: 0.85, magic: 1.5 },
		startingWeapons: STARTING_WEAPONS.lucia,
	},
};
