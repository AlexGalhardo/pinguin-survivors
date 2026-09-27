import type { EnemyDef } from '../data/enemies';
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
	// Pick a point on the rectangle perimeter, uniformly by length.
	const perimeter = 4 * (hw + hh);
	let t = rng.next() * perimeter;
	let sx: number;
	let sy: number;
	if (t < 2 * hw) {
		sx = -hw + t;
		sy = -hh;
	} else if ((t -= 2 * hw) < 2 * hh) {
		sx = hw;
		sy = -hh + t;
	} else if ((t -= 2 * hh) < 2 * hw) {
		sx = hw - t;
		sy = hh;
	} else {
		t -= 2 * hw;
		sx = -hw;
		sy = hh - t;
	}
	const offset = screenToWorld(sx, sy);
	return { x: hero.x + offset.x, y: hero.y + offset.y };
}

/** Enemies available this round, weighted. */
export function pickEnemy(rng: Rng, pool: readonly EnemyDef[], round: number): EnemyDef {
	const available = pool.filter((e) => e.fromRound > 0 && e.fromRound <= round);
	if (available.length === 0) throw new Error(`no enemy available for round ${round}`);
	return available[rng.weightedIndex(available.map((e) => e.weight))] as EnemyDef;
}
