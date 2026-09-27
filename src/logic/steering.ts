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
	let vx = dx + sx * separationWeight;
	let vy = dy + sy * separationWeight;
	const len = Math.hypot(vx, vy);
	if (len > 1) {
		vx /= len;
		vy /= len;
	}
	return { vx: vx * self.speed, vy: vy * self.speed };
}
