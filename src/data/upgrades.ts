import type { StatKey } from '../logic/stats';

/**
 * Permanent upgrades bought with Fish in the Workshop (docs/game-design.md §12, balancing §8b).
 * Shared by all heroes; each level adds `perLevel` to the stat at the start of every run.
 */
export interface UpgradeDef {
	id: string;
	stat: StatKey;
	perLevel: number;
	maxLevel: number;
	/** Price of level 1; each next level costs `costGrowth` times the previous one. */
	baseCost: number;
	costGrowth: number;
}

export const UPGRADES = [
	{ id: 'vitality', stat: 'maxHp', perLevel: 5, maxLevel: 10, baseCost: 30, costGrowth: 1.35 },
	{ id: 'might', stat: 'damage', perLevel: 0.03, maxLevel: 10, baseCost: 40, costGrowth: 1.4 },
	{
		id: 'haste',
		stat: 'attackSpeed',
		perLevel: 0.02,
		maxLevel: 10,
		baseCost: 40,
		costGrowth: 1.4,
	},
	{ id: 'plating', stat: 'armor', perLevel: 1, maxLevel: 8, baseCost: 35, costGrowth: 1.4 },
	{ id: 'recovery', stat: 'regen', perLevel: 0.1, maxLevel: 8, baseCost: 35, costGrowth: 1.4 },
	{ id: 'swiftness', stat: 'moveSpeed', perLevel: 3, maxLevel: 5, baseCost: 45, costGrowth: 1.5 },
	{ id: 'magnet', stat: 'pickupRange', perLevel: 8, maxLevel: 5, baseCost: 25, costGrowth: 1.4 },
	{ id: 'wisdom', stat: 'xpGain', perLevel: 0.04, maxLevel: 10, baseCost: 45, costGrowth: 1.4 },
	{ id: 'fortune', stat: 'luck', perLevel: 0.02, maxLevel: 5, baseCost: 60, costGrowth: 1.5 },
] as const satisfies readonly UpgradeDef[];

export type UpgradeId = (typeof UPGRADES)[number]['id'];
