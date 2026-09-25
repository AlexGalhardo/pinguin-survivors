import Phaser from 'phaser';
import { TEX } from '../art/manifest';
import { ARENA_H, ARENA_W, MAX_ENEMIES_ALIVE } from '../config/constants';
import { ENEMIES, type EnemyDef, STEERING } from '../data/enemies';
import { GRID_TARGET_THRESHOLD } from '../data/weapons';
import { Enemy, type EnemyScaling } from '../entities/Enemy';
import { nearestLinear, SpatialGrid } from '../logic/spatial-grid';
import type { ProjectileSystem } from './ProjectileSystem';

/** Grid cell size used for separation and targeting. */
const GRID_CELL = 64;
/** Largest enemy radius, used to size the separation query. */
const MAX_RADIUS = ENEMIES.boss.radius;
const FLASH_TIME = 0.08;

/**
 * Owns the enemy pool and runs their steering every frame:
 * AI intent (seek / keep distance) + separation between enemies + knockback.
 */
export class EnemySystem {
	readonly group: Phaser.Physics.Arcade.Group;
	readonly grid = new SpatialGrid<Enemy>(GRID_CELL, ARENA_W, ARENA_H);
	private readonly neighbors: Enemy[] = [];
	/** Custom AI hook for special enemies (boss). Returns true when it handled the enemy. */
	customAi?: (e: Enemy, dt: number) => boolean;

	constructor(
		scene: Phaser.Scene,
		private readonly target: { x: number; y: number },
		private readonly enemyShots: ProjectileSystem,
	) {
		this.group = scene.physics.add.group({
			classType: Enemy,
			// +16 so bosses/elites always fit even when the regular cap is reached.
			maxSize: MAX_ENEMIES_ALIVE + 16,
			runChildUpdate: false,
			allowGravity: false,
		});
	}

	get aliveCount(): number {
		return this.group.countActive(true);
	}

	spawn(def: EnemyDef, x: number, y: number, mul: EnemyScaling, sizeMul = 1): Enemy | null {
		const e = this.group.get(x, y, def.texture) as Enemy | null;
		if (!e) return null;
		return e.spawn(def, x, y, mul, sizeMul);
	}

	forEachActive(fn: (e: Enemy) => void): void {
		for (const child of this.group.getChildren()) {
			const e = child as Enemy;
			if (e.active) fn(e);
		}
	}

	private readonly activeList: Enemy[] = [];
	private readonly query: Enemy[] = [];

	/** Nearest active enemy within `radius` (grid search above 150 enemies, linear below). */
	nearest(
		x: number,
		y: number,
		radius: number,
		accept?: (e: Enemy) => boolean,
	): Enemy | undefined {
		if (this.activeList.length > GRID_TARGET_THRESHOLD) {
			return this.grid.nearest(x, y, radius, (e) => e.active && (!accept || accept(e)));
		}
		return nearestLinear(
			this.activeList,
			x,
			y,
			radius,
			(e) => e.active && (!accept || accept(e)),
		);
	}

	/** Calls fn for every active enemy whose center is within `radius` (+ its own radius). */
	forEachInRadius(x: number, y: number, radius: number, fn: (e: Enemy) => void): void {
		this.query.length = 0;
		this.grid.queryRadius(x, y, radius + MAX_RADIUS, this.query);
		for (const e of this.query) {
			if (!e.active) continue;
			if (Math.hypot(e.x - x, e.y - y) <= radius + e.radius) fn(e);
		}
	}

	/** Snapshot of active enemies (rebuilt with the grid). */
	get active(): readonly Enemy[] {
		return this.activeList;
	}

	/** Rebuilds the grid; call once per frame before any query. */
	rebuildGrid(): void {
		this.grid.clear();
		this.activeList.length = 0;
		this.forEachActive((e) => {
			this.grid.insert(e);
			this.activeList.push(e);
		});
	}

	update(dt: number): void {
		const px = this.target.x;
		const py = this.target.y;
		const decay = Math.exp(-STEERING.knockbackDecay * dt);
		this.forEachActive((e) => {
			if (e.contactCooldown > 0) e.contactCooldown -= dt;
			if (e.flashTime > 0) {
				e.flashTime -= dt;
				if (e.flashTime <= 0) e.restoreTint();
			}
			if (this.customAi?.(e, dt)) {
				e.slow = 0;
				return;
			}
			const dx = px - e.x;
			const dy = py - e.y;
			const dist = Math.hypot(dx, dy) || 1;
			let dirX = dx / dist;
			let dirY = dy / dist;

			if (e.def.ai === 'keepDistance' && e.def.ranged) {
				const keep = e.def.ranged.keepDistance;
				if (Math.abs(dist - keep) < STEERING.keepBand) {
					dirX = 0;
					dirY = 0;
				} else if (dist < keep) {
					dirX = -dirX;
					dirY = -dirY;
				}
				e.fireCooldown -= dt;
				if (e.fireCooldown <= 0 && dist < keep * 1.8) {
					e.fireCooldown = e.def.ranged.cooldown;
					this.enemyShots.fire({
						texture: TEX.projEnemy,
						x: e.x,
						y: e.y,
						dirX: dx / dist,
						dirY: dy / dist,
						speed: e.def.ranged.projectileSpeed,
						damage: e.def.ranged.damage * (e.damage / e.def.damage),
						range: 600,
						radius: 3,
					});
				}
			}

			const speed = e.speed * (1 - Math.min(0.9, e.slow));
			e.slow = 0;
			let vx = dirX * speed;
			let vy = dirY * speed;

			// Separation: push away from overlapping neighbors.
			this.neighbors.length = 0;
			this.grid.queryRadius(e.x, e.y, e.radius + MAX_RADIUS, this.neighbors);
			for (const n of this.neighbors) {
				if (n === e) continue;
				const ox = e.x - n.x;
				const oy = e.y - n.y;
				const d = Math.hypot(ox, oy) || 0.01;
				const overlap = e.radius + n.radius - d;
				if (overlap > 0) {
					vx += (ox / d) * overlap * STEERING.separation;
					vy += (oy / d) * overlap * STEERING.separation;
				}
			}

			vx += e.knockX;
			vy += e.knockY;
			e.knockX *= decay;
			e.knockY *= decay;
			e.arcadeBody.setVelocity(vx, vy);
			if (Math.abs(dx) > 2) e.setFlipX(dx < 0);
		});
	}

	/** White hit flash. */
	flash(e: Enemy): void {
		e.flashTime = FLASH_TIME;
		e.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
	}

	clear(): void {
		this.forEachActive((e) => e.release());
	}
}
