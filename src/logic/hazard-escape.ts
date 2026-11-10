import { type HazardShape, hazardHits } from './boss-hazard';

/** A red mark that has not detonated yet: `remaining` seconds of round clock until it hurts. */
export interface PendingMark {
	shape: HazardShape;
	remaining: number;
	group: number;
}

interface Point {
	x: number;
	y: number;
}

/** Distance between candidate rings, angles per ring and the farthest point the search considers. */
const RING_STEP = 24;
const ANGLES = 24;
const MAX_REACH = 420;
/** Extra clearance beyond the hero body so a dodge is not decided by one pixel. */
const MARGIN = 8;

/**
 * Would a hero walking straight from `from` to `to` at `speed` (units per round-clock second) be inside
 * a mark when it detonates? The hero is already at `to` for marks that detonate after he arrives.
 */
function walkHit(m: PendingMark, from: Point, to: Point, dist: number, speed: number, r: number) {
	const k = dist > 0 ? Math.min(1, (m.remaining * speed) / dist) : 1;
	const x = from.x + (to.x - from.x) * k;
	const y = from.y + (to.y - from.y) * k;
	return hazardHits(m.shape, x, y, r + MARGIN);
}

/**
 * Nearest point where the hero is not hit by any pending mark when it detonates, reached by a straight
 * walk at `speed` (units per round-clock second). Returns `from` itself when staying is already safe and
 * null when nothing within reach is (the caller keeps its normal behavior). Marks that detonate in several
 * waves (ring, lines, checkerboard) are judged at their own detonation time, so the hero may cross a
 * wave's footprint before it fires.
 */
export function safePoint(
	marks: readonly PendingMark[],
	from: Point,
	radius: number,
	speed: number,
): Point | null {
	if (marks.length === 0) return from;
	const safeAt = (to: Point, dist: number) =>
		!marks.some((m) => walkHit(m, from, to, dist, speed, radius));
	if (safeAt(from, 0)) return from;
	for (let d = RING_STEP; d <= MAX_REACH; d += RING_STEP) {
		for (let i = 0; i < ANGLES; i++) {
			const a = (i * Math.PI * 2) / ANGLES;
			const to = { x: from.x + Math.cos(a) * d, y: from.y + Math.sin(a) * d };
			if (safeAt(to, d)) return to;
		}
	}
	return null;
}
