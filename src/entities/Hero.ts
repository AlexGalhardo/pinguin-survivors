import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import type { HeroId } from '../config/constants';
import { type Dir, dirFromWorld, isoDepth, type Vec2, worldToScreen } from '../logic/iso';

/** Hero view over a world-space position; simulation stays in world units (P-35). */
export class Hero {
	x = 0;
	y = 0;
	facing: Dir = 's';
	readonly sprite: Phaser.GameObjects.Image;
	private readonly shadow: Phaser.GameObjects.Image;

	constructor(
		scene: Phaser.Scene,
		readonly id: HeroId,
		private tier: 1 | 2 | 3,
		private readonly stats: { moveSpeed: number },
	) {
		this.shadow = scene.add.image(0, 0, KEYS.shadow).setOrigin(0.5, 0.5);
		this.sprite = scene.add.image(0, 0, KEYS.heroFacing(id, tier, 's')).setOrigin(0.5, 0.95);
		this.sync();
	}

	private flashTime = 0;

	setTier(tier: 1 | 2 | 3): void {
		this.tier = tier;
	}

	flash(): void {
		this.flashTime = 0.12;
		this.sprite.setTint(0xff4040).setTintMode(Phaser.TintModes.FILL);
	}

	/** `move` is a unit world vector (or zero). */
	update(dt: number, move: Vec2): void {
		this.x += move.x * this.stats.moveSpeed * dt;
		this.y += move.y * this.stats.moveSpeed * dt;
		this.facing = dirFromWorld(move.x, move.y, this.facing);
		this.sprite.setTexture(KEYS.heroFacing(this.id, this.tier, this.facing));
		if (this.flashTime > 0) {
			this.flashTime -= dt;
			if (this.flashTime <= 0) this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
		}
		this.sync();
	}

	private sync(): void {
		const s = worldToScreen(this.x, this.y);
		const depth = isoDepth(this.x, this.y);
		this.shadow.setPosition(s.x, s.y).setDepth(depth - 0.5);
		this.sprite.setPosition(s.x, s.y).setDepth(depth);
	}
}
