import { CHUNK_WORLD } from '../config/constants';
import { OBSTACLES } from '../data/obstacles';
import { chunkKey, generateChunk } from './chunks';

export interface Obstacle {
	x: number;
	y: number;
	r: number;
}

export interface BiomeLayout {
	tileVariants: number;
	decoVariants: number;
	decoDensity: number;
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

/** Solid decorations of the world, generated lazily per chunk from the same seed as the art. */
export class ObstacleField {
	private readonly cache = new Map<string, Obstacle[]>();
	private readonly out: Obstacle[] = [];

	constructor(
		private readonly seed: number,
		private layout: BiomeLayout,
	) {}

	setLayout(layout: BiomeLayout): void {
		this.layout = layout;
		this.cache.clear();
	}

	/** Obstacles that may touch a circle of `radius` around (x, y). Reuses one array. */
	near(x: number, y: number, radius: number): readonly Obstacle[] {
		const out = this.out;
		out.length = 0;
		const reach = radius + Math.max(...OBSTACLES.radiusByVariant);
		const c0x = Math.floor((x - reach) / CHUNK_WORLD);
		const c1x = Math.floor((x + reach) / CHUNK_WORLD);
		const c0y = Math.floor((y - reach) / CHUNK_WORLD);
		const c1y = Math.floor((y + reach) / CHUNK_WORLD);
		for (let cx = c0x; cx <= c1x; cx++) {
			for (let cy = c0y; cy <= c1y; cy++) {
				for (const o of this.chunk(cx, cy)) {
					if (Math.abs(o.x - x) <= reach && Math.abs(o.y - y) <= reach) out.push(o);
				}
			}
		}
		return out;
	}

	private chunk(cx: number, cy: number): Obstacle[] {
		const key = chunkKey(cx, cy);
		let list = this.cache.get(key);
		if (list) return list;
		const l = this.layout;
		const content = generateChunk(
			this.seed,
			cx,
			cy,
			l.tileVariants,
			l.decoVariants,
			l.decoDensity,
		);
		list = content.decorations.map((d) => ({
			x: d.x,
			y: d.y,
			r: OBSTACLES.radiusByVariant[d.variant] ?? OBSTACLES.radiusByVariant[0],
		}));
		if (this.cache.size >= OBSTACLES.cacheChunks) {
			const oldest = this.cache.keys().next().value;
			if (oldest !== undefined) this.cache.delete(oldest);
		}
		this.cache.set(key, list);
		return list;
	}
}
