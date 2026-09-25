import Phaser from 'phaser';
import { anyDown, type MoveKeys } from '../core/input';
import type { CharacterDef } from '../data/characters';
import { moveVector } from '../logic/movement';

/** Collision circle of the player (the feet area of the 32x32 sprite). */
const BODY_RADIUS = 7;

export class Player extends Phaser.Physics.Arcade.Sprite {
	/** Last non-zero facing direction (used by aim fallbacks and the sprite flip). */
	readonly facing = new Phaser.Math.Vector2(1, 0);
	speed = 0;
	/** Seconds of invulnerability left (after a hit or a revive). */
	invuln = 0;
	private hurtFlash = 0;

	constructor(
		scene: Phaser.Scene,
		x: number,
		y: number,
		readonly def: CharacterDef,
	) {
		super(scene, x, y, def.texture);
		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.setCircle(BODY_RADIUS, 16 - BODY_RADIUS, 20 - BODY_RADIUS);
		this.setCollideWorldBounds(true);
		this.setDepth(10);
	}

	get arcadeBody(): Phaser.Physics.Arcade.Body {
		return this.body as Phaser.Physics.Arcade.Body;
	}

	/** Starts the post-hit invulnerability and a short red flash. */
	hurt(invulnSeconds: number): void {
		this.invuln = Math.max(this.invuln, invulnSeconds);
		this.hurtFlash = 0.1;
		this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
	}

	/** Visual timers: hit flash and blinking while invulnerable. */
	tick(dt: number): void {
		if (this.hurtFlash > 0) {
			this.hurtFlash -= dt;
			if (this.hurtFlash <= 0) this.setTintMode(Phaser.TintModes.MULTIPLY).clearTint();
		}
		if (this.invuln > 0) {
			this.invuln -= dt;
			this.setAlpha(this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0 ? 0.4 : 1);
		}
	}

	/** Reads WASD/arrows and sets the velocity (normalized, so diagonals are not faster). */
	handleInput(keys: MoveKeys): void {
		const dir = moveVector(
			anyDown(keys.up),
			anyDown(keys.down),
			anyDown(keys.left),
			anyDown(keys.right),
		);
		this.arcadeBody.setVelocity(dir.x * this.speed, dir.y * this.speed);
		if (dir.x !== 0 || dir.y !== 0) {
			this.facing.set(dir.x, dir.y);
			if (dir.x !== 0) this.setFlipX(dir.x < 0);
		}
	}
}
