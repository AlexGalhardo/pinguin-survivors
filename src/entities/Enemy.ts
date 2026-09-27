import Phaser from 'phaser';
import { type AnimMeta, registerCharacterAnims } from '../art/anim-atlas';
import { KEYS } from '../art/manifest';
import { PALETTE } from '../config/palette';
import type { EnemyDef } from '../data/enemies';
import { ROUNDS } from '../data/rounds';
import type { Element } from '../logic/combat';
import { type AiState, newAi } from '../logic/enemy-ai';
import { spriteDir } from '../logic/hero-anim';
import { type Dir, dirFromWorld, isoDepth, worldToScreen } from '../logic/iso';
import type { EliteTier } from '../logic/round';
import { emptyStatus, resetStatus, type StatusState } from '../logic/status';
import type { Mover } from '../logic/steering';

const ELITE_BAR_W = 24;
const FLASH_TIME = 0.06;
const FLASH_COOLDOWN = 0.18;
const ANIM_FPS: Record<string, number> = { walk: 10, attack: 12 };
const ANIM_LOOPS = ['walk', 'attack'] as const;

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
	/** Time left before the next white hit flash may start. */
	private flashCooldown = 0;
	readonly status: StatusState = emptyStatus();
	/** What hit last, for kill attribution (achievement counters). */
	lastElement: Element | null = null;
	lastDot: 'bleed' | 'poison' | 'burn' | null = null;
	/** Accessibility: no white hit flash on enemies (set by the game scene from Settings). */
	static reducedFlashes = false;
	ai: AiState = newAi();
	/** World direction of an ongoing charge. */
	chargeX = 0;
	chargeY = 0;
	/** Red flash while winding up an attack (readable telegraph). */
	telegraph = false;
	private readonly sprite: Phaser.GameObjects.Sprite;
	/** PixelLab animation atlas of this enemy (enemy.<id>), null for the code placeholder. */
	private anims: Record<string, AnimMeta> | null = null;
	private baseScale = 1;
	private swayPhase = 0;
	private facing: Dir = 's';
	private lastX = 0;
	private lastY = 0;
	private readonly shadow: Phaser.GameObjects.Image;
	private readonly aura: Phaser.GameObjects.Image;
	/** Elite HP bar, created on the first elite spawn of this pooled slot. */
	private bar: { bg: Phaser.GameObjects.Rectangle; fill: Phaser.GameObjects.Rectangle } | null =
		null;

	constructor(private readonly scene: Phaser.Scene) {
		this.shadow = scene.add.image(0, 0, KEYS.shadow).setVisible(false);
		this.aura = scene.add.image(0, 0, KEYS.aura('purple')).setVisible(false);
		this.sprite = scene.add.sprite(0, 0, KEYS.shadow).setOrigin(0.5, 0.95).setVisible(false);
	}

	/**
	 * White hit flash, rate-limited: under constant fire (bosses, DoTs) a flash per hit kept the
	 * sprite white most of the time and hid the art.
	 */
	flash(): void {
		if (this.flashCooldown > 0) return;
		this.hitFlash = FLASH_TIME;
		this.flashCooldown = FLASH_COOLDOWN;
	}

	spawn(
		def: EnemyDef,
		x: number,
		y: number,
		hpMul: number,
		dmgMul: number,
		elite: EliteTier | null,
		speedMul = 1,
	): void {
		const e = elite ? ROUNDS.elite[elite] : null;
		const scale = e?.scale ?? 1;
		this.def = def;
		this.x = x;
		this.y = y;
		this.z = def.behavior === 'flyer' ? 18 : 0;
		this.radius = def.radius * scale;
		this.speed = def.speed * speedMul;
		this.maxHp = def.hp * hpMul * (e?.hp ?? 1);
		this.hp = this.maxHp;
		this.damage = def.damage * dmgMul * (e?.damage ?? 1);
		this.elite = elite;
		this.alive = true;
		this.hitFlash = 0;
		this.flashCooldown = 0;
		resetStatus(this.status);
		this.lastElement = null;
		this.ai = newAi(def);
		this.telegraph = false;
		this.lastDot = null;
		this.sprite.anims.stop();
		this.baseScale = scale;
		this.swayPhase = Math.random() * Math.PI * 2;
		this.sprite
			.setTexture(KEYS.enemy(def.id))
			.setScale(scale)
			.setAngle(0)
			.setVisible(true)
			.clearTint();
		this.anims = registerCharacterAnims(this.scene, KEYS.enemy(def.id), ANIM_FPS, ANIM_LOOPS);
		this.sprite.setOrigin(0.5, this.anims?.walk?.anchorY ?? 0.95);
		this.facing = 's';
		this.lastX = x;
		this.lastY = y;
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
		this.sprite.anims.stop();
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
			.setDepth(depth);
		if (this.anims) this.animate();
		else this.sprite.setFlipX(facingLeft);
		if (!this.hasWalkFrames()) this.sway(dt);
		if (this.bar && this.elite) this.syncBar(ground.x, ground.y - this.z, depth);
		if (this.telegraph && this.hitFlash <= 0) {
			// Reddish over the art (not a solid fill) so the telegraph never hides the sprite.
			const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 60);
			this.sprite
				.setTint(
					Phaser.Display.Color.GetColor(
						255,
						Math.round(90 + 90 * pulse),
						Math.round(90 + 90 * pulse),
					),
				)
				.setTintMode(Phaser.TintModes.MULTIPLY);
			this.sprite.setAlpha(1);
		} else if (!this.telegraph) {
			this.sprite.setAlpha(1);
			if (this.hitFlash <= 0) this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
		}
		this.flashCooldown -= dt;
		if (this.hitFlash > 0 && Enemy.reducedFlashes) this.hitFlash = 0;
		if (this.hitFlash > 0) {
			this.hitFlash -= dt;
			this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
			if (this.hitFlash <= 0) this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
		}
	}

	/** Faces the movement direction (5 drawn + 3 mirrored) and walks, or winds up an attack. */
	/** True when the art has a real multi-frame walk (else the sprite is a still image). */
	private hasWalkFrames(): boolean {
		return (this.anims?.walk?.frames ?? 0) > 1;
	}

	/**
	 * Procedural gait for still images (placeholder or rotation-only art, e.g. a boss before its
	 * walk is drawn): a waddle tilt and a squash-and-stretch step, so it never glides rigidly.
	 */
	private sway(dt: number): void {
		this.swayPhase += dt * (this.def.behavior === 'boss' ? 5 : 9);
		const step = Math.sin(this.swayPhase);
		const squash = 0.05 * Math.abs(Math.sin(this.swayPhase));
		this.sprite
			.setAngle(step * (this.def.behavior === 'flyer' ? 3 : 6))
			.setScale(this.baseScale * (1 + squash), this.baseScale * (1 - squash));
	}

	private animate(): void {
		const dx = this.x - this.lastX;
		const dy = this.y - this.lastY;
		this.lastX = this.x;
		this.lastY = this.y;
		if (dx * dx + dy * dy > 0.01) this.facing = dirFromWorld(dx, dy, this.facing);
		const name = this.telegraph && this.anims?.attack ? 'attack' : 'walk';
		const meta = this.anims?.[name];
		if (!meta) return;
		const { dir, flip } = spriteDir(this.facing);
		const d = meta.dirs.includes(dir) ? dir : 's';
		this.sprite.setFlipX(flip && d === dir);
		this.sprite.play(`${KEYS.enemy(this.def.id)}.${name}.${d}`, true);
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
