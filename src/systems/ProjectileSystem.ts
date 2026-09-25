import Phaser from 'phaser';
import { PLAY_AREA } from '../entities/Arena';
import { Projectile, type ProjectileConfig } from '../entities/Projectile';

const OUT_MARGIN = 24;

/** Pool of projectiles (one instance for the player, another for the enemies). */
export class ProjectileSystem {
	readonly group: Phaser.Physics.Arcade.Group;

	constructor(
		scene: Phaser.Scene,
		maxSize: number,
		private readonly depth: number,
	) {
		this.group = scene.physics.add.group({
			classType: Projectile,
			maxSize,
			runChildUpdate: false,
			allowGravity: false,
		});
	}

	/** Fires a pooled projectile; returns null if the pool is exhausted. */
	fire(config: ProjectileConfig): Projectile | null {
		const p = this.group.get(config.x, config.y, config.texture) as Projectile | null;
		if (!p) return null;
		p.fire(config).setDepth(this.depth);
		return p;
	}

	get activeCount(): number {
		return this.group.countActive(true);
	}

	forEachActive(fn: (p: Projectile) => void): void {
		for (const child of this.group.getChildren()) {
			const p = child as Projectile;
			if (p.active) fn(p);
		}
	}

	update(dt: number): void {
		this.forEachActive((p) => {
			if (p.homing > 0 && p.target?.active) {
				const body = p.arcadeBody;
				const desired = Math.atan2(p.target.y - p.y, p.target.x - p.x);
				const current = Math.atan2(body.velocity.y, body.velocity.x);
				const diff = Phaser.Math.Angle.Wrap(desired - current);
				const step = Phaser.Math.Clamp(diff, -p.homing * dt, p.homing * dt);
				const a = current + step;
				body.setVelocity(Math.cos(a) * p.speed, Math.sin(a) * p.speed);
				p.setRotation(a);
			} else if (p.spin !== 0) {
				p.angle += p.spin * dt;
			}
			p.traveled += p.speed * dt;
			if (
				p.traveled >= p.range ||
				p.x < PLAY_AREA.left - OUT_MARGIN ||
				p.x > PLAY_AREA.right + OUT_MARGIN ||
				p.y < PLAY_AREA.top - OUT_MARGIN ||
				p.y > PLAY_AREA.bottom + OUT_MARGIN
			) {
				p.release();
			}
		});
	}

	clear(): void {
		this.forEachActive((p) => p.release());
	}
}
