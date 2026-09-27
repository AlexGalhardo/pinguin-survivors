import type Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { SECONDARIES, type SecondaryId } from '../data/secondaries';
import { isoDepth, worldToScreen } from '../logic/iso';
import type { SpatialGrid } from '../logic/spatial-grid';
import { screenAngle } from '../logic/weapon-anim';
import type { Enemy } from './Enemy';

/** Hand height above the feet, in screen px (same as the signature WeaponView). */
const HAND_Z = 18;
/**
 * Screen offsets of the 3 secondary weapon slots around the hero (the signature weapon keeps
 * its hand): left, top-left and top-right — 4 weapons at most, like Brotato (P-67).
 */
const SLOTS = [
	{ x: -46, y: 4 },
	{ x: -40, y: -34 },
	{ x: 42, y: -34 },
] as const;
/** Secondary sprites are small; a bit bigger reads better floating around the hero. */
const SCALE = 1.4;
const TURN_SPEED = 10;

interface Slot {
	id: SecondaryId;
	sprite: Phaser.GameObjects.Image;
	angle: number;
}

/**
 * Secondary weapons floating around the hero, each turning towards the nearest enemy in its
 * range (they fire through SecondarySystem; this is only their visual presence).
 */
export class WeaponRing {
	private readonly slots: Slot[] = [];
	private bob = 0;

	constructor(private readonly scene: Phaser.Scene) {}

	update(
		dt: number,
		owned: readonly SecondaryId[],
		hx: number,
		hy: number,
		grid: SpatialGrid<Enemy>,
	): void {
		this.sync(owned.slice(0, SLOTS.length));
		this.bob += dt * 3;
		const hand = worldToScreen(hx, hy, HAND_Z);
		const depth = isoDepth(hx, hy);
		this.slots.forEach((s, i) => {
			const off = SLOTS[i] as (typeof SLOTS)[number];
			const def = SECONDARIES[s.id];
			const target = grid.nearest(hx, hy, def.range, (e) => e.alive);
			const want = target
				? screenAngle(Math.atan2(target.y - hy, target.x - hx))
				: off.x < 0
					? Math.PI
					: 0;
			// Shortest turn towards the target angle.
			let d = want - s.angle;
			d = Math.atan2(Math.sin(d), Math.cos(d));
			s.angle += d * Math.min(1, TURN_SPEED * dt);
			const left = Math.cos(s.angle) < 0;
			s.sprite
				.setPosition(
					Math.round(hand.x + off.x),
					Math.round(hand.y + off.y + Math.sin(this.bob + i) * 1.5),
				)
				.setRotation(s.angle)
				.setFlipY(left)
				.setDepth(depth + 0.4);
		});
	}

	/** Creates/removes sprites so they match the owned secondaries (in pick order). */
	private sync(owned: readonly SecondaryId[]): void {
		for (let i = this.slots.length - 1; i >= 0; i--) {
			const s = this.slots[i] as Slot;
			if (owned[i] !== s.id) {
				s.sprite.destroy();
				this.slots.splice(i, 1);
			}
		}
		for (let i = this.slots.length; i < owned.length; i++) {
			const id = owned[i] as SecondaryId;
			const sprite = this.scene.add
				.image(0, 0, KEYS.weapon(id))
				.setOrigin(0.3, 0.5)
				.setScale(SCALE);
			this.slots.push({ id, sprite, angle: 0 });
		}
	}
}
