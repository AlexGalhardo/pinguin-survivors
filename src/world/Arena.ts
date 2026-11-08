import type Phaser from 'phaser';
import { BIOMES, KEYS } from '../art/manifest';
import type { BiomeId } from '../config/constants';
import { activeBudget } from '../core/tier';
import { ARENA } from '../data/arena';
import { OBSTACLES } from '../data/obstacles';
import {
	arenaBounds,
	arenaSide,
	type Bounds,
	type Prop,
	propLayout,
	tileVariant,
} from '../logic/arena';
import { GoreLayer } from './GoreLayer';

/** Ground sits below every entity; entities use depth = y, which can be negative. */
export const GROUND_DEPTH = -1e9;

const GROUND_KEY = 'arena.ground';

/**
 * The square top-down arena (SDD-001): ground tiles and wall border baked into one
 * DynamicTexture the size of the arena, plus solid props. `grow(round)` rebuilds it centered, so
 * world coordinates (hero, pickups, decals) never change.
 */
export class Arena {
	bounds: Bounds;
	props: Prop[] = [];
	readonly gore: GoreLayer;
	private side: number;
	private image: Phaser.GameObjects.Image | null = null;
	private readonly propImages: Phaser.GameObjects.Image[] = [];

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly seed: number,
		private biome: BiomeId,
		round: number,
		/** Debug (`?arena=NN`): fixed side in tiles, ignores the round. */
		private readonly sideOverride?: number,
	) {
		this.side = sideOverride ?? arenaSide(round);
		this.bounds = arenaBounds(round, sideOverride);
		this.gore = new GoreLayer(scene, this.bounds, GROUND_DEPTH + 1, activeBudget().decalCap);
		this.rebuild();
	}

	/** Total marks ever stamped (achievements, debug). */
	get decalCount(): number {
		return this.gore.total;
	}

	get sideTiles(): number {
		return this.side;
	}

	/** Swaps the ground art and re-rolls the props for the new biome (decals are kept). */
	setBiome(biome: BiomeId): void {
		if (biome === this.biome) return;
		this.biome = biome;
		this.rebuild();
	}

	/** Grows to the round's size. Props already placed stay; new ones fill the added ring. */
	grow(round: number): void {
		const side = this.sideOverride ?? arenaSide(round);
		if (side === this.side) return;
		const old = this.bounds;
		this.side = side;
		this.bounds = arenaBounds(round, this.sideOverride);
		this.gore.grow(this.bounds);
		this.rebuild(old);
	}

	/** Flushes pending decal stamps to the GPU; call once per frame. */
	update(): void {
		this.gore.update();
	}

	/** Stamps a ground mark (blood, gibs, craters). Persists for the whole run (P-10), capped. */
	addDecal(
		x: number,
		y: number,
		key: string,
		opts: { scale?: number; angle?: number; flip?: boolean; alpha?: number } = {},
	): void {
		this.gore.add(x, y, key, opts);
	}

	/**
	 * Frees the surface. The DynamicTexture lives in the global texture manager, so a new run
	 * ("play again") would otherwise crash re-creating `arena.ground`.
	 */
	destroy(): void {
		this.gore.destroy();
		this.image?.destroy();
		this.image = null;
		if (this.scene.textures.exists(GROUND_KEY)) this.scene.textures.remove(GROUND_KEY);
		for (const img of this.propImages) img.destroy();
		this.propImages.length = 0;
	}

	/** `previous` = bounds before growing: props inside its inner ring are kept as they are. */
	private rebuild(previous?: Bounds): void {
		this.rebuildGround();
		this.rebuildProps(previous);
	}

	private rebuildGround(): void {
		const t = ARENA.tile;
		const size = this.side * t;
		const def = BIOMES[this.biome];
		if (this.scene.textures.exists(GROUND_KEY)) this.scene.textures.remove(GROUND_KEY);
		const tex = this.scene.textures.addDynamicTexture(GROUND_KEY, size, size);
		if (!tex) throw new Error(`could not create ${GROUND_KEY}`);
		const last = this.side - 1;
		for (let ty = 0; ty <= last; ty++) {
			for (let tx = 0; tx <= last; tx++) {
				const cx = tx * t + t / 2;
				const cy = ty * t + t / 2;
				tex.stamp(
					KEYS.tile(def.id, tileVariant(this.seed, tx, ty, def.tileVariants)),
					undefined,
					cx,
					cy,
				);
				const left = tx === 0;
				const right = tx === last;
				const top = ty === 0;
				const bottom = ty === last;
				if (!(left || right || top || bottom)) continue;
				const corner = (left || right) && (top || bottom);
				// Edge art has the wall on top and the corner art on top-left; rotate clockwise.
				const angle = corner
					? left
						? top
							? 0
							: 270
						: top
							? 90
							: 180
					: top
						? 0
						: right
							? 90
							: bottom
								? 180
								: 270;
				tex.stamp(KEYS.border(def.id, corner ? 1 : 0), undefined, cx, cy, { angle });
			}
		}
		tex.render();
		if (this.image) this.image.destroy();
		this.image = this.scene.add
			.image(this.bounds.minX, this.bounds.minY, GROUND_KEY)
			.setOrigin(0, 0)
			.setDepth(GROUND_DEPTH);
	}

	private rebuildProps(previous?: Bounds): void {
		const def = BIOMES[this.biome];
		const t = ARENA.tile;
		let props = propLayout(this.seed, def, this.bounds);
		if (previous) {
			// Props from the old inner area stay put; the rest come from the fresh layout, keeping
			// the free lane to the props that stayed.
			const kept = this.props;
			props = [
				...kept,
				...props.filter(
					(p) =>
						(p.x < previous.minX + t ||
							p.x > previous.maxX - t ||
							p.y < previous.minY + t ||
							p.y > previous.maxY - t) &&
						kept.every(
							(k) => Math.hypot(k.x - p.x, k.y - p.y) >= k.r + p.r + OBSTACLES.minGap,
						),
				),
			];
		}
		this.props = props;
		props.forEach((p, i) => {
			let img = this.propImages[i];
			if (!img) {
				img = this.scene.add
					.image(0, 0, KEYS.deco(def.id, 0))
					.setOrigin(0.5, OBSTACLES.originY);
				this.propImages.push(img);
			}
			img.setTexture(KEYS.deco(def.id, p.variant));
			img.setScale(OBSTACLES.scaleByVariant[p.variant] ?? 1)
				.setPosition(Math.round(p.x), Math.round(p.y))
				.setDepth(p.y)
				.setVisible(true);
		});
		for (let i = props.length; i < this.propImages.length; i++)
			this.propImages[i]?.setVisible(false);
	}
}
