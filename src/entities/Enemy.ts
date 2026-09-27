import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import type { EnemyDef } from '../data/enemies';
import { ROUNDS } from '../data/rounds';
import { isoDepth, worldToScreen } from '../logic/iso';
import type { EliteTier } from '../logic/round';
import type { Mover } from '../logic/steering';

/** Pooled enemy: world state + its sprites. Flyers hover at a fake height (z). */
export class Enemy implements Mover {
	def!: EnemyDef;
	x = 0;
	y = 0;
	z = 0;
	radius = 10;
	speed = 0;
	hp = 0;
	maxHp = 0;
	damage = 0;
	elite: EliteTier | null = null;
	alive = false;
	hitFlash = 0;
	private readonly sprite: Phaser.GameObjects.Image;
	private readonly shadow: Phaser.GameObjects.Image;
	private readonly aura: Phaser.GameObjects.Image;

	constructor(scene: Phaser.Scene) {
		this.shadow = scene.add.image(0, 0, KEYS.shadow).setVisible(false);
		this.aura = scene.add.image(0, 0, KEYS.aura('purple')).setVisible(false);
		this.sprite = scene.add.image(0, 0, KEYS.shadow).setOrigin(0.5, 0.95).setVisible(false);
	}

	spawn(
		def: EnemyDef,
		x: number,
		y: number,
		hpMul: number,
		dmgMul: number,
		elite: EliteTier | null,
	): void {
		const e = elite ? ROUNDS.elite[elite] : null;
		const scale = e?.scale ?? 1;
		this.def = def;
		this.x = x;
		this.y = y;
		this.z = def.behavior === 'flyer' ? 18 : 0;
		this.radius = def.radius * scale;
		this.speed = def.speed;
		this.maxHp = def.hp * hpMul * (e?.hp ?? 1);
		this.hp = this.maxHp;
		this.damage = def.damage * dmgMul * (e?.damage ?? 1);
		this.elite = elite;
		this.alive = true;
		this.hitFlash = 0;
		this.sprite.setTexture(KEYS.enemy(def.id)).setScale(scale).setVisible(true).clearTint();
		this.sprite.setTintMode(Phaser.TintModes.MULTIPLY);
		this.shadow.setScale((this.radius * 2.4) / 32).setVisible(true);
		this.aura.setVisible(elite !== null);
		if (elite) this.aura.setTexture(KEYS.aura(elite)).setScale((this.radius * 3.2) / 64);
	}

	despawn(): void {
		this.alive = false;
		this.sprite.setVisible(false);
		this.shadow.setVisible(false);
		this.aura.setVisible(false);
	}

	sync(dt: number, facingLeft: boolean): void {
		const ground = worldToScreen(this.x, this.y);
		const depth = isoDepth(this.x, this.y);
		this.shadow.setPosition(ground.x, ground.y).setDepth(depth - 0.6);
		this.aura.setPosition(ground.x, ground.y).setDepth(depth - 0.5);
		this.sprite
			.setPosition(Math.round(ground.x), Math.round(ground.y - this.z))
			.setDepth(depth)
			.setFlipX(facingLeft);
		if (this.hitFlash > 0) {
			this.hitFlash -= dt;
			this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
			if (this.hitFlash <= 0) this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
		}
	}
}
