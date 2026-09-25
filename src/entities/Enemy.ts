import Phaser from 'phaser';
import type { EnemyDef } from '../data/enemies';

export interface EnemyScaling {
	hp: number;
	dmg: number;
	spd: number;
}

export type EliteMod = 'fast' | 'shielded' | 'volatile';

/** Pooled enemy (Arcade sprite). Activated with spawn(), released with release(). */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
	def!: EnemyDef;
	hp = 0;
	maxHp = 0;
	shield = 0;
	damage = 0;
	speed = 0;
	radius = 0;
	gold = 0;
	elite: EliteMod | null = null;
	/** Seconds until the next contact hit is allowed. */
	contactCooldown = 0;
	/** Seconds until the next ranged attack. */
	fireCooldown = 0;
	/** Slow factor 0..1 (1 = stopped) applied by Cryo Field; reset every frame by the system. */
	slow = 0;
	knockX = 0;
	knockY = 0;
	/** Seconds left of the white hit flash. */
	flashTime = 0;
	/** Free-form AI timers (boss patterns). */
	aiTimer = 0;
	aiTimer2 = 0;
	aiState = 0;

	get arcadeBody(): Phaser.Physics.Arcade.Body {
		return this.body as Phaser.Physics.Arcade.Body;
	}

	spawn(def: EnemyDef, x: number, y: number, mul: EnemyScaling, sizeMul = 1): this {
		this.def = def;
		this.setTexture(def.texture);
		this.enableBody(true, x, y, true, true);
		this.setActive(true).setVisible(true).setAlpha(1).setAngle(0).clearTint();
		this.setScale(sizeMul);
		this.radius = def.radius * sizeMul;
		// The body is defined in unscaled texture space: Arcade multiplies it by the sprite scale.
		this.setCircle(def.radius, this.width / 2 - def.radius, this.height / 2 - def.radius);
		this.setCollideWorldBounds(true);
		this.maxHp = Math.max(1, Math.round(def.hp * mul.hp));
		this.hp = this.maxHp;
		this.shield = 0;
		this.damage = def.damage * mul.dmg;
		this.speed = def.speed * mul.spd;
		this.gold = def.gold;
		this.elite = null;
		this.contactCooldown = 0;
		this.fireCooldown = def.ranged ? def.ranged.cooldown * (0.5 + Math.random() * 0.5) : 0;
		this.slow = 0;
		this.knockX = 0;
		this.knockY = 0;
		this.flashTime = 0;
		this.aiTimer = 0;
		this.aiTimer2 = 0;
		this.aiState = 0;
		this.setDepth(5);
		return this;
	}

	/** Returns the enemy to the pool. */
	release(): void {
		this.disableBody(true, true);
	}

	/** Adds a knockback impulse (px/s), scaled by the type's resistance. */
	knockback(dirX: number, dirY: number, force: number): void {
		const f = force * this.def.knockbackTaken;
		this.knockX += dirX * f;
		this.knockY += dirY * f;
	}
}
