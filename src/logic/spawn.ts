import type { EnemyDef } from '../data/enemies';
import { biomeForRound } from './biome';
import { screenToWorld, type Vec2 } from './iso';
import type { Rng } from './rng';

/** Screen px beyond the visible edge where enemies appear. */
export const SPAWN_MARGIN = 48;

/**
 * A world position just outside the visible screen (logical view size, which is wider on
 * ultrawide monitors), around the hero.
 */
export function spawnPosition(rng: Rng, hero: Vec2, viewW: number, viewH: number): Vec2 {
	const hw = viewW / 2 + SPAWN_MARGIN;
	const hh = viewH / 2 + SPAWN_MARGIN;
	// Pick a point on the rectangle perimeter, uniformly by length (top, right, bottom, left).
	const perimeter = 4 * (hw + hh);
	const t = rng.next() * perimeter;
	const top = 2 * hw;
	const right = top + 2 * hh;
	const bottom = right + 2 * hw;
	let sx: number;
	let sy: number;
	if (t < top) {
		sx = -hw + t;
		sy = -hh;
	} else if (t < right) {
		sx = hw;
		sy = -hh + (t - top);
	} else if (t < bottom) {
		sx = hw - (t - right);
		sy = hh;
	} else {
		sx = -hw;
		sy = hh - (t - bottom);
	}
	const offset = screenToWorld(sx, sy);
	return { x: hero.x + offset.x, y: hero.y + offset.y };
}

/** Enemies of the round's biome available this round, weighted. */
export function pickEnemy(rng: Rng, pool: readonly EnemyDef[], round: number): EnemyDef {
	const biome = biomeForRound(round);
	const available = pool.filter(
		(e) => e.biome === biome && e.fromRound > 0 && e.fromRound <= round,
	);
	if (available.length === 0) throw new Error(`no enemy available for round ${round}`);
	return available[rng.weightedIndex(available.map((e) => e.weight))] as EnemyDef;
}
