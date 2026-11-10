import type { BiomeId } from '../config/constants';
import type { LightingDef } from '../data/ambient';
import { AMBIENT, type AmbientDef, CAMPFIRE, LIGHTING, MAX_DARKNESS } from '../data/ambient';
import { ARENA } from '../data/arena';
import type { Bounds, Point } from './arena';
import type { Obstacle } from './obstacles';
import { scaleParticles } from './performance';
import { Rng } from './rng';

export interface Weather {
	def: AmbientDef;
	/** Live particle cap after the tier scale. */
	count: number;
}

/** Weather of a biome for a tier scale; `null` when the scale turns it off. */
export function weatherFor(biome: BiomeId, ambientScale: number): Weather | null {
	const def = AMBIENT[biome];
	const count = scaleParticles(def.count, ambientScale);
	return ambientScale > 0 && count > 0 ? { def, count } : null;
}

/** Flow settings that keep `count` particles alive: a batch every >= 33 ms instead of one per frame. */
export function emitRate(
	count: number,
	life: readonly [number, number],
): {
	frequency: number;
	quantity: number;
} {
	const avg = (life[0] + life[1]) / 2;
	const quantity = Math.max(1, Math.ceil((count * 33) / avg));
	return { frequency: (quantity * avg) / count, quantity };
}

/** Ambient light of a biome, with the darkness clamped so enemies and marks stay readable. */
export function lightingFor(biome: BiomeId): LightingDef {
	const l = LIGHTING[biome];
	return { ...l, darkness: Math.min(l.darkness, MAX_DARKNESS) };
}

export interface CampfireSpot extends Point {
	/** Index in the fixed candidate sequence of the seed. */
	id: number;
}

/** Number of campfires an arena of `side` tiles holds. */
export function campfireCount(side: number): number {
	return Math.max(CAMPFIRE.min, Math.ceil(side / CAMPFIRE.tilesPerFire));
}

/**
 * Campfire positions of an arena. Candidates come from a fixed per-seed sequence over the largest
 * arena, so the same seed always yields the same spots; the current bounds only decide which of
 * them are reachable. Spots in `existing` are kept (a fire never moves when the arena grows);
 * new ones are added in candidate order up to `campfireCount`.
 */
export function campfireSpots(
	seed: number,
	bounds: Bounds,
	side: number,
	props: readonly Obstacle[],
	existing: readonly CampfireSpot[] = [],
): CampfireSpot[] {
	const half = (ARENA.maxSide * ARENA.tile) / 2;
	const rng = new Rng((seed ^ 0x51f15eed) >>> 0);
	const out = [...existing];
	const want = campfireCount(side);
	const cand: CampfireSpot[] = [];
	for (let id = 0; id < CAMPFIRE.candidates; id++) {
		const x = rng.range(-half, half);
		const y = rng.range(-half, half);
		cand.push({ id, x, y });
	}
	for (const c of cand) {
		if (out.length >= want) break;
		if (out.some((o) => o.id === c.id)) continue;
		const m = CAMPFIRE.edgeMargin;
		if (c.x < bounds.minX + m || c.x > bounds.maxX - m) continue;
		if (c.y < bounds.minY + m || c.y > bounds.maxY - m) continue;
		if (Math.hypot(c.x, c.y) < CAMPFIRE.clearRadius) continue;
		if (out.some((o) => Math.hypot(o.x - c.x, o.y - c.y) < CAMPFIRE.fireGap)) continue;
		if (props.some((p) => Math.hypot(p.x - c.x, p.y - c.y) < p.r + CAMPFIRE.propMargin))
			continue;
		out.push(c);
	}
	return out;
}

/** Light level 0..1 of a fire at `time` s; steady at the base when flashes are reduced. */
export function firePulse(time: number, phase: number, reducedFlashes: boolean): number {
	const p = CAMPFIRE.pulse;
	if (reducedFlashes) return p.base;
	return p.base + p.swing * Math.sin(time * p.speed + phase) * Math.cos(time * 3.1 + phase * 2);
}
