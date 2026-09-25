import { RARITIES, RARITY, type Rarity } from '../data/rarity';
import type { Rng } from './rng';

/** Rarity weights for a wave and Luck (Legendary = 0 before wave 5). */
export function rarityWeights(wave: number, luck: number): Record<Rarity, number> {
	const boost = (1 + RARITY.perWave * (wave - 1)) * Math.max(0, 1 + luck / RARITY.luckDivisor);
	const w = RARITY.baseWeights;
	return {
		common: w.common,
		rare: w.rare * boost,
		epic: w.epic * boost,
		legendary: wave >= RARITY.legendaryFromWave ? w.legendary * boost : 0,
	};
}

export function rollRarity(rng: Rng, wave: number, luck: number): Rarity {
	const w = rarityWeights(wave, luck);
	return RARITIES[rng.weightedIndex(RARITIES.map((r) => w[r]))] ?? 'common';
}

/** Value multiplier of a rarity (Common x1, Rare x1.5, Epic x2.2, Legendary x3). */
export function rarityValue(r: Rarity): number {
	return RARITY.valueMul[r];
}
