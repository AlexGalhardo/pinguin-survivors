export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export const RARITIES: readonly Rarity[] = ['common', 'rare', 'epic', 'legendary'];

/** docs/balancing.md §5 */
export const RARITY = {
	baseWeights: { common: 70, rare: 22, epic: 7, legendary: 1 } as Record<Rarity, number>,
	/** Rare+ weights grow (1 + 0.02(N-1)) per wave... */
	perWave: 0.02,
	/** ...and (1 + Luck/100). */
	luckDivisor: 100,
	legendaryFromWave: 5,
	valueMul: { common: 1, rare: 1.5, epic: 2.2, legendary: 3 } as Record<Rarity, number>,
} as const;

export function rarityRank(r: Rarity): number {
	return RARITIES.indexOf(r);
}
