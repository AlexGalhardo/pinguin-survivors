import Phaser from 'phaser';
import { ELITE, type EnemyDef } from '../data/enemies';

export interface EnemyScaling {
	hp: number;
	dmg: number;
	spd: number;
}

export type EliteMod = 'fast' | 'shielded' | 'volatile';

/** Tint of enemies infected by nanites (Endesga green). */
const INFECTED_TINT = 0x63c74d;

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
	/** Per-frame pull velocity (gravity well); reset every frame by the system. */
	pullX = 0;
	pullY = 0;
	/** Damage over time (nanites): damage per second and seconds left. */
	dotDps = 0;
	dotTime = 0;
	dotTick = 0;
	/** Seconds left of the white hit flash. */
	flashTime = 0;
	/** Free-form AI timers (boss patterns). */
	aiTimer = 0;
	aiTimer2 = 0;
	aiState = 0;
	/** Tint restored after the hit flash (elites are tinted by modifier). */
	baseTint: number | null = null;
	/** Burrower underground: untargetable and harmless. */
	burrowed = false;
	/** Locked charge direction (boss). */
	chargeX = 0;
	chargeY = 0;

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
		this.pullX = 0;
		this.pullY = 0;
		this.dotDps = 0;
		this.dotTime = 0;
		this.dotTick = 0;
		this.flashTime = 0;
		this.aiTimer = 0;
		this.aiTimer2 = 0;
		this.aiState = 0;
		this.baseTint = null;
		this.burrowed = false;
		this.setDepth(def.isBoss ? 6 : 5);
		return this;
	}

	/** Turns this enemy into an elite with a modifier (balancing §2). */
	makeElite(mod: EliteMod, tint: number): void {
		this.elite = mod;
		this.maxHp = Math.round(this.maxHp * ELITE.hp);
		this.hp = this.maxHp;
		this.damage *= ELITE.damage;
		this.speed *= ELITE.speed * (mod === 'fast' ? ELITE.fastSpeed : 1);
		this.gold = ELITE.gold;
		this.shield = mod === 'shielded' ? Math.round(this.maxHp * ELITE.shieldPct) : 0;
		this.setScale(ELITE.size);
		this.radius = this.def.radius * ELITE.size;
		this.baseTint = tint;
		this.restoreTint();
	}

	/** Starts a damage-over-time effect (nanites). */
	infect(dps: number, seconds: number): void {
		this.dotDps = Math.max(this.dotDps, dps);
		this.dotTime = Math.max(this.dotTime, seconds);
		this.restoreTint();
	}

	restoreTint(): void {
		this.setTintMode(Phaser.TintModes.MULTIPLY);
		if (this.dotTime > 0) this.setTint(INFECTED_TINT);
		else if (this.baseTint === null) this.clearTint();
		else this.setTint(this.baseTint);
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
