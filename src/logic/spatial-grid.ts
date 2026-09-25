export interface Positioned {
	x: number;
	y: number;
}

/**
 * Uniform grid for neighbor queries (separation, auto-target). Rebuilt every frame:
 * clear() + insert(). Cells are plain arrays that are reused (no per-frame allocation).
 */
export class SpatialGrid<T extends Positioned> {
	private readonly cols: number;
	private readonly rows: number;
	private readonly cells: T[][];

	constructor(
		private readonly cellSize: number,
		width: number,
		height: number,
	) {
		this.cols = Math.max(1, Math.ceil(width / cellSize));
		this.rows = Math.max(1, Math.ceil(height / cellSize));
		this.cells = Array.from({ length: this.cols * this.rows }, () => []);
	}

	clear(): void {
		for (const c of this.cells) c.length = 0;
	}

	private col(x: number): number {
		return Math.min(this.cols - 1, Math.max(0, Math.floor(x / this.cellSize)));
	}

	private row(y: number): number {
		return Math.min(this.rows - 1, Math.max(0, Math.floor(y / this.cellSize)));
	}

	insert(item: T): void {
		this.cells[this.row(item.y) * this.cols + this.col(item.x)]?.push(item);
	}

	/** Items whose position is within `radius` of (x, y). Results are appended to `out`. */
	queryRadius(x: number, y: number, radius: number, out: T[] = []): T[] {
		const r2 = radius * radius;
		const c0 = this.col(x - radius);
		const c1 = this.col(x + radius);
		const r0 = this.row(y - radius);
		const r1 = this.row(y + radius);
		for (let r = r0; r <= r1; r++) {
			for (let c = c0; c <= c1; c++) {
				const cell = this.cells[r * this.cols + c];
				if (!cell) continue;
				for (const it of cell) {
					const dx = it.x - x;
					const dy = it.y - y;
					if (dx * dx + dy * dy <= r2) out.push(it);
				}
			}
		}
		return out;
	}

	/** Nearest item within maxRadius (expanding ring search), or undefined. */
	nearest(x: number, y: number, maxRadius: number, accept?: (item: T) => boolean): T | undefined {
		let best: T | undefined;
		let bestD2 = maxRadius * maxRadius;
		const cx = this.col(x);
		const cy = this.row(y);
		const maxRing = Math.ceil(maxRadius / this.cellSize) + 1;
		for (let ring = 0; ring <= maxRing; ring++) {
			// Once a candidate is closer than the inner edge of this ring we can stop.
			if (best && (ring - 1) * this.cellSize > Math.sqrt(bestD2)) break;
			for (let r = cy - ring; r <= cy + ring; r++) {
				if (r < 0 || r >= this.rows) continue;
				for (let c = cx - ring; c <= cx + ring; c++) {
					if (c < 0 || c >= this.cols) continue;
					if (Math.max(Math.abs(r - cy), Math.abs(c - cx)) !== ring) continue;
					const cell = this.cells[r * this.cols + c];
					if (!cell) continue;
					for (const it of cell) {
						const dx = it.x - x;
						const dy = it.y - y;
						const d2 = dx * dx + dy * dy;
						if (d2 <= bestD2 && (!accept || accept(it))) {
							bestD2 = d2;
							best = it;
						}
					}
				}
			}
		}
		return best;
	}
}

/** Brute-force nearest (used below the grid threshold and to validate the grid in tests). */
export function nearestLinear<T extends Positioned>(
	items: Iterable<T>,
	x: number,
	y: number,
	maxRadius: number,
	accept?: (item: T) => boolean,
): T | undefined {
	let best: T | undefined;
	let bestD2 = maxRadius * maxRadius;
	for (const it of items) {
		const dx = it.x - x;
		const dy = it.y - y;
		const d2 = dx * dx + dy * dy;
		if (d2 <= bestD2 && (!accept || accept(it))) {
			bestD2 = d2;
			best = it;
		}
	}
	return best;
}
