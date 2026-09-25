import Phaser from 'phaser';

export interface ProjectileConfig {
	texture: string;
	x: number;
	y: number;
	/** Direction (normalized) and speed in px/s. */
	dirX: number;
	dirY: number;
	speed: number;
	damage: number;
	/** Max travel distance in px before expiring. */
	range: number;
	/** Extra enemies it can pass through (0 = stops on first hit). */
	pierce?: number;
	radius?: number;
	crit?: boolean;
	/** Homing turn rate (rad/s); 0 = straight. */
	homing?: number;
	/** Source tag for statistics/effects (weapon or ability id). */
	source?: string;
	/** Spin in degrees per second (visual only). */
	spin?: number;
}

/** Pooled projectile for both the player and the enemies. */
export class Projectile extends Phaser.Physics.Arcade.Image {
	damage = 0;
	pierceLeft = 0;
	traveled = 0;
	range = 0;
	speed = 0;
	crit = false;
	homing = 0;
	spin = 0;
	source = '';
	/** Enemies already hit (so piercing shots hit each enemy once). */
	readonly hitSet = new Set<object>();
	/** Current homing target, if any. */
	target: { x: number; y: number; active: boolean } | null = null;

	get arcadeBody(): Phaser.Physics.Arcade.Body {
		return this.body as Phaser.Physics.Arcade.Body;
	}

	fire(c: ProjectileConfig): this {
		this.setTexture(c.texture);
		this.enableBody(true, c.x, c.y, true, true);
		this.setActive(true).setVisible(true).setAlpha(1).setScale(1);
		const r = c.radius ?? Math.min(this.width, this.height) / 2;
		this.setCircle(r, this.width / 2 - r, this.height / 2 - r);
		this.damage = c.damage;
		this.pierceLeft = c.pierce ?? 0;
		this.traveled = 0;
		this.range = c.range;
		this.speed = c.speed;
		this.crit = c.crit ?? false;
		this.homing = c.homing ?? 0;
		this.spin = c.spin ?? 0;
		this.source = c.source ?? '';
		this.target = null;
		this.hitSet.clear();
		this.arcadeBody.setVelocity(c.dirX * c.speed, c.dirY * c.speed);
		this.setRotation(Math.atan2(c.dirY, c.dirX));
		return this;
	}

	release(): void {
		this.disableBody(true, true);
		this.target = null;
	}
}
