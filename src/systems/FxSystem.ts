import type Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { PALETTE, toCss } from '../config/palette';
import { type I18nKey, t } from '../i18n';
import { isoDepth, worldToScreen } from '../logic/iso';
import { UI_FONT } from '../ui/font';
import { GROUND_DEPTH } from '../world/ChunkManager';

const MAX_NUMBERS = 80;
const MAX_BLOOD = 600;
const NUMBER_LIFE = 0.7;
const SLASH_LIFE = 0.12;
/** Damage numbers are always drawn over the world. */
const OVERLAY_DEPTH = 1e9;

interface FloatingNumber {
	text: Phaser.GameObjects.Text;
	life: number;
}

/**
 * Juice placeholders: floating damage numbers, blood puddles (ring buffer until the per-chunk
 * gore layer of phase 4) and melee slashes.
 */
export class FxSystem {
	private readonly numbers: FloatingNumber[] = [];
	private readonly blood: Phaser.GameObjects.Image[] = [];
	private bloodNext = 0;
	private readonly slashes: { img: Phaser.GameObjects.Image; life: number }[] = [];

	constructor(private readonly scene: Phaser.Scene) {}

	damage(x: number, y: number, amount: number, crit: boolean, color?: number): void {
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

	bloodAt(x: number, y: number, size: number): void {
		let img = this.blood[this.bloodNext];
		if (!img) {
			img = this.scene.add.image(0, 0, KEYS.blood);
			this.blood.push(img);
		}
		this.bloodNext = (this.bloodNext + 1) % MAX_BLOOD;
		const s = worldToScreen(x, y);
		img.setPosition(Math.round(s.x), Math.round(s.y))
			.setScale(size * (0.8 + Math.random() * 0.6))
			.setFlipX(Math.random() < 0.5)
			.setDepth(GROUND_DEPTH + 1)
			.setVisible(true);
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
		for (const s of this.slashes) {
			if (s.life <= 0) continue;
			s.life -= dt;
			s.img.setAlpha(Math.max(0, s.life / SLASH_LIFE));
			if (s.life <= 0) s.img.setVisible(false);
		}
	}
}
