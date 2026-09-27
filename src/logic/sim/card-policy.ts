import type { HeroId } from '../../config/constants';
import { type CardDef, RARITY_MUL, type Rarity } from '../../data/cards';
import { MAX_SECONDARY_SLOTS, type PerkId } from '../../data/secondaries';
import { type Build, slotsUsed } from '../build';
import type { StatKey } from '../stats';

/**
 * "Reasonable player" card choice shared by the headless sim and the playtest bot (PLAN 3.2),
 * so both runs build the same way: evolve first, fill the 3 weapon slots, level them, then
 * the hero's key stats. Scores are only relative; stat cards scale with rarity.
 */
const MAIN_TAG: Record<HeroId, StatKey> = {
	jack: 'tagMul.melee',
	bob: 'tagMul.firearm',
	lucia: 'tagMul.magic',
};

const STAT_SCORE: Partial<Record<StatKey, number>> = {
	damage: 40,
	attackSpeed: 40,
	maxHp: 36,
	armor: 30,
	regen: 28,
	lifesteal: 32,
	crit: 26,
	critDamage: 22,
	dodge: 28,
	area: 18,
	moveSpeed: 18,
	luck: 12,
	bleedChance: 14,
	poisonChance: 14,
	parry: 10,
	xpGain: 4,
	pickupRange: 4,
	'resist.fire': 6,
	'resist.earth': 6,
	'resist.ice': 6,
	'resist.energy': 6,
	'tagMul.melee': 12,
	'tagMul.firearm': 12,
	'tagMul.magic': 12,
};

const HERO_STAT_BONUS: Record<HeroId, Partial<Record<StatKey, number>>> = {
	jack: { armor: 8, parry: 20, area: 14, bleedChance: 14, lifesteal: 6 },
	bob: { crit: 12, critDamage: 10, dodge: 6, moveSpeed: 4 },
	lucia: { maxHp: 6, dodge: 4, regen: 4 },
};

const PERK_SCORE: Record<PerkId, number> = {
	bloodlust: 42,
	counterAttack: 46,
	ironSkin: 56,
	butcher: 44,
	hollowPoints: 40,
	ricochet: 56,
	runAndGun: 46,
	reflex: 30,
	elementalAttunement: 46,
	arcaneBarrier: 54,
	toxicBloom: 44,
};

export function scoreCard(card: CardDef, rarity: Rarity, build: Build, hero: HeroId): number {
	const e = card.effect;
	switch (e.type) {
		case 'evolve':
			return 1000;
		case 'secondary': {
			const level = build.secondaries[e.weapon];
			const exclusive = card.hero !== undefined ? 10 : 0;
			if (level !== undefined) return 50 + 4 * level + exclusive;
			return slotsUsed(build) < MAX_SECONDARY_SLOTS ? 62 + exclusive : 0;
		}
		case 'perk':
			return PERK_SCORE[e.perk] + 3 * (build.perks[e.perk] ?? 0);
		case 'stat': {
			const base =
				e.stat === MAIN_TAG[hero]
					? 42
					: (STAT_SCORE[e.stat] ?? 5) + (HERO_STAT_BONUS[hero][e.stat] ?? 0);
			return base * RARITY_MUL[rarity];
		}
	}
}

/** Index of the best offer (first on ties). */
export function pickBest(
	offers: readonly { card: CardDef; rarity: Rarity }[],
	build: Build,
	hero: HeroId,
): number {
	let best = 0;
	let bestScore = Number.NEGATIVE_INFINITY;
	offers.forEach((o, i) => {
		const s = scoreCard(o.card, o.rarity, build, hero);
		if (s > bestScore) {
			bestScore = s;
			best = i;
		}
	});
	return best;
}
