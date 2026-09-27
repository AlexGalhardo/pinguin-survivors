import { UPGRADES, type UpgradeDef } from '../data/upgrades';
import { addStat, type PlayerStats } from './stats';

export function upgradeLevel(owned: Readonly<Record<string, number>>, id: string): number {
	return owned[id] ?? 0;
}

/** Fish price of the next level, or null when maxed. */
export function upgradeCost(def: UpgradeDef, level: number): number | null {
	if (level >= def.maxLevel) return null;
	return Math.round(def.baseCost * def.costGrowth ** level);
}

/** Spends Fish and raises the level; returns the Fish left, or null if unaffordable/maxed. */
export function buyUpgrade(
	def: UpgradeDef,
	owned: Record<string, number>,
	fish: number,
): number | null {
	const cost = upgradeCost(def, upgradeLevel(owned, def.id));
	if (cost === null || fish < cost) return null;
	owned[def.id] = upgradeLevel(owned, def.id) + 1;
	return fish - cost;
}

/** Adds every owned upgrade level to the run's starting stats (unknown ids are ignored). */
export function applyUpgrades(
	stats: PlayerStats,
	owned: Readonly<Record<string, number>>,
	defs: readonly UpgradeDef[] = UPGRADES,
): PlayerStats {
	for (const def of defs) {
		const level = Math.min(def.maxLevel, upgradeLevel(owned, def.id));
		if (level > 0) addStat(stats, def.stat, def.perLevel * level);
	}
	return stats;
}
