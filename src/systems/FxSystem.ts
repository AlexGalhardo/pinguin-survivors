import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { PALETTE, toCss } from '../config/palette';
import { sfx } from '../core/audio';
import { activeBudget } from '../core/tier';
import { ARENA } from '../data/arena';
import { COMBAT_FX } from '../data/combat-fx';
import type { SfxKey } from '../data/sfx';
import { type I18nKey, t } from '../i18n';
import { scaleParticles } from '../logic/performance';
import { depthOf, worldToScreen } from '../logic/projection';
import type { NumberSize, Settings } from '../logic/save';
import { UI_FONT } from '../ui/font';
import type { Arena } from '../world/Arena';

const MAX_NUMBERS = 80;
const NUMBER_SCALE: Record<NumberSize, number> = { small: 0.8, normal: 1, large: 1.5 };
const MAX_GIBS = 160;
const GRAVITY = 420;
const NUMBER_LIFE = 0.7;
const SLASH_LIFE = 0.12;
/** Damage numbers are always drawn over the world. */
const OVERLAY_DEPTH = 1e9;

interface Gib {
	img: Phaser.GameObjects.Image;
	shadow: Phaser.GameObjects.Image;
	x: number;
	y: number;
	z: number;
	vx: number;
	vy: number;
	vz: number;
	spin: number;
	alive: boolean;
}

interface FloatingNumber {
	text: Phaser.GameObjects.Text;
	life: number;
	/** Seconds since it appeared (drives the crit pop and shake). */
	age: number;
	/** Screen position without the shake. */
	x: number;
	y: number;
	crit: boolean;
	/** Reflected damage flies from the hero to the attacker, then fades like any number. */
	fly: { x0: number; y0: number; x1: number; y1: number } | null;
}

/**
 * Juice and gore (P-10): damage numbers, blood that stays on the ground for the whole run
 * (stamped into the arena texture), blood spurts, gibs flying in an arc, melee slashes.
 */
export class FxSystem {
	private readonly numbers: FloatingNumber[] = [];
	private readonly gibs: Gib[] = [];
	private readonly spurt: Phaser.GameObjects.Particles.ParticleEmitter;
	private readonly sparks: Phaser.GameObjects.Particles.ParticleEmitter;
	/** Gibs thrown this run (achievement counter). */
	gibCount = 0;
	private readonly marks: { img: Phaser.GameObjects.Image; life: number }[] = [];
	private readonly slashes: { img: Phaser.GameObjects.Image; life: number }[] = [];

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly settings: Settings,
		private readonly arena: Arena,
	) {
		this.spurt = scene.add
			.particles(0, 0, KEYS.droplet, {
				speed: { min: 40, max: 140 },
				angle: { min: 200, max: 340 },
				gravityY: 320,
				lifespan: { min: 250, max: 520 },
				scale: { start: 1.2, end: 0.4 },
				emitting: false,
			})
			.setDepth(OVERLAY_DEPTH - 1);
		// Hit and parry sparks: small, fast, additive.
		this.sparks = scene.add
			.particles(0, 0, KEYS.droplet, {
				speed: { min: 90, max: 220 },
				angle: { min: 0, max: 360 },
				lifespan: { min: 140, max: 320 },
				scale: { start: 3.5, end: 0 },
				blendMode: Phaser.BlendModes.ADD,
				emitting: false,
			})
			.setDepth(OVERLAY_DEPTH - 1);
	}

	/** Sound effect with the Settings volumes and polyphony limits. */
	play(key: SfxKey, volume = 1): void {
		sfx(this.scene, key, volume);
	}

	private get splatKind(): 'blood' | 'goo' {
		return this.settings.gore === 'goo' ? 'goo' : 'blood';
	}

	/** Spray of droplets on a hit. */
	spray(x: number, y: number, count: number): void {
		if (this.settings.gore === 'reduced') count = Math.ceil(count / 3);
		const s = worldToScreen(x, y, 14);
		this.spurt.setParticleTint(this.splatKind === 'goo' ? PALETTE.goo : PALETTE.blood);
		this.spurt.explode(scaleParticles(count, activeBudget().particleScale), s.x, s.y);
	}

	/** Chunks of the enemy fly out and leave a stain where they land. */
	burst(x: number, y: number, count: number): void {
		if (this.settings.gore === 'reduced') return;
		const gibs = scaleParticles(count, activeBudget().particleScale);
		for (let i = 0; i < gibs; i++) {
			let g = this.gibs.find((q) => !q.alive);
			if (!g) {
				if (this.gibs.length >= MAX_GIBS) return;
				g = {
					img: this.scene.add.image(0, 0, KEYS.gib(0)),
					shadow: this.scene.add.image(0, 0, KEYS.shadow).setScale(0.25),
					x: 0,
					y: 0,
					z: 0,
					vx: 0,
					vy: 0,
					vz: 0,
					spin: 0,
					alive: false,
				};
				this.gibs.push(g);
			}
			const a = Math.random() * Math.PI * 2;
			const speed = 40 + Math.random() * 90;
			Object.assign(g, {
				x,
				y,
				z: 10,
				vx: Math.cos(a) * speed,
				vy: Math.sin(a) * speed,
				vz: 90 + Math.random() * 140,
				spin: (Math.random() - 0.5) * 20,
				alive: true,
			});
			g.img.setTexture(KEYS.gib(i % 4)).setVisible(true);
			if (this.settings.gore === 'goo')
				g.img.setTint(PALETTE.goo).setTintMode(Phaser.TintModes.FILL);
			else g.img.clearTint();
			g.shadow.setVisible(true);
			this.gibCount++;
		}
	}

	private freeNumber(): FloatingNumber | null {
		let n = this.numbers.find((f) => f.life <= 0);
		if (!n) {
			if (this.numbers.length >= MAX_NUMBERS) return null;
			const text = this.scene.add
				.text(0, 0, '', {
					fontFamily: UI_FONT,
					fontSize: '13px',
					fontStyle: 'bold',
					stroke: toCss(PALETTE.night),
					strokeThickness: 2,
					align: 'center',
				})
				.setOrigin(0.5)
				.setDepth(OVERLAY_DEPTH);
			n = { text, life: 0, age: 0, x: 0, y: 0, crit: false, fly: null };
			this.numbers.push(n);
		}
		return n;
	}

	/** `color` is the weapon's color; a crit adds the "CRIT!" word, a pop, a shake and sparks (tier-capped). */
	damage(x: number, y: number, amount: number, crit: boolean, color?: number): void {
		// Labels/banners call this with amount 0 and must still show.
		if (!this.settings.damageNumbers && amount > 0) return;
		// Tiny DoT ticks (fractions of a point) used to show as a stream of "0".
		if (amount > 0 && amount < 1) return;
		const n = this.freeNumber();
		if (!n) return;
		const s = worldToScreen(x, y, 24);
		const scale = NUMBER_SCALE[this.settings.numberSize];
		// Past the tier's label cap a crit is still a bigger gold number, just without the word and pop.
		const label = crit && amount > 0 && this.critLabelsShown() < activeBudget().critLabels;
		n.life = NUMBER_LIFE;
		n.age = 0;
		n.fly = null;
		n.crit = label;
		n.x = s.x + (Math.random() - 0.5) * 10;
		n.y = s.y;
		const text = String(Math.round(amount));
		if (label) {
			const c = COMBAT_FX.crit;
			n.text
				.setText(`${t('fx.crit')}\n${text}`)
				.setColor(toCss(PALETTE.crit))
				.setStroke(toCss(color ?? PALETTE.crit), c.stroke)
				.setFontSize(Math.round(c.fontSize * scale))
				.setScale(c.popScale);
			this.sparkAt(x, y, color ?? PALETTE.crit, activeBudget().critSparks);
		} else {
			n.text
				.setText(text)
				.setColor(toCss(color ?? (crit ? PALETTE.crit : PALETTE.textLight)))
				.setStroke(toCss(PALETTE.night), 2)
				.setFontSize(Math.round((crit ? 18 : 13) * scale))
				.setScale(1);
		}
		n.text.setPosition(n.x, n.y).setAlpha(1).setVisible(true);
	}

	private critLabelsShown(): number {
		let c = 0;
		for (const n of this.numbers) if (n.life > 0 && n.crit) c++;
		return c;
	}

	/** A burst of bright sparks at a ground point (crits, parries). */
	sparkAt(x: number, y: number, tint: number, count: number): void {
		const s = worldToScreen(x, y, 14);
		this.sparks.setParticleTint(tint);
		this.sparks.explode(scaleParticles(count, activeBudget().particleScale), s.x, s.y);
	}

	/** Short floating word over the hero (dodge/parry/block feedback). */
	label(x: number, y: number, kind: 'dodge' | 'parry' | 'block'): void {
		this.damage(x, y, 0, false);
		const n = this.numbers.find((f) => f.life === NUMBER_LIFE);
		if (!n) return;
		const color =
			kind === 'parry' ? PALETTE.crit : kind === 'dodge' ? PALETTE.elIce : PALETTE.textDim;
		n.text
			.setText(t(`fx.${kind}`))
			.setFontSize(kind === 'block' ? 13 : 16)
			.setColor(toCss(color))
			.setStroke(toCss(PALETTE.night), 3);
	}

	/** Dodge: fading ice-blue copies of the hero trail off in the direction (dx, dy). */
	afterimage(src: Phaser.GameObjects.Sprite, dx: number, dy: number): void {
		const d = COMBAT_FX.dodge;
		const len = Math.hypot(dx, dy) || 1;
		for (let i = 1; i <= d.ghosts; i++) {
			const ghost = this.scene.add
				.sprite(src.x, src.y, src.texture.key, src.frame.name)
				.setOrigin(src.originX, src.originY)
				.setScale(src.scaleX, src.scaleY)
				.setFlipX(src.flipX)
				.setTint(PALETTE.elIce)
				.setTintMode(Phaser.TintModes.FILL)
				.setAlpha(d.alpha - (i - 1) * 0.12)
				.setDepth(src.depth - 0.1 * i);
			this.scene.tweens.add({
				targets: ghost,
				x: src.x + (dx / len) * d.spacing * i,
				y: src.y + (dy / len) * d.spacing * i * 0.5,
				alpha: 0,
				duration: d.life * 1000,
				ease: 'Quad.easeOut',
				onComplete: () => ghost.destroy(),
			});
		}
	}

	/** Parry: the reflected damage number flies from the hero to the attacker. */
	reflect(fromX: number, fromY: number, toX: number, toY: number, amount: number): void {
		if (!this.settings.damageNumbers || amount < 1) return;
		const n = this.freeNumber();
		if (!n) return;
		const a = worldToScreen(fromX, fromY, 24);
		const b = worldToScreen(toX, toY, 24);
		n.life = NUMBER_LIFE + COMBAT_FX.parry.travel;
		n.age = 0;
		n.crit = false;
		n.fly = { x0: a.x, y0: a.y, x1: b.x, y1: b.y };
		n.x = a.x;
		n.y = a.y;
		n.text
			.setText(String(Math.round(amount)))
			.setColor(toCss(PALETTE.crit))
			.setStroke(toCss(PALETTE.night), 3)
			.setFontSize(Math.round(16 * NUMBER_SCALE[this.settings.numberSize]))
			.setScale(1)
			.setPosition(a.x, a.y)
			.setAlpha(1)
			.setVisible(true);
	}

	/** Big floating message over the hero (level up, unlocks). */
	banner(x: number, y: number, key: I18nKey, vars?: Record<string, string | number>): void {
		this.damage(x, y, 0, false, PALETTE.crit);
		const n = this.numbers.find((f) => f.life === NUMBER_LIFE);
		if (!n) return;
		n.life = NUMBER_LIFE * 2.5;
		n.text.setText(t(key, vars)).setFontSize(18);
	}

	/** A puddle baked into the ground (stays for the whole run). */
	bloodAt(x: number, y: number, size: number): void {
		const gore = this.settings.gore;
		if (gore === 'reduced' && Math.random() < 0.5) return;
		this.arena.addDecal(x, y, KEYS.splat(this.splatKind, Math.floor(Math.random() * 4)), {
			scale: size * (gore === 'reduced' ? 0.5 : 0.8) * (0.7 + Math.random() * 0.6),
			flip: Math.random() < 0.5,
			alpha: 0.85 + Math.random() * 0.15,
		});
	}

	/** `angle` is the attack direction in world space (radians). */
	slash(x: number, y: number, angle: number, range: number): void {
		let s = this.slashes.find((sl) => sl.life <= 0);
		if (!s) {
			s = { img: this.scene.add.image(0, 0, KEYS.slash), life: 0 };
			this.slashes.push(s);
		}
		const p = worldToScreen(x, y, 14);
		s.life = SLASH_LIFE;
		s.img
			.setPosition(p.x, p.y)
			.setRotation(angle + Math.PI / 2)
			.setScale(range / 36)
			.setDepth(depthOf(x, y) + 1)
			.setAlpha(1)
			.setVisible(true);
	}

	/** Spawn telegraph: a pulsing red mark on the ground for `ARENA.spawnTelegraph` seconds. */
	spawnMark(x: number, y: number): void {
		let m = this.marks.find((q) => q.life <= 0);
		if (!m) {
			m = { img: this.scene.add.image(0, 0, KEYS.spawnMark), life: 0 };
			this.marks.push(m);
		}
		m.life = ARENA.spawnTelegraph;
		m.img.setPosition(Math.round(x), Math.round(y)).setDepth(depthOf(x, y)).setVisible(true);
	}

	update(dt: number): void {
		for (const m of this.marks) {
			if (m.life <= 0) continue;
			m.life -= dt;
			const k = m.life / ARENA.spawnTelegraph;
			m.img.setScale(0.6 + 0.6 * k).setAlpha(m.life <= 0 ? 0 : 0.5 + 0.5 * Math.sin(k * 20));
			if (m.life <= 0) m.img.setVisible(false);
		}
		for (const n of this.numbers) {
			if (n.life <= 0) continue;
			n.life -= dt;
			n.age += dt;
			let shakeX = 0;
			if (n.fly) {
				const k = Math.min(1, n.age / COMBAT_FX.parry.travel);
				n.x = n.fly.x0 + (n.fly.x1 - n.fly.x0) * k;
				n.y = n.fly.y0 + (n.fly.y1 - n.fly.y0) * k;
				if (k >= 1) n.y -= 15 * (n.age - COMBAT_FX.parry.travel);
			} else {
				n.y -= 30 * dt;
			}
			if (n.crit) {
				const c = COMBAT_FX.crit;
				const pop = Math.max(0, 1 - n.age / c.popTime);
				n.text.setScale(1 + (c.popScale - 1) * pop * pop);
				shakeX = Math.sin(n.age * 90) * c.shake * Math.max(0, 1 - n.age / c.shakeTime);
			}
			n.text.setPosition(n.x + shakeX, n.y);
			n.text.setAlpha(Math.min(1, Math.max(0, n.life / NUMBER_LIFE)));
			if (n.life <= 0) n.text.setVisible(false);
		}
		for (const g of this.gibs) {
			if (!g.alive) continue;
			g.vz -= GRAVITY * dt;
			g.z += g.vz * dt;
			g.x += g.vx * dt;
			g.y += g.vy * dt;
			if (g.z <= 0) {
				g.alive = false;
				g.img.setVisible(false);
				g.shadow.setVisible(false);
				this.bloodAt(g.x, g.y, 0.35);
				this.arena.addDecal(g.x, g.y, g.img.texture.key, { angle: Math.random() * 360 });
				continue;
			}
			const s = worldToScreen(g.x, g.y, g.z);
			const ground = worldToScreen(g.x, g.y);
			const depth = depthOf(g.x, g.y);
			g.img.setPosition(Math.round(s.x), Math.round(s.y)).setDepth(depth + 1).rotation +=
				g.spin * dt;
			g.shadow.setPosition(ground.x, ground.y).setDepth(depth - 1);
		}
		for (const s of this.slashes) {
			if (s.life <= 0) continue;
			s.life -= dt;
			s.img.setAlpha(Math.max(0, s.life / SLASH_LIFE));
			if (s.life <= 0) s.img.setVisible(false);
		}
	}
}
