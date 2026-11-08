import type Phaser from 'phaser';
import type { Bounds } from '../logic/arena';
import { type Decal, DecalLog, decalLocal } from '../logic/gore';

const GORE_KEY = 'arena.gore';

/**
 * Blood, gibs and craters baked into one transparent DynamicTexture the size of the arena
 * (RF-08). Decals keep world coordinates; `grow` re-stamps them into the bigger texture.
 * Gore mode (reduced / goo) is decided by the caller: it only picks the frames it passes in.
 */
export class GoreLayer {
	private readonly log = new DecalLog();
	private texture: Phaser.Textures.DynamicTexture | null = null;
	private image: Phaser.GameObjects.Image | null = null;
	private dirty = false;

	constructor(
		private readonly scene: Phaser.Scene,
		private bounds: Bounds,
		private readonly depth: number,
	) {
		this.build();
	}

	/** Decals currently kept (capped). */
	get count(): number {
		return this.log.size;
	}

	/** Marks ever stamped this run. */
	get total(): number {
		return this.log.total;
	}

	add(
		x: number,
		y: number,
		key: string,
		opts: { scale?: number; angle?: number; flip?: boolean; alpha?: number } = {},
	): void {
		const d: Decal = {
			x,
			y,
			key,
			scale: opts.scale ?? 1,
			rot: opts.angle ?? 0,
			flip: opts.flip ?? false,
			alpha: opts.alpha ?? 1,
		};
		this.log.add(d);
		if (!this.texture) return;
		this.stamp(this.texture, d);
		this.dirty = true;
	}

	/** New arena bounds: the texture is rebuilt at the new size and every decal re-stamped. */
	grow(bounds: Bounds): void {
		this.bounds = bounds;
		this.build();
	}

	/** Flushes pending stamps to the GPU; call once per frame. */
	update(): void {
		if (!this.dirty) return;
		this.texture?.render();
		this.dirty = false;
	}

	destroy(): void {
		this.image?.destroy();
		this.image = null;
		this.texture = null;
		if (this.scene.textures.exists(GORE_KEY)) this.scene.textures.remove(GORE_KEY);
	}

	private stamp(tex: Phaser.Textures.DynamicTexture, d: Decal): void {
		const p = decalLocal(d, this.bounds);
		tex.stamp(d.key, undefined, p.x, p.y, {
			scaleX: d.flip ? -d.scale : d.scale,
			scaleY: d.scale,
			angle: d.rot,
			alpha: d.alpha,
		});
	}

	private build(): void {
		this.image?.destroy();
		if (this.scene.textures.exists(GORE_KEY)) this.scene.textures.remove(GORE_KEY);
		const w = this.bounds.maxX - this.bounds.minX;
		const h = this.bounds.maxY - this.bounds.minY;
		const tex = this.scene.textures.addDynamicTexture(GORE_KEY, w, h);
		if (!tex) throw new Error(`could not create ${GORE_KEY}`);
		this.texture = tex;
		this.log.forEach((d) => {
			this.stamp(tex, d);
		});
		tex.render();
		this.dirty = false;
		this.image = this.scene.add
			.image(this.bounds.minX, this.bounds.minY, GORE_KEY)
			.setOrigin(0, 0)
			.setDepth(this.depth);
	}
}
