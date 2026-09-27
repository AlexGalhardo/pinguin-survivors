import { type CardDef, RARITY_MUL, type Rarity } from '../data/cards';
import {
	MAX_LEVEL,
	MAX_SECONDARY_SLOTS,
	PERKS,
	type PerkId,
	type SecondaryId,
} from '../data/secondaries';
import { addStat, type PlayerStats } from './stats';

/** What the hero picked this run (serialized in the run snapshot). */
export interface Build {
	tier: 1 | 2 | 3;
	secondaries: Partial<Record<SecondaryId, number>>;
	perks: Partial<Record<PerkId, number>>;
	cards: string[];
}

export function emptyBuild(tier: 1 | 2 | 3 = 1): Build {
	return { tier, secondaries: {}, perks: {}, cards: [] };
}

export function slotsUsed(build: Build): number {
	return Object.keys(build.secondaries).length;
}

/** Whether a card can be offered to this build (levels and slots). */
export function canTake(build: Build, card: CardDef): boolean {
	const e = card.effect;
	switch (e.type) {
		case 'stat':
			return true;
		case 'secondary': {
			const lv = build.secondaries[e.weapon];
			return lv !== undefined ? lv < MAX_LEVEL : slotsUsed(build) < MAX_SECONDARY_SLOTS;
		}
		case 'perk':
			return (build.perks[e.perk] ?? 0) < MAX_LEVEL;
		case 'evolve':
			return build.tier === e.tier - 1;
	}
}

export interface ApplyResult {
	/** Max HP gained (the caller heals the same amount). */
	maxHpDelta: number;
	evolvedTo?: 2 | 3;
	exclusive: boolean;
}

export function applyCard(
	build: Build,
	stats: PlayerStats,
	card: CardDef,
	rarity: Rarity,
): ApplyResult {
	build.cards.push(card.id);
	const result: ApplyResult = { maxHpDelta: 0, exclusive: card.kind === 'exclusive' };
	const e = card.effect;
	switch (e.type) {
		case 'stat': {
			const value = e.value * RARITY_MUL[rarity];
			addStat(stats, e.stat, value);
			if (e.stat === 'maxHp') result.maxHpDelta = value;
			break;
		}
		case 'secondary':
			build.secondaries[e.weapon] = (build.secondaries[e.weapon] ?? 0) + 1;
			break;
		case 'perk':
			build.perks[e.perk] = (build.perks[e.perk] ?? 0) + 1;
			// Iron Skin is a flat armor bonus per level; other perks are read by the systems.
			if (e.perk === 'ironSkin') addStat(stats, 'armor', PERKS.ironSkin.value);
			break;
		case 'evolve':
			build.tier = e.tier;
			result.evolvedTo = e.tier;
			break;
	}
	return result;
}
