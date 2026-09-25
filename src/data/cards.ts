import type { StatKey } from '../logic/stats';
import type { AbilityId } from './abilities';
import type { Rarity } from './rarity';

export interface StatCardDef {
	id: string;
	stat: StatKey;
	/** Common value; other rarities multiply it (balancing §5). */
	base: number;
	/** Flat stats are rounded to integers. */
	integer?: boolean;
	minRarity?: Rarity;
}

/** docs/balancing.md §6 */
export const STAT_CARDS: readonly StatCardDef[] = [
	{ id: 'max_hp', stat: 'maxHp', base: 5, integer: true },
	{ id: 'hp_regen', stat: 'hpRegen', base: 0.3 },
	{ id: 'lifesteal', stat: 'lifesteal', base: 0.02 },
	{ id: 'damage', stat: 'damage', base: 0.08 },
	{ id: 'attack_speed', stat: 'attackSpeed', base: 0.08 },
	{ id: 'crit_chance', stat: 'critChance', base: 0.04 },
	{ id: 'crit_damage', stat: 'critDamage', base: 0.15 },
	{ id: 'ability_power', stat: 'abilityPower', base: 0.1 },
	{ id: 'range', stat: 'range', base: 0.1 },
	{ id: 'move_speed', stat: 'moveSpeed', base: 0.05 },
	{ id: 'armor', stat: 'armor', base: 1, integer: true },
	{ id: 'dodge', stat: 'dodge', base: 0.03 },
	{ id: 'pickup_range', stat: 'pickupRange', base: 20, integer: true },
	{ id: 'luck', stat: 'luck', base: 10, integer: true },
];

export type SpecialCardId = 'projectile' | 'pierce' | 'revive' | 'full_heal';

export interface SpecialCardDef {
	id: SpecialCardId;
	minRarity: Rarity;
}

export const SPECIAL_CARDS: readonly SpecialCardDef[] = [
	{ id: 'projectile', minRarity: 'epic' },
	{ id: 'pierce', minRarity: 'rare' },
	{ id: 'revive', minRarity: 'epic' },
	{ id: 'full_heal', minRarity: 'rare' },
];

/** Chance of each card family when rolling one card (normalized among available ones). */
export const CARD_FAMILY_WEIGHTS = { stat: 55, ability: 35, special: 10 } as const;

export const CARDS_PER_PICK = 3;
export const MAX_REVIVES = 1;

/** Re-roll price: 2 + N, +1 per re-roll on the same screen (balancing §6). */
export const CARD_REROLL = { base: 2, perWave: 1, perReroll: 1 } as const;

export type Card =
	| { kind: 'stat'; id: string; rarity: Rarity; stat: StatKey; value: number }
	| { kind: 'ability'; id: string; rarity: Rarity; ability: AbilityId; level: number }
	| { kind: 'special'; id: string; rarity: Rarity; special: SpecialCardId };

/** Revive (D-18): 50% HP, 2 s invulnerability and a radial shockwave. */
export const REVIVE = {
	hpPct: 0.5,
	invuln: 2,
	shockRadius: 140,
	shockForce: 450,
} as const;
