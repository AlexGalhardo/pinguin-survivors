import type { StatKey } from '../logic/stats';
import type { Rarity } from './rarity';

/**
 * Random affixes (ADR-017): stat bonuses drawn by seed for weapons and equipment. The value of an
 * affix is `base × power × (1 + rarityStep × (rarity − 1)) × (1 + roundStep × round)`; an item never
 * carries the same stat twice.
 */
export type AffixScope = 'weapon' | 'gear';

export interface AffixDef {
	id: string;
	stat: StatKey;
	/** Value at rarity I, round 0. */
	base: number;
	scope: readonly AffixScope[];
}

export const AFFIX_SCALE = { rarityStep: 0.25, roundStep: 0.02, power: 0.3 } as const;

export const AFFIXES: readonly AffixDef[] = [
	{ id: 'damage', stat: 'damage', base: 0.04, scope: ['weapon', 'gear'] },
	{ id: 'attackSpeed', stat: 'attackSpeed', base: 0.03, scope: ['weapon', 'gear'] },
	{ id: 'crit', stat: 'crit', base: 0.015, scope: ['weapon', 'gear'] },
	{ id: 'critDamage', stat: 'critDamage', base: 0.08, scope: ['weapon', 'gear'] },
	{ id: 'area', stat: 'area', base: 0.04, scope: ['weapon'] },
	{ id: 'lifesteal', stat: 'lifesteal', base: 0.01, scope: ['weapon'] },
	{ id: 'bleedChance', stat: 'bleedChance', base: 0.03, scope: ['weapon'] },
	{ id: 'maxHp', stat: 'maxHp', base: 6, scope: ['gear'] },
	{ id: 'regen', stat: 'regen', base: 0.15, scope: ['gear'] },
	{ id: 'armor', stat: 'armor', base: 0.8, scope: ['gear'] },
	{ id: 'moveSpeed', stat: 'moveSpeed', base: 3, scope: ['gear'] },
	{ id: 'dodge', stat: 'dodge', base: 0.01, scope: ['gear'] },
	{ id: 'luck', stat: 'luck', base: 0.02, scope: ['gear'] },
	{ id: 'harvesting', stat: 'harvesting', base: 0.03, scope: ['gear'] },
	{ id: 'xpGain', stat: 'xpGain', base: 0.04, scope: ['gear'] },
	{ id: 'resistFire', stat: 'resist.fire', base: 0.03, scope: ['gear'] },
	{ id: 'resistIce', stat: 'resist.ice', base: 0.03, scope: ['gear'] },
];

export function affixValue(def: AffixDef, rarity: Rarity, round: number): number {
	const v =
		def.base *
		AFFIX_SCALE.power *
		(1 + AFFIX_SCALE.rarityStep * (rarity - 1)) *
		(1 + AFFIX_SCALE.roundStep * Math.max(0, round));
	return Math.round(v * 1000) / 1000;
}
