import type { StatMods } from '../logic/stats';

export type CharacterId = 'warrior' | 'ranger' | 'mage';
export type WeaponId = 'energy_blade' | 'blaster' | 'psi_orb';

export interface CharacterDef {
	id: CharacterId;
	texture: string;
	weapon: WeaponId;
	/** Base move speed in px/s (Move Speed % multiplies it). */
	speed: number;
	stats: StatMods;
}

/** Base stats (docs/balancing.md §3). */
export const CHARACTERS: Record<CharacterId, CharacterDef> = {
	warrior: {
		id: 'warrior',
		texture: 'player.warrior',
		weapon: 'energy_blade',
		speed: 90,
		stats: { maxHp: 30, armor: 3, hpRegen: 0.4, pickupRange: 40, critChance: 0.05 },
	},
	ranger: {
		id: 'ranger',
		texture: 'player.ranger',
		weapon: 'blaster',
		speed: 105,
		stats: { maxHp: 22, armor: 0, pickupRange: 40, critChance: 0.08 },
	},
	mage: {
		id: 'mage',
		texture: 'player.mage',
		weapon: 'psi_orb',
		speed: 95,
		stats: { maxHp: 18, armor: 0, pickupRange: 40, critChance: 0.05, abilityPower: 0.5 },
	},
};

export const CHARACTER_IDS: readonly CharacterId[] = ['warrior', 'ranger', 'mage'];
