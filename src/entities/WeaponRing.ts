import type Phaser from 'phaser';
import type { WeaponInstance } from '../logic/build';
import type { SpatialGrid } from '../logic/spatial-grid';
import { resolveWeapon, ringAngle } from '../logic/weapons';
import { pickTarget } from '../systems/targeting';
import type { Enemy } from './Enemy';
import { WeaponView } from './WeaponView';

/** Ring radius around the hero in world units, and its slow rotation in rad/s (SDD-002 RF-08). */
const RING_RADIUS = 26;
const RING_SPEED = 0.6;

/**
 * Up to 6 weapon sprites in an evenly spaced ring around the hero. Each one turns towards the
 * nearest enemy in its range (bosses and elites first) and animates when its weapon fires.
 */
export class WeaponRing {
	private readonly views: WeaponView[] = [];
	private time = 0;

	constructor(private readonly scene: Phaser.Scene) {}

	/** Called when the weapon in `slot` attacks (world angle towards the target). */
	fire(slot: number, angle: number, cooldown: number): void {
		this.views[slot]?.fire(angle, cooldown);
	}

	update(
		dt: number,
		slots: readonly WeaponInstance[],
		hx: number,
		hy: number,
		grid: SpatialGrid<Enemy>,
	): void {
		this.sync(slots);
		this.time += dt;
		const n = slots.length;
		this.views.forEach((view, i) => {
			const w = resolveWeapon(slots[i] as WeaponInstance);
			const a = ringAngle(i, n, this.time, RING_SPEED);
			const x = hx + Math.cos(a) * RING_RADIUS;
			const y = hy + Math.sin(a) * RING_RADIUS;
			const target = pickTarget(grid, hx, hy, w.range);
			view.turn(target ? Math.atan2(target.y - y, target.x - x) : a, dt);
			view.update(dt, x, y);
		});
	}

	/** Creates/removes sprites so they match the slots; a changed slot is re-skinned. */
	private sync(slots: readonly WeaponInstance[]): void {
		while (this.views.length > slots.length) this.views.pop()?.destroy();
		slots.forEach((s, i) => {
			let view = this.views[i];
			if (!view) {
				view = new WeaponView(this.scene);
				this.views.push(view);
			}
			if (view.id !== s.id || view.tier !== s.tier) view.setWeapon(resolveWeapon(s));
		});
	}

	destroy(): void {
		for (const v of this.views) v.destroy();
		this.views.length = 0;
	}
}
