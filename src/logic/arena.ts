import { ARENA } from '../data/arena';
import { OBSTACLES } from '../data/obstacles';
import type { Obstacle } from './obstacles';
import { Rng } from './rng';

export interface Bounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

export interface Point {
	x: number;
	y: number;
}

/** Arena side in tiles for a round: grows `growth` per round up to `maxSide`. */
export function arenaSide(round: number): number {
	const n = Math.max(1, Math.floor(round));
	return Math.min(ARENA.startSide + (n - 1) * ARENA.growth, ARENA.maxSide);
}

/** World bounds of the arena, centered on the origin (growth keeps world coordinates). */
export function arenaBounds(round: number, sideOverride?: number): Bounds {
	const half = ((sideOverride ?? arenaSide(round)) * ARENA.tile) / 2;
	return { minX: -half, minY: -half, maxX: half, maxY: half };
}

/** Keeps a circle of radius `r` inside the bounds (mutates and returns `p`). */
export function clampToArena<T extends Point>(p: T, r: number, b: Bounds): T {
	p.x = Math.min(Math.max(p.x, b.minX + r), b.maxX - r);
	p.y = Math.min(Math.max(p.y, b.minY + r), b.maxY - r);
	return p;
}

/**
 * Camera center for a hero at `target`: follows the hero but never shows past the walls; an axis
 * where the arena is smaller than the view stays centered on the arena (RF-05).
 */
export function clampCameraCenter(target: Point, viewW: number, viewH: number, b: Bounds): Point {
	const axis = (v: number, min: number, max: number, span: number): number =>
		max - min <= span ? (min + max) / 2 : Math.min(Math.max(v, min + span / 2), max - span / 2);
	return {
		x: axis(target.x, b.minX, b.maxX, viewW),
		y: axis(target.y, b.minY, b.maxY, viewH),
	};
}

export function insideBounds(p: Point, b: Bounds): boolean {
	return p.x >= b.minX && p.x <= b.maxX && p.y >= b.minY && p.y <= b.maxY;
}

/** Random point on the 1-tile ring along the arena edge. */
function ringPoint(b: Bounds, rng: Rng): Point {
	const t = ARENA.tile;
	const w = b.maxX - b.minX;
	const h = b.maxY - b.minY;
	// Pick a side proportionally to its length so the ring is uniform.
	const along = rng.next() * 2 * (w + h);
	const depth = rng.next() * t;
	if (along < w) return { x: b.minX + along, y: b.minY + depth };
	if (along < 2 * w) return { x: b.minX + (along - w), y: b.maxY - depth };
	if (along < 2 * w + h) return { x: b.minX + depth, y: b.minY + (along - 2 * w) };
	return { x: b.maxX - depth, y: b.minY + (along - 2 * w - h) };
}

export interface SpawnPoint extends Point {
	/** True when the point is inside the camera view: show `fx.spawnMark` first. */
	telegraph: boolean;
}

/**
 * `n` spawn points on the inner ring (RF-04). Points outside the visible rectangle + margin
 * are preferred; when the whole ring is visible, any ring point is used with a telegraph.
 */
export function spawnRing(b: Bounds, visible: Bounds, rng: Rng, n: number): SpawnPoint[] {
	const m = ARENA.spawnViewMargin;
	const view: Bounds = {
		minX: visible.minX - m,
		minY: visible.minY - m,
		maxX: visible.maxX + m,
		maxY: visible.maxY + m,
	};
	const out: SpawnPoint[] = [];
	for (let i = 0; i < n; i++) {
		let p = ringPoint(b, rng);
		let hidden = !insideBounds(p, view);
		// Rejection sampling: cheap because the ring outside the view is usually large.
		for (let tries = 0; !hidden && tries < 24; tries++) {
			p = ringPoint(b, rng);
			hidden = !insideBounds(p, view);
		}
		out.push({ x: p.x, y: p.y, telegraph: !hidden });
	}
	return out;
}

/** Stable per-tile seed: the same (seed, tx, ty) always paints the same ground variant. */
export function tileSeed(seed: number, tx: number, ty: number): number {
	let h = seed ^ Math.imul(tx, 0x27d4eb2d) ^ Math.imul(ty, 0x165667b1);
	h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
	h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
	return (h ^ (h >>> 16)) >>> 0;
}

/** Ground variant of a tile (RF-07). Variant 0 is the plain ground; the others are rarer details. */
export function tileVariant(seed: number, tx: number, ty: number, variants: number): number {
	const weights = Array.from({ length: variants }, (_, i) => (i === 0 ? 6 : 1));
	return new Rng(tileSeed(seed, tx, ty)).weightedIndex(weights);
}

export interface PropLayout {
	decoVariants: number;
	/** Probability of a prop per tile. */
	decoDensity: number;
}

export interface Prop extends Obstacle {
	variant: number;
}

/**
 * Solid props of an arena (RF-07): deterministic per seed. Big rocks (3-5x the hero) are only
 * placed with a free lane of `OBSTACLES.minGap` to every other prop and to the edge, away from
 * the hero spawn, and never past `OBSTACLES.maxCoverage` of the floor.
 */
export function propLayout(seed: number, layout: PropLayout, b: Bounds): Prop[] {
	const t = ARENA.tile;
	const clear = ARENA.propClearTiles * t;
	const gap = OBSTACLES.minGap;
	const rng = new Rng(seed ^ 0x9e3779b9);
	const props: Prop[] = [];
	const area = (b.maxX - b.minX) * (b.maxY - b.minY);
	let covered = 0;
	// Skip the outer ring: it is the spawn lane.
	for (let ty = b.minY + t; ty < b.maxY - t; ty += t) {
		for (let tx = b.minX + t; tx < b.maxX - t; tx += t) {
			if (!rng.chance(layout.decoDensity)) continue;
			const variant = rng.int(0, Math.max(0, layout.decoVariants - 1));
			const x = tx + rng.range(0.25, 0.75) * t;
			const y = ty + rng.range(0.25, 0.75) * t;
			const r =
				OBSTACLES.radiusByVariant[variant] ?? (OBSTACLES.radiusByVariant[0] as number);
			if (Math.hypot(x, y) < clear + r) continue;
			const edge = Math.min(x - b.minX, b.maxX - x, y - b.minY, b.maxY - y);
			if (edge < r + gap) continue;
			if (props.some((p) => Math.hypot(p.x - x, p.y - y) < p.r + r + gap)) continue;
			if (covered + Math.PI * r * r > area * OBSTACLES.maxCoverage) continue;
			covered += Math.PI * r * r;
			props.push({ x, y, r, variant });
		}
	}
	return props;
}
