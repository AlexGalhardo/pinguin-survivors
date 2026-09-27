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

/** Potion effects (docs/game-design.md §10). Durations in seconds. */
export const POTION_EFFECTS = {
	heal: { heal: 0.4 },
	megaHeal: { heal: 0.7 },
	shield: { shield: 0.3, duration: 8 },
	rage: { damage: 0.5, duration: 8 },
	antidote: { immune: 5 },
	haste: { attackSpeed: 0.4, duration: 8 },
} as const;

/** "Surrounded" = at least this many enemies within CROWD_RADIUS world units. */
export const CROWD_COUNT = 12;
export const CROWD_RADIUS = 90;
/** Gambits are evaluated this often (seconds). */
export const GAMBIT_INTERVAL = 0.25;
