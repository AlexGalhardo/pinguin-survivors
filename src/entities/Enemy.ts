import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { PALETTE } from '../config/palette';
import type { EnemyDef } from '../data/enemies';
import { ROUNDS } from '../data/rounds';
import type { Element } from '../logic/combat';
import { type AiState, newAi } from '../logic/enemy-ai';
import { isoDepth, worldToScreen } from '../logic/iso';
import type { EliteTier } from '../logic/round';
import { emptyStatus, resetStatus, type StatusState } from '../logic/status';
import type { Mover } from '../logic/steering';

const ELITE_BAR_W = 24;

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
	readonly status: StatusState = emptyStatus();
	/** What hit last, for kill attribution (achievement counters). */
	lastElement: Element | null = null;
	lastDot: 'bleed' | 'poison' | 'burn' | null = null;
	ai: AiState = newAi();
	/** World direction of an ongoing charge. */
	chargeX = 0;
	chargeY = 0;
	/** Red flash while winding up an attack (readable telegraph). */
	telegraph = false;
	private readonly sprite: Phaser.GameObjects.Image;
	private readonly shadow: Phaser.GameObjects.Image;
	private readonly aura: Phaser.GameObjects.Image;
	/** Elite HP bar, created on the first elite spawn of this pooled slot. */
	private bar: { bg: Phaser.GameObjects.Rectangle; fill: Phaser.GameObjects.Rectangle } | null =
		null;

	constructor(private readonly scene: Phaser.Scene) {
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
		resetStatus(this.status);
		this.lastElement = null;
		this.ai = newAi(def);
		this.telegraph = false;
		this.lastDot = null;
		this.sprite.setTexture(KEYS.enemy(def.id)).setScale(scale).setVisible(true).clearTint();
		this.sprite.setTintMode(Phaser.TintModes.MULTIPLY);
		this.shadow.setScale((this.radius * 2.4) / 32).setVisible(true);
		this.aura.setVisible(elite !== null);
		if (elite) this.aura.setTexture(KEYS.aura(elite)).setScale((this.radius * 3.2) / 64);
		if (elite && !this.bar) {
			this.bar = {
				bg: this.scene.add
					.rectangle(0, 0, ELITE_BAR_W + 2, 4, PALETTE.night)
					.setOrigin(0.5),
				fill: this.scene.add
					.rectangle(0, 0, ELITE_BAR_W, 2, PALETTE.blood)
					.setOrigin(0, 0.5),
			};
		}
		this.bar?.bg.setVisible(false);
		this.bar?.fill.setVisible(false);
	}

	despawn(): void {
		this.alive = false;
		this.sprite.setVisible(false);
		this.shadow.setVisible(false);
		this.aura.setVisible(false);
		this.bar?.bg.setVisible(false);
		this.bar?.fill.setVisible(false);
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
		if (this.bar && this.elite) this.syncBar(ground.x, ground.y - this.z, depth);
		if (this.telegraph && this.hitFlash <= 0) {
			this.sprite.setTint(0xff3030).setTintMode(Phaser.TintModes.FILL);
			this.sprite.setAlpha(0.6 + 0.4 * Math.sin(performance.now() / 40));
		} else if (!this.telegraph) {
			this.sprite.setAlpha(1);
			if (this.hitFlash <= 0) this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
		}
		if (this.hitFlash > 0) {
			this.hitFlash -= dt;
			this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
			if (this.hitFlash <= 0) this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
		}
	}

	/** Shown only once the elite has taken damage, above its head. */
	private syncBar(x: number, y: number, depth: number): void {
		const bar = this.bar;
		if (!bar) return;
		const ratio = Math.max(0, this.hp / this.maxHp);
		const show = ratio < 1;
		bar.bg.setVisible(show);
		bar.fill.setVisible(show);
		if (!show) return;
		const top = Math.round(y - this.sprite.displayHeight - 4);
		const left = Math.round(x - ELITE_BAR_W / 2);
		bar.bg.setPosition(Math.round(x), top).setDepth(depth + 0.1);
		bar.fill
			.setPosition(left, top)
			.setDisplaySize(Math.max(1, ELITE_BAR_W * ratio), 2)
			.setFillStyle(this.elite === 'orange' ? PALETTE.auraOrange : PALETTE.auraPurple)
			.setDepth(depth + 0.2);
	}
}
