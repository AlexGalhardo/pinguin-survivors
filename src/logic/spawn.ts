import type { EnemyDef } from '../data/enemies';
import { enemyPoolForRound } from './biome';
import type { Rng } from './rng';

export interface PendingSpawn<T> {
	x: number;
	y: number;
	/** Seconds left before the enemy appears. */
	t: number;
	data: T;
}

/** Spawns waiting for their telegraph (`fx.spawnMark`, RF-04) to finish. */
export class SpawnQueue<T> {
	private readonly items: PendingSpawn<T>[] = [];

	get size(): number {
		return this.items.length;
	}

	add(x: number, y: number, delay: number, data: T): void {
		this.items.push({ x, y, t: delay, data });
	}

	update(dt: number, ready: (p: PendingSpawn<T>) => void): void {
		for (let i = this.items.length - 1; i >= 0; i--) {
			const p = this.items[i] as PendingSpawn<T>;
			p.t -= dt;
			if (p.t > 0) continue;
			this.items.splice(i, 1);
			ready(p);
		}
	}

	clear(): void {
		this.items.length = 0;
	}
}

/** Weighted pick among the enemies available this round (the biome's, or all of them in endless). */
export function pickEnemy(rng: Rng, pool: readonly EnemyDef[], round: number): EnemyDef {
	const available = enemyPoolForRound(round, pool);
	if (available.length === 0) throw new Error(`no enemy available for round ${round}`);
	return available[rng.weightedIndex(available.map((e) => e.weight))] as EnemyDef;
}
