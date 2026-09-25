import Phaser from 'phaser';
import { FONT, TEX } from '../art/manifest';
import { CELL_W } from '../art/placeholders/font-5x7';
import { PALETTE } from '../config/palette';

/** Max floating damage numbers alive at once (docs/architecture.md). */
const MAX_NUMBERS = 60;
const NUMBER_LIFE = 0.6;
const NUMBER_RISE = 14;

interface FloatingNumber {
	text: Phaser.GameObjects.BitmapText;
	life: number;
	startY: number;
}

/** Visual feedback: floating damage numbers and short-lived effect sprites (pooled). */
export class FxSystem {
	/** When false, damage numbers are not shown (Settings). */
	showNumbers = true;
	private readonly numbers: FloatingNumber[] = [];
	private readonly free: FloatingNumber[] = [];
	private readonly sprites: Phaser.GameObjects.Group;

	constructor(private readonly scene: Phaser.Scene) {
		this.sprites = scene.add.group({ classType: Phaser.GameObjects.Image, maxSize: 200 });
	}

	damageNumber(x: number, y: number, amount: number, crit: boolean): void {
		if (!this.showNumbers) return;
		const value = Math.max(1, Math.round(amount));
		this.floatText(
			x,
			y,
			crit ? `${value}!` : `${value}`,
			crit ? PALETTE.yellow : PALETTE.white,
			crit ? 2 : 1,
		);
	}

	/** Floating text that rises and fades (pooled, max 60). */
	floatText(x: number, y: number, label: string, color: number, scale = 1): void {
		let n = this.free.pop();
		if (!n) {
			if (this.numbers.length >= MAX_NUMBERS) {
				// Recycle the oldest one.
				n = this.numbers.shift();
				if (!n) return;
			} else {
				const text = this.scene.add
					.bitmapText(0, 0, FONT.pixel, '', CELL_W)
					.setOrigin(0.5, 1);
				n = { text, life: 0, startY: 0 };
			}
		}
		n.text
			.setText(label)
			.setFontSize(CELL_W * scale)
			.setTint(color)
			.setPosition(Math.round(x + (Math.random() * 8 - 4)), Math.round(y - 8))
			.setAlpha(1)
			.setDepth(scale > 1 ? 51 : 50)
			.setVisible(true);
		n.life = NUMBER_LIFE;
		n.startY = n.text.y;
		this.numbers.push(n);
	}

	/** Shows a texture for `duration` seconds, fading out (rotation in radians). */
	flashSprite(
		texture: string,
		x: number,
		y: number,
		duration: number,
		opts: {
			rotation?: number;
			scale?: number;
			depth?: number;
			tint?: number;
			grow?: number;
		} = {},
	): Phaser.GameObjects.Image | null {
		const img = this.sprites.get(x, y, texture) as Phaser.GameObjects.Image | null;
		if (!img) return null;
		const scale = opts.scale ?? 1;
		img.setTexture(texture)
			.setActive(true)
			.setVisible(true)
			.setPosition(x, y)
			.setRotation(opts.rotation ?? 0)
			.setScale(scale)
			.setAlpha(1)
			.setDepth(opts.depth ?? 12);
		if (opts.tint !== undefined) img.setTint(opts.tint);
		else img.clearTint();
		this.scene.tweens.add({
			targets: img,
			alpha: 0,
			scale: scale * (opts.grow ?? 1),
			duration: duration * 1000,
			onComplete: () => img.setActive(false).setVisible(false),
		});
		return img;
	}

	private readonly emitters = new Map<number, Phaser.GameObjects.Particles.ParticleEmitter>();

	/** One pooled particle emitter per color (Phaser particles, explode mode). */
	private emitter(color: number): Phaser.GameObjects.Particles.ParticleEmitter {
		let em = this.emitters.get(color);
		if (!em) {
			em = this.scene.add.particles(0, 0, TEX.fxPixel, {
				speed: { min: 30, max: 110 },
				lifespan: { min: 220, max: 420 },
				scale: { start: 1.5, end: 0 },
				alpha: { start: 1, end: 0.2 },
				tint: color,
				emitting: false,
			});
			em.setDepth(11);
			this.emitters.set(color, em);
		}
		return em;
	}

	/** Burst of pixels (deaths, pickups, explosions). */
	burst(x: number, y: number, color: number, count = 6): void {
		this.emitter(color).explode(count, x, y);
	}

	update(dt: number): void {
		for (let i = this.numbers.length - 1; i >= 0; i--) {
			const n = this.numbers[i];
			if (!n) continue;
			n.life -= dt;
			const t = 1 - n.life / NUMBER_LIFE;
			n.text.y = Math.round(n.startY - NUMBER_RISE * Math.min(1, t * 1.5));
			n.text.setAlpha(t > 0.6 ? 1 - (t - 0.6) / 0.4 : 1);
			if (n.life <= 0) {
				n.text.setVisible(false);
				this.numbers.splice(i, 1);
				this.free.push(n);
			}
		}
	}
}
