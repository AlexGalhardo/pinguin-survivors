import type { StatKey } from '../logic/stats';

/** Support items (SDD-014 RF-10): bought from the merchant, buying again raises the level. */
export const SUPPORT_IDS = ['magnetic', 'swift', 'lucky'] as const;
export type SupportId = (typeof SUPPORT_IDS)[number];

export const SUPPORT_SLOTS = 4;
export const SUPPORT_MAX_LEVEL = 5;

/** Fish for one level-up of any support item, before `SHOP.pricePerRound × round`. */
export const SUPPORT_PRICE = 14;

/** Magnetic: extra pull radius (world units) and speed multiplier for XP orbs and Fish, by level 1..5. */
export const MAGNETIC = {
	radius: [40, 75, 110, 150, 200],
	pull: [1.25, 1.5, 1.8, 2.2, 2.8],
} as const;

/** Stat items: cumulative bonus by level 1..5, added to the hero's stats. */
export const SUPPORT_STATS: Record<
	Exclude<SupportId, 'magnetic'>,
	{ stat: StatKey; values: readonly number[] }
> = {
	swift: { stat: 'moveSpeed', values: [4, 8, 12, 16, 20] },
	lucky: { stat: 'luck', values: [0.03, 0.06, 0.09, 0.12, 0.15] },
};
