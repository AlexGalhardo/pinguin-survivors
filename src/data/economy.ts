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
		roundEndBase: 2,
		bossPerCycle: 25,
	},
	magnetSpeed: 320,
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
	weaponPrices: [8, 20, 45, 90],
	itemRatio: 0.8,
	/** Equipment price by rarity (common, rare, legendary). */
	gearPrices: [12, 30, 70],
	pricePerRound: 2,
	sellRatio: 0.5,
	/** Extra weight for offers that share a set with the build. */
	setBias: 0.15,
	/** Tier weight = max(1, base + perRound × round); tiers II+ also scale by 1 + luck × luckPerPoint. */
	tierWeights: { base: [60, 28, 10, 2], perRound: [-1.5, 0.6, 0.7, 0.2] },
	luckPerPoint: 0.01,
	fishToPearls: 10,
} as const;
