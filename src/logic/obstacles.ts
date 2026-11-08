import { OBSTACLES } from '../data/obstacles';

export interface Obstacle {
	x: number;
	y: number;
	r: number;
}

/**
 * Pushes a circle (x, y, radius) out of every overlapping obstacle. Sliding along the edge is
 * what makes movers walk around rocks and crates without pathfinding.
 */
export function pushOut(
	p: { x: number; y: number },
	radius: number,
	obstacles: readonly Obstacle[],
): boolean {
	let moved = false;
	for (const o of obstacles) {
		const dx = p.x - o.x;
		const dy = p.y - o.y;
		const min = radius + o.r;
		const d2 = dx * dx + dy * dy;
		if (d2 >= min * min) continue;
		const d = Math.sqrt(d2);
		// Dead center: nudge along +x so the result stays deterministic.
		const nx = d > 0 ? dx / d : 1;
		const ny = d > 0 ? dy / d : 0;
		p.x = o.x + nx * min;
		p.y = o.y + ny * min;
		moved = true;
	}
	return moved;
}

/** Solid props of the arena (RF-07); `near` is a linear scan, the arena holds ~100 props at most. */
export class ObstacleField {
	private readonly out: Obstacle[] = [];

	constructor(private props: readonly Obstacle[]) {}

	setProps(props: readonly Obstacle[]): void {
		this.props = props;
	}

	/** Obstacles that may touch a circle of `radius` around (x, y). Reuses one array. */
	near(x: number, y: number, radius: number): readonly Obstacle[] {
		const out = this.out;
		out.length = 0;
		const reach = radius + Math.max(...OBSTACLES.radiusByVariant);
		for (const o of this.props) {
			if (Math.abs(o.x - x) <= reach && Math.abs(o.y - y) <= reach) out.push(o);
		}
		return out;
	}
}
