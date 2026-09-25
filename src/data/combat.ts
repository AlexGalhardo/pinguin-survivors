/** Combat formula constants (docs/balancing.md §4). */
export const COMBAT = {
	baseCritMultiplier: 1.5,
	/** Attack Speed can never reduce below -50%. */
	minAttackSpeed: -0.5,
	armorConstant: 15,
	maxDodge: 0.6,
	lifestealHeal: 1,
	maxLifestealPerSecond: 10,
	minDamageTaken: 1,
} as const;
