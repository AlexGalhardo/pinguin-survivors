import { ARENA } from '../data/arena';
import type { Bounds } from './arena';

/** A persistent ground mark in world coordinates (RF-08). `key` is the splat/gib frame. */
export interface Decal {
	x: number;
	y: number;
	key: string;
	scale: number;
	/** Rotation in degrees. */
	rot: number;
	flip: boolean;
	alpha: number;
}

/** Capped log of the run's decals: the oldest are dropped past the cap. Ring buffer, O(1) add. */
export class DecalLog {
	private readonly items: Decal[] = [];
	private head = 0;
	/** Marks ever added, including dropped ones (achievements, debug). */
	total = 0;

	constructor(private readonly cap: number = ARENA.decalCap) {}

	get size(): number {
		return this.items.length;
	}

	add(d: Decal): void {
		this.total++;
		if (this.items.length < this.cap) {
			this.items.push(d);
			return;
		}
		this.items[this.head] = d;
		this.head = (this.head + 1) % this.cap;
	}

	/** Oldest first, so re-stamping keeps the original overlap order. */
	forEach(fn: (d: Decal) => void): void {
		const n = this.items.length;
		for (let i = 0; i < n; i++) fn(this.items[(this.head + i) % n] as Decal);
	}
}

/** Position of a decal inside an arena-sized texture whose top-left corner is `b.min`. */
export function decalLocal(d: Decal, b: Bounds): { x: number; y: number } {
	return { x: d.x - b.minX, y: d.y - b.minY };
}
