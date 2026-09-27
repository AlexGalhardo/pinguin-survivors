import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { PALETTE, toCss } from '../config/palette';
import { type I18nKey, t } from '../i18n';
import { isoDepth, worldToScreen } from '../logic/iso';
import type { Settings } from '../logic/save';
import { UI_FONT } from '../ui/font';
import type { ChunkManager } from '../world/ChunkManager';

const MAX_NUMBERS = 80;
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
}

/**
 * Juice and gore (P-10): damage numbers, blood that stays on the ground for the whole run
 * (stamped into the chunk textures), blood spurts, gibs flying in an arc, melee slashes.
 */
export class FxSystem {
	private readonly numbers: FloatingNumber[] = [];
	private readonly gibs: Gib[] = [];
	private readonly spurt: Phaser.GameObjects.Particles.ParticleEmitter;
	/** Gibs thrown this run (achievement counter). */
	gibCount = 0;
	private readonly slashes: { img: Phaser.GameObjects.Image; life: number }[] = [];

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly settings: Settings,
		private readonly chunks: ChunkManager,
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
	}

	private get splatKind(): 'blood' | 'goo' {
		return this.settings.gore === 'goo' ? 'goo' : 'blood';
	}

	/** Spray of droplets on a hit. */
	spray(x: number, y: number, count: number): void {
		if (this.settings.gore === 'reduced') count = Math.ceil(count / 3);
		const s = worldToScreen(x, y, 14);
		this.spurt.setParticleTint(this.splatKind === 'goo' ? PALETTE.goo : PALETTE.blood);
		this.spurt.explode(count, s.x, s.y);
	}

	/** Chunks of the enemy fly out and leave a stain where they land. */
	burst(x: number, y: number, count: number): void {
		if (this.settings.gore === 'reduced') return;
		for (let i = 0; i < count; i++) {
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

	damage(x: number, y: number, amount: number, crit: boolean, color?: number): void {
		// Labels/banners call this with amount 0 and must still show.
		if (!this.settings.damageNumbers && amount > 0) return;
		let n = this.numbers.find((f) => f.life <= 0);
		if (!n) {
			if (this.numbers.length >= MAX_NUMBERS) return;
			const text = this.scene.add
				.text(0, 0, '', {
					fontFamily: UI_FONT,
					fontSize: '10px',
					stroke: toCss(PALETTE.night),
					strokeThickness: 2,
				})
				.setOrigin(0.5)
				.setDepth(OVERLAY_DEPTH);
			n = { text, life: 0 };
			this.numbers.push(n);
		}
		const s = worldToScreen(x, y, 24);
		n.life = NUMBER_LIFE;
		n.text
			.setText(String(Math.round(amount)))
			.setPosition(s.x + (Math.random() - 0.5) * 10, s.y)
			.setColor(toCss(color ?? (crit ? PALETTE.crit : PALETTE.textLight)))
			.setFontSize(crit ? 14 : 10)
			.setAlpha(1)
			.setVisible(true);
	}

	/** Short floating word over the hero (dodge/parry feedback). */
	label(x: number, y: number, kind: 'dodge' | 'parry' | 'block'): void {
		this.damage(x, y, 0, false, kind === 'parry' ? PALETTE.crit : PALETTE.textDim);
		const n = this.numbers.find((f) => f.life === NUMBER_LIFE);
		n?.text.setText(t(`fx.${kind}`)).setFontSize(10);
	}

	/** Big floating message over the hero (level up, unlocks). */
	banner(x: number, y: number, key: I18nKey): void {
		this.damage(x, y, 0, false, PALETTE.crit);
		const n = this.numbers.find((f) => f.life === NUMBER_LIFE);
		if (!n) return;
		n.life = NUMBER_LIFE * 2.5;
		n.text.setText(t(key)).setFontSize(14);
	}

	/** A puddle baked into the ground (stays for the whole run). */
	bloodAt(x: number, y: number, size: number): void {
		const gore = this.settings.gore;
		if (gore === 'reduced' && Math.random() < 0.5) return;
		this.chunks.addDecal(x, y, KEYS.splat(this.splatKind, Math.floor(Math.random() * 4)), {
			scale: size * (gore === 'reduced' ? 0.5 : 0.8) * (0.7 + Math.random() * 0.6),
			flip: Math.random() < 0.5,
			alpha: 0.85 + Math.random() * 0.15,
		});
	}

	/** `angle` is the attack direction in screen space (radians). */
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
			.setDepth(isoDepth(x, y) + 1)
			.setAlpha(1)
			.setVisible(true);
	}

	update(dt: number): void {
		for (const n of this.numbers) {
			if (n.life <= 0) continue;
			n.life -= dt;
			n.text.y -= 30 * dt;
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
				this.chunks.addDecal(g.x, g.y, g.img.texture.key, { angle: Math.random() * 360 });
				continue;
			}
			const s = worldToScreen(g.x, g.y, g.z);
			const ground = worldToScreen(g.x, g.y);
			const depth = isoDepth(g.x, g.y);
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
