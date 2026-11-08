/** Potions and gambit conditions (docs/gdd.md §10, balancing §8). */
export const POTION_TYPES = ['shield', 'rage', 'antidote', 'haste'] as const;
export type PotionType = (typeof POTION_TYPES)[number];

export const POTION_PRICES: Record<PotionType, number> = {
	antidote: 15,
	shield: 25,
	rage: 25,
	haste: 25,
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

/** Potion effects (docs/gdd.md §10). Durations in seconds. */
export const POTION_EFFECTS = {
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

/**
 * Healing potion of the run (SDD-014 RF-20): bought in the shop (level 1 to 10 = potions carried),
 * refilled by kills and drunk automatically. Rarity only changes how much it
 * heals; the shop sells rarity I, better ones are upgrade drops.
 */
export const HEAL_POTION = {
	maxLevel: 10,
	/** Fish per level before `SHOP.pricePerRound × round` (see `offerPrice`). */
	price: 16,
	/** Share of max HP healed by rarity I to V. */
	heal: [0.25, 0.3, 0.35, 0.4, 0.5],
	/** Drinks when HP is at or below this share of max HP. */
	drinkBelow: 0.5,
	/** Seconds between two potions. */
	cooldown: 2,
	/** Upgrade drops: Elites give rarity II or III (`eliteChance` per kill), Bosses IV or V. */
	drop: { eliteChance: 0.12, elite: [2, 3], boss: [4, 5] },
} as const;
