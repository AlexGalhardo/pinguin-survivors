import type Phaser from 'phaser';
import { BIOMES, type BiomeId, KEYS } from '../art/manifest';
import { CHUNK_WORLD, TILE_WORLD } from '../config/constants';
import {
	type ChunkCoord,
	chunkKey,
	chunkOf,
	chunkScreenBounds,
	generateChunk,
	type Rect,
	visibleChunks,
} from '../logic/chunks';
import { isoDepth, worldToScreen } from '../logic/iso';

/** Ground sits below every entity; entities use isoDepth (x + y) which can be negative. */
export const GROUND_DEPTH = -1e9;

interface Surface {
	texture: Phaser.Textures.DynamicTexture;
	image: Phaser.GameObjects.Image;
}

/** A blood/scorch mark in chunk-local screen pixels, kept to re-stamp when the chunk returns. */
interface Decal {
	x: number;
	y: number;
	key: string;
	scale: number;
	angle: number;
	flip: boolean;
	alpha: number;
}

/** Oldest marks are dropped past this; they stay baked while the chunk is alive. */
const MAX_DECALS_PER_CHUNK = 400;

interface ActiveChunk extends ChunkCoord {
	surface: Surface;
	decorations: Phaser.GameObjects.Image[];
}

/**
 * Keeps the chunks that touch the camera alive. Each chunk bakes its 16x16 ground tiles into a
 * pooled DynamicTexture (one draw per chunk); blood decals will be stamped on the same surface.
 */
export class ChunkManager {
	private readonly active = new Map<string, ActiveChunk>();
	private readonly surfaces: Surface[] = [];
	private readonly decoPool: Phaser.GameObjects.Image[] = [];
	private surfaceCount = 0;
	private readonly decals = new Map<string, Decal[]>();
	private readonly dirty = new Set<string>();
	/** Total marks ever stamped (achievements, debug). */
	decalCount = 0;

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly seed: number,
		private readonly biome: BiomeId,
	) {}

	get count(): number {
		return this.active.size;
	}

	update(view: Rect): void {
		const wanted = new Map<string, ChunkCoord>();
		for (const c of visibleChunks(view)) wanted.set(chunkKey(c.cx, c.cy), c);
		for (const [key, chunk] of this.active) {
			if (!wanted.has(key)) this.release(key, chunk);
		}
		for (const [key, c] of wanted) {
			if (!this.active.has(key)) this.active.set(key, this.build(c));
		}
		for (const key of this.dirty) this.active.get(key)?.surface.texture.render();
		this.dirty.clear();
	}

	/**
	 * Stamps a ground mark (blood, gibs, craters) into the chunk under (x, y). It persists for
	 * the whole run (P-10): re-stamped whenever the chunk is rebuilt.
	 */
	addDecal(
		x: number,
		y: number,
		key: string,
		opts: { scale?: number; angle?: number; flip?: boolean; alpha?: number } = {},
	): void {
		const c = chunkOf(x, y);
		const ck = chunkKey(c.cx, c.cy);
		const bounds = chunkScreenBounds(c.cx, c.cy);
		const s = worldToScreen(x, y);
		const decal: Decal = {
			x: Math.round(s.x - bounds.x),
			y: Math.round(s.y - bounds.y),
			key,
			scale: opts.scale ?? 1,
			angle: opts.angle ?? 0,
			flip: opts.flip ?? false,
			alpha: opts.alpha ?? 1,
		};
		let list = this.decals.get(ck);
		if (!list) {
			list = [];
			this.decals.set(ck, list);
		}
		list.push(decal);
		if (list.length > MAX_DECALS_PER_CHUNK) list.shift();
		this.decalCount++;
		const active = this.active.get(ck);
		if (active) {
			this.stampDecal(active.surface.texture, decal);
			this.dirty.add(ck);
		}
	}

	private stampDecal(tex: Phaser.Textures.DynamicTexture, d: Decal): void {
		tex.stamp(d.key, undefined, d.x, d.y, {
			scaleX: d.flip ? -d.scale : d.scale,
			scaleY: d.scale,
			angle: d.angle,
			alpha: d.alpha,
		});
	}

	destroy(): void {
		for (const [key, chunk] of this.active) this.release(key, chunk);
	}

	private build(c: ChunkCoord): ActiveChunk {
		const def = BIOMES[this.biome];
		const content = generateChunk(
			this.seed,
			c.cx,
			c.cy,
			def.tileVariants,
			def.decoVariants,
			def.decoDensity,
		);
		const bounds = chunkScreenBounds(c.cx, c.cy);
		const surface = this.takeSurface(bounds.width, bounds.height);
		const tex = surface.texture;
		tex.clear();
		const x0 = c.cx * CHUNK_WORLD;
		const y0 = c.cy * CHUNK_WORLD;
		for (const tile of content.tiles) {
			const s = worldToScreen(
				x0 + (tile.tx + 0.5) * TILE_WORLD,
				y0 + (tile.ty + 0.5) * TILE_WORLD,
			);
			tex.stamp(
				KEYS.tile(def.id, tile.variant),
				undefined,
				Math.round(s.x - bounds.x),
				Math.round(s.y - bounds.y),
			);
		}
		for (const d of this.decals.get(chunkKey(c.cx, c.cy)) ?? []) this.stampDecal(tex, d);
		tex.render();
		surface.image.setPosition(bounds.x, bounds.y).setVisible(true);

		const decorations = content.decorations.map((d) => {
			const img = this.decoPool.pop() ?? this.scene.add.image(0, 0, KEYS.deco(def.id, 0));
			const s = worldToScreen(d.x, d.y);
			return img
				.setTexture(KEYS.deco(def.id, d.variant))
				.setOrigin(0.5, 0.85)
				.setPosition(Math.round(s.x), Math.round(s.y))
				.setDepth(isoDepth(d.x, d.y))
				.setVisible(true);
		});
		return { ...c, surface, decorations };
	}

	private release(key: string, chunk: ActiveChunk): void {
		chunk.surface.image.setVisible(false);
		this.surfaces.push(chunk.surface);
		for (const img of chunk.decorations) {
			img.setVisible(false);
			this.decoPool.push(img);
		}
		this.active.delete(key);
	}

	private takeSurface(width: number, height: number): Surface {
		const pooled = this.surfaces.pop();
		if (pooled) return pooled;
		const key = `chunk.surface.${this.surfaceCount++}`;
		const texture = this.scene.textures.addDynamicTexture(key, width, height);
		if (!texture) throw new Error(`could not create ${key}`);
		const image = this.scene.add.image(0, 0, key).setOrigin(0, 0).setDepth(GROUND_DEPTH);
		return { texture, image };
	}
}
