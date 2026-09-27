import type Phaser from 'phaser';
import { BIOMES, type BiomeId, KEYS } from '../art/manifest';
import { CHUNK_WORLD, TILE_WORLD } from '../config/constants';
import {
	type ChunkCoord,
	chunkKey,
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
