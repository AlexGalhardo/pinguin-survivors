import { CORES, META_UPGRADES, type MetaUpgradeDef } from '../data/meta';
import type { SaveData } from './save';
import { addMods, type StatMods } from './stats';

export interface CoresInput {
	wave: number;
	kills: number;
	bossKills: number;
}

/** Cores earned by a finished run (D-41). */
export function coresForRun(r: CoresInput): number {
	return Math.floor(
		CORES.perWave * r.wave + r.kills / CORES.killsPerCore + CORES.perBoss * r.bossKills,
	);
}

export function upgradeLevel(save: SaveData, id: string): number {
	return save.meta.upgrades[id] ?? 0;
}

export function getUpgrade(id: string): MetaUpgradeDef | undefined {
	return META_UPGRADES.find((u) => u.id === id);
}

/** Cost of the next level, or null when maxed. */
export function nextCost(save: SaveData, id: string): number | null {
	const def = getUpgrade(id);
	if (!def) return null;
	return def.costs[upgradeLevel(save, id)] ?? null;
}

/** Buys the next level if affordable. Returns true on success. */
export function buyUpgrade(save: SaveData, id: string): boolean {
	const cost = nextCost(save, id);
	if (cost === null || save.meta.cores < cost) return false;
	save.meta.cores -= cost;
	save.meta.upgrades[id] = upgradeLevel(save, id) + 1;
	return true;
}

export interface MetaBonus {
	mods: StatMods;
	startGold: number;
	startRevive: boolean;
}

/** Everything the permanent upgrades give at the start of a run. */
export function metaBonus(save: SaveData): MetaBonus {
	let mods: StatMods = {};
	let startGold = 0;
	let startRevive = false;
	for (const def of META_UPGRADES) {
		const level = upgradeLevel(save, def.id);
		if (level <= 0) continue;
		if (def.mods) mods = addMods(mods, def.mods, level);
		startGold += (def.startGold ?? 0) * level;
		if (def.startRevive) startRevive = true;
	}
	return { mods, startGold, startRevive };
}
