import { CHUNK_TILES, CHUNK_WORLD } from '../config/constants';
import { worldToScreen } from './iso';
import { Rng } from './rng';

export interface ChunkCoord {
	cx: number;
	cy: number;
}

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export const chunkKey = (cx: number, cy: number): string => `${cx},${cy}`;

export function chunkOf(x: number, y: number): ChunkCoord {
	return { cx: Math.floor(x / CHUNK_WORLD), cy: Math.floor(y / CHUNK_WORLD) };
}

/** Screen-space bounding box of a chunk (a diamond on screen). */
export function chunkScreenBounds(cx: number, cy: number): Rect {
	const x0 = cx * CHUNK_WORLD;
	const y0 = cy * CHUNK_WORLD;
	const left = worldToScreen(x0, y0 + CHUNK_WORLD).x;
	const top = worldToScreen(x0, y0).y;
	return { x: left, y: top, width: 2 * CHUNK_WORLD, height: CHUNK_WORLD };
}

function intersects(a: Rect, b: Rect): boolean {
	return (
		a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
	);
}

/** Chunks whose diamond bounding box touches the screen rect grown by `margin` chunks. */
export function visibleChunks(view: Rect, margin = 0): ChunkCoord[] {
	const pad = margin * CHUNK_WORLD;
	const grown: Rect = {
		x: view.x - pad * 2,
		y: view.y - pad,
		width: view.width + pad * 4,
		height: view.height + pad * 2,
	};
	// Screen corners → world; the rect's world footprint is a rotated square, so take its bbox.
	const corners = [
		[grown.x, grown.y],
		[grown.x + grown.width, grown.y],
		[grown.x, grown.y + grown.height],
		[grown.x + grown.width, grown.y + grown.height],
	].map(([sx, sy]) => ({
		x: (sy as number) + (sx as number) / 2,
		y: (sy as number) - (sx as number) / 2,
	}));
	const xs = corners.map((c) => c.x);
	const ys = corners.map((c) => c.y);
	const minC = chunkOf(Math.min(...xs), Math.min(...ys));
	const maxC = chunkOf(Math.max(...xs), Math.max(...ys));
	const out: ChunkCoord[] = [];
	for (let cx = minC.cx; cx <= maxC.cx; cx++) {
		for (let cy = minC.cy; cy <= maxC.cy; cy++) {
			if (intersects(chunkScreenBounds(cx, cy), grown)) out.push({ cx, cy });
		}
	}
	return out;
}

/** Stable per-chunk seed so the same world seed always rebuilds the same chunk. */
export function chunkSeed(worldSeed: number, cx: number, cy: number): number {
	let h = worldSeed ^ Math.imul(cx, 0x27d4eb2d) ^ Math.imul(cy, 0x165667b1);
	h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
	h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
	return (h ^ (h >>> 16)) >>> 0;
}

export interface TileCell {
	tx: number;
	ty: number;
	/** Ground variant index into the biome's tile list. */
	variant: number;
}

export interface Decoration {
	/** World position. */
	x: number;
	y: number;
	variant: number;
}

export interface ChunkContent {
	tiles: TileCell[];
	decorations: Decoration[];
}

export function generateChunk(
	worldSeed: number,
	cx: number,
	cy: number,
	tileVariants: number,
	decoVariants: number,
	decoDensity: number,
): ChunkContent {
	const rng = new Rng(chunkSeed(worldSeed, cx, cy));
	const tiles: TileCell[] = [];
	for (let ty = 0; ty < CHUNK_TILES; ty++) {
		for (let tx = 0; tx < CHUNK_TILES; tx++) {
			tiles.push({ tx, ty, variant: rng.weightedIndex(variantWeights(tileVariants)) });
		}
	}
	const decorations: Decoration[] = [];
	const count = Math.floor(decoDensity * CHUNK_TILES * CHUNK_TILES);
	for (let i = 0; i < count; i++) {
		decorations.push({
			x: cx * CHUNK_WORLD + rng.range(0, CHUNK_WORLD),
			y: cy * CHUNK_WORLD + rng.range(0, CHUNK_WORLD),
			variant: rng.int(0, decoVariants - 1),
		});
	}
	return { tiles, decorations };
}

// First variant is the "plain" ground; the rest are rarer details.
function variantWeights(n: number): number[] {
	return Array.from({ length: n }, (_, i) => (i === 0 ? 6 : 1));
}
