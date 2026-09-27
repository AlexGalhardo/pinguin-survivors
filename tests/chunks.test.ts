import { describe, expect, test } from 'bun:test';
import { CHUNK_TILES, CHUNK_WORLD } from '../src/config/constants';
import {
	chunkKey,
	chunkOf,
	chunkScreenBounds,
	chunkSeed,
	generateChunk,
	visibleChunks,
} from '../src/logic/chunks';

describe('chunk coords', () => {
	test('floor division handles negatives', () => {
		expect(chunkOf(0, 0)).toEqual({ cx: 0, cy: 0 });
		expect(chunkOf(CHUNK_WORLD - 0.1, -0.1)).toEqual({ cx: 0, cy: -1 });
		expect(chunkKey(-2, 3)).toBe('-2,3');
	});

	test('screen bounds of chunk 0,0 is a 2S x S box centered on x=0', () => {
		expect(chunkScreenBounds(0, 0)).toEqual({
			x: -CHUNK_WORLD,
			y: 0,
			width: 2 * CHUNK_WORLD,
			height: CHUNK_WORLD,
		});
	});
});

describe('visibleChunks', () => {
	test('covers every point of the view', () => {
		const view = { x: -640, y: -270, width: 1280, height: 540 };
		const keys = new Set(visibleChunks(view).map((c) => chunkKey(c.cx, c.cy)));
		for (let sx = view.x; sx <= view.x + view.width; sx += 40) {
			for (let sy = view.y; sy <= view.y + view.height; sy += 40) {
				const c = chunkOf(sy + sx / 2, sy - sx / 2);
				expect(keys.has(chunkKey(c.cx, c.cy))).toBe(true);
			}
		}
	});

	test('margin adds chunks and stays bounded', () => {
		const view = { x: -640, y: -270, width: 1280, height: 540 };
		const base = visibleChunks(view).length;
		const grown = visibleChunks(view, 1).length;
		expect(grown).toBeGreaterThan(base);
		expect(grown).toBeLessThanOrEqual(48);
	});
});

describe('generateChunk', () => {
	test('is deterministic per (seed, cx, cy)', () => {
		expect(generateChunk(7, 2, -3, 4, 5, 0.05)).toEqual(generateChunk(7, 2, -3, 4, 5, 0.05));
		expect(chunkSeed(7, 2, -3)).not.toBe(chunkSeed(7, -3, 2));
	});

	test('fills every tile and keeps decorations inside the chunk', () => {
		const c = generateChunk(1, -1, 4, 4, 5, 0.05);
		expect(c.tiles).toHaveLength(CHUNK_TILES * CHUNK_TILES);
		for (const d of c.decorations) {
			expect(d.x).toBeGreaterThanOrEqual(-CHUNK_WORLD);
			expect(d.x).toBeLessThan(0);
			expect(d.y).toBeGreaterThanOrEqual(4 * CHUNK_WORLD);
			expect(d.y).toBeLessThan(5 * CHUNK_WORLD);
		}
	});
});
