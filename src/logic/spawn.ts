import { ENEMIES, type EnemyType, POOL_TYPES } from '../data/enemies';
import type { Rng } from './rng';

/** Enemy types available from the random pool at a given wave. */
export function unlockedTypes(wave: number): EnemyType[] {
	return POOL_TYPES.filter((t) => ENEMIES[t].fromWave <= wave);
}

/** Weighted random type among the unlocked ones (Chaser 50, Runner 25, Shooter 15, Tank 10). */
export function pickEnemyType(wave: number, rng: Rng): EnemyType {
	const types = unlockedTypes(wave);
	const index = rng.weightedIndex(types.map((t) => ENEMIES[t].weight));
	return types[index] ?? 'chaser';
}

/** Group size for a type (1 unless it spawns in packs). */
export function groupSize(type: EnemyType, rng: Rng): number {
	const g = ENEMIES[type].group;
	return g ? rng.int(g[0], g[1]) : 1;
}
