/** XP and Fish (docs/balancing-and-simulation.md §5 and §8). */
export const ECONOMY = {
	maxLevel: 100,
	xpCurve: { base: 30, exponent: 1.55, flat: 50 },
	/** Orb XP grows with the round: xp × (1 + perRound × round). */
	xpPerRound: 0.05,
	fish: {
		commonChance: 0.05,
		elitePurple: 3,
		eliteOrange: 6,
		/** Fish a run starts with: enough for one tier I weapon in the first shop (price 8 + 2 per round). */
		start: 10,
		roundEndBase: 2,
		bossPerCycle: 25,
	},
	magnetSpeed: 320,
	/** Ground sprite scale of a dropped Fish (UI icons are untouched). */
	fishDropScale: 2,
	collectRadius: 14,
} as const;

/** End-of-round shop (SDD-003 RF-02…04, docs/gdd.md §9). Prices are in run Fish. */
export const SHOP = {
	offers: 4,
	/** rerollPrice = rerollBase + round + (rerollStep + floor(round / rerollStepEvery)) × rerolls. */
	rerollBase: 3,
	rerollStep: 1,
	rerollStepEvery: 5,
	/** Weapon price by tier I..IV, plus `pricePerRound × round`. Items cost `itemRatio` of the base. */
	weaponPrices: [8, 20, 45, 90, 160],
	itemRatio: 0.8,
	/** Equipment price by rarity (common, rare, legendary). */
	gearPrices: [12, 30, 70, 140, 250],
	pricePerRound: 2,
	sellRatio: 0.5,
	/** Extra weight for offers that share a set with the build. */
	setBias: 0.15,
	/** Tier weight = max(1, base + perRound × round); tiers II+ also scale by 1 + luck × luckPerPoint. */
	tierWeights: { base: [60, 28, 10, 5, 2], perRound: [-1.5, 0.6, 0.7, 0.3, 0.15] },
	luckPerPoint: 0.01,
	/** Chance of each kind taking a slot when the pool mixes kinds (renormalized over what is left). */
	kindShare: { weapon: 0.6, item: 0.2, gear: 0.28, potion: 0.12, support: 0.12, healPotion: 0.1 },
	/** Run potions are sold from this round on (SDD-003 RF-09). */
	potionsFromRound: 5,
	/** The merchant sells weapons, equipment and only these potions (speed); the rest are not sold. */
	potions: ['haste'],
	/** Highest rarity on the shelf (ADR-021): I to V; IV and V also ask for a material. */
	maxRarity: 5,
	/** Material each rarity asks for besides the Fish (ADR-021): one Elite Mark for IV, one Boss Core for V. */
	materialCost: { 4: 'elite', 5: 'boss' } as Partial<Record<number, 'elite' | 'boss'>>,
	/** First round whose shop offers each rarity: IV after the first boss, V after the second. */
	rarityFromRound: { 4: 11, 5: 21 } as Partial<Record<number, number>>,
	fishToPearls: 10,
} as const;

/** Persistent Pearls (SDD-003 RF-07): per round `roundBase + floor(N / roundEvery)`. */
export const PEARLS = {
	roundBase: 1,
	roundEvery: 5,
	boss: 25,
	achievement: 5,
} as const;
