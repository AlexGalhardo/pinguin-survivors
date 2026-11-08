import type { HeroId } from '../config/constants';
import type { StatKey } from '../logic/stats';
import { PERKS, type PerkId, SECONDARIES, type SecondaryId } from './secondaries';

/** Rarity order: index is used for multipliers and colors. */
export const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const;
export type Rarity = (typeof RARITIES)[number];

export const RARITY_MUL: Record<Rarity, number> = {
	common: 1,
	rare: 1.6,
	epic: 2.4,
	legendary: 3.5,
};

/** Rarity weights at round 1 and round 30 (linear in between, clamped). docs/balancing-and-simulation.md §7. */
export const RARITY_WEIGHTS = {
	start: [70, 22, 7, 1],
	end: [40, 35, 18, 7],
	endRound: 30,
	/** Each point of luck moves this much weight from common to the others. */
	luckShift: 100,
} as const;

export type CardEffect =
	| { type: 'stat'; stat: StatKey; value: number }
	| { type: 'secondary'; weapon: SecondaryId }
	| { type: 'perk'; perk: PerkId }
	| { type: 'evolve'; tier: 2 | 3 };

export interface CardDef {
	id: string;
	/** UI grouping: stats, on-hit effects, weapons, exclusives and evolution. */
	kind: 'stat' | 'onhit' | 'secondary' | 'exclusive' | 'evolution';
	hero?: HeroId;
	effect: CardEffect;
	/** Relative draw weight. */
	weight: number;
}

const stat = (id: string, s: StatKey, value: number, kind: 'stat' | 'onhit' = 'stat'): CardDef => ({
	id,
	kind,
	effect: { type: 'stat', stat: s, value },
	weight: kind === 'stat' ? 10 : 6,
});

export const STAT_CARDS: CardDef[] = [
	stat('maxHp', 'maxHp', 12),
	stat('regen', 'regen', 0.4),
	stat('armor', 'armor', 3),
	stat('moveSpeed', 'moveSpeed', 8),
	stat('attackSpeed', 'attackSpeed', 0.12),
	stat('damage', 'damage', 0.1),
	stat('crit', 'crit', 0.04),
	stat('critDamage', 'critDamage', 0.2),
	stat('dodge', 'dodge', 0.03),
	stat('parry', 'parry', 0.03),
	stat('area', 'area', 0.1),
	stat('pickupRange', 'pickupRange', 20),
	stat('luck', 'luck', 0.05),
	stat('xpGain', 'xpGain', 0.1),
	stat('resistFire', 'resist.fire', 0.08),
	stat('resistEarth', 'resist.earth', 0.08),
	stat('resistIce', 'resist.ice', 0.08),
	stat('resistEnergy', 'resist.energy', 0.08),
	stat('bleedChance', 'bleedChance', 0.08, 'onhit'),
	stat('poisonChance', 'poisonChance', 0.08, 'onhit'),
	stat('lifesteal', 'lifesteal', 0.02, 'onhit'),
	stat('burnChance', 'burnChance', 0.08, 'onhit'),
	stat('chillChance', 'chillChance', 0.06, 'onhit'),
	stat('shockChance', 'shockChance', 0.06, 'onhit'),
	stat('meleeDamage', 'tagMul.melee', 0.12, 'onhit'),
	stat('firearmDamage', 'tagMul.firearm', 0.12, 'onhit'),
	stat('magicDamage', 'tagMul.magic', 0.12, 'onhit'),
];

export const SECONDARY_CARDS: CardDef[] = (Object.keys(SECONDARIES) as SecondaryId[]).map((w) => {
	const def = SECONDARIES[w];
	const hero = 'hero' in def ? def.hero : undefined;
	return {
		id: `weapon.${w}`,
		kind: hero ? 'exclusive' : 'secondary',
		hero,
		effect: { type: 'secondary', weapon: w },
		weight: hero ? 5 : 7,
	};
});

export const PERK_CARDS: CardDef[] = (Object.keys(PERKS) as PerkId[]).map((p) => ({
	id: `perk.${p}`,
	kind: 'exclusive',
	hero: PERKS[p].hero,
	effect: { type: 'perk', perk: p },
	weight: 5,
}));

export const EVOLUTION_CARDS: CardDef[] = [
	{ id: 'evolve.2', kind: 'evolution', effect: { type: 'evolve', tier: 2 }, weight: 0 },
	{ id: 'evolve.3', kind: 'evolution', effect: { type: 'evolve', tier: 3 }, weight: 0 },
];

export const ALL_CARDS: readonly CardDef[] = [
	...STAT_CARDS,
	...SECONDARY_CARDS,
	...PERK_CARDS,
	...EVOLUTION_CARDS,
];

/** Evolution cards unlock after beating the round-10 (tier 2) and round-20 (tier 3) bosses. */
export const EVOLUTION_ROUND = { 2: 11, 3: 21 } as const;
