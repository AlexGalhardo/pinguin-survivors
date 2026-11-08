import { OBSTACLES } from '../data/obstacles';
import type { Obstacle } from './obstacles';
import type { SpatialGrid } from './spatial-grid';

export interface Mover {
	x: number;
	y: number;
	radius: number;
	speed: number;
}

/**
 * Seek the target plus separation from overlapping neighbors, so hordes spread into a crowd
 * instead of stacking. Returns the velocity (world units/s) for this frame.
 */
export function seekWithSeparation<T extends Mover>(
	self: T,
	targetX: number,
	targetY: number,
	grid: SpatialGrid<T>,
	scratch: T[],
	separationWeight = 1.4,
	obstacles: readonly Obstacle[] = [],
): { vx: number; vy: number } {
	let dx = targetX - self.x;
	let dy = targetY - self.y;
	const dist = Math.hypot(dx, dy);
	if (dist > 0) {
		dx /= dist;
		dy /= dist;
	}
	let sx = 0;
	let sy = 0;
	scratch.length = 0;
	grid.queryRadius(self.x, self.y, self.radius * 2.2, scratch);
	for (const other of scratch) {
		if (other === self) continue;
		const ox = self.x - other.x;
		const oy = self.y - other.y;
		const d = Math.hypot(ox, oy);
		const min = self.radius + other.radius;
		if (d >= min) continue;
		if (d === 0) {
			// Deterministic nudge for perfectly stacked spawns.
			sx += 1;
			continue;
		}
		const push = (min - d) / min;
		sx += (ox / d) * push;
		sy += (oy / d) * push;
	}
	const avoid = avoidObstacles(self, dx, dy, obstacles);
	let vx = dx + sx * separationWeight + avoid.x;
	let vy = dy + sy * separationWeight + avoid.y;
	const len = Math.hypot(vx, vy);
	if (len > 1) {
		vx /= len;
		vy /= len;
	}
	return { vx: vx * self.speed, vy: vy * self.speed };
}

/**
 * Sideways steer around the nearest obstacle that blocks the straight path (unit direction
 * dx, dy) within the lookahead, so walkers go around rocks instead of pressing into them.
 * Turns away from the side the obstacle sits on; dead ahead turns right (deterministic).
 */
export function avoidObstacles(
	self: Mover,
	dx: number,
	dy: number,
	obstacles: readonly Obstacle[],
): { x: number; y: number } {
	let best = Number.POSITIVE_INFINITY;
	let steerX = 0;
	let steerY = 0;
	for (const o of obstacles) {
		const ox = o.x - self.x;
		const oy = o.y - self.y;
		const ahead = ox * dx + oy * dy;
		if (ahead <= 0 || ahead > OBSTACLES.avoidLookahead + o.r || ahead >= best) continue;
		const side = dx * oy - dy * ox;
		const clearance = o.r + self.radius + OBSTACLES.avoidMargin;
		if (Math.abs(side) >= clearance) continue;
		best = ahead;
		// Closer to the path's center line and closer ahead: steer harder.
		const strength =
			(1 - Math.abs(side) / clearance) *
			(1 - ahead / (OBSTACLES.avoidLookahead + o.r + clearance)) *
			OBSTACLES.avoidWeight;
		// Obstacle on the left (side > 0): turn to the right normal (dy, -dx), and vice versa.
		const turn = side > 0 ? 1 : side < 0 ? -1 : 1;
		steerX = dy * turn * strength;
		steerY = -dx * turn * strength;
	}
	return { x: steerX, y: steerY };
}
