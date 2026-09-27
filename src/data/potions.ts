/** Potions and gambit conditions (docs/game-design.md §10, balancing §8). */
export const POTION_TYPES = ['heal', 'megaHeal', 'shield', 'rage', 'antidote', 'haste'] as const;
export type PotionType = (typeof POTION_TYPES)[number];

export const POTION_PRICES: Record<PotionType, number> = {
	heal: 15,
	antidote: 15,
	shield: 25,
	rage: 25,
	haste: 25,
	megaHeal: 40,
};

export const GAMBIT_CONDITIONS = [
	'hpBelow25',
	'hpBelow50',
	'hpBelow75',
	'poisoned',
	'bleeding',
	'bossVisible',
	'crowded',
	'roundStart',
] as const;
export type GambitCondition = (typeof GAMBIT_CONDITIONS)[number];

export const GAMBIT_SLOTS = 3;
