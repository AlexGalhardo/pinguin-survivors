import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import type { ViewSize } from '../logic/viewport';

const EMBER = 'fx.ember';
const SHADE = 'fx.menuShade';

/**
 * Key art behind the menus: a still image (integer scale covering the screen) with rising
 * embers on top. No flashes or pulsing (user request).
 */
export class MenuBackground {
	private readonly art: Phaser.GameObjects.Image | null;
	private readonly shade: Phaser.GameObjects.Image;
	/** Emission line along the bottom edge; resized on layout. */
	private readonly zone = new Phaser.Geom.Rectangle(0, 0, 1, 1);

	constructor(scene: Phaser.Scene) {
		ensureTextures(scene);
		const key = pickArt(scene);
		this.art = key ? scene.add.image(0, 0, key).setOrigin(0.5).setDepth(-10) : null;
		this.shade = scene.add.image(0, 0, SHADE).setOrigin(0.5, 0).setDepth(-8);
		scene.add
			.particles(0, 0, EMBER, {
				emitZone: { type: 'random', source: this.zone, quantity: 1 },
				speedY: { min: -40, max: -90 },
				speedX: { min: -12, max: 12 },
				lifespan: { min: 3000, max: 6000 },
				scale: { start: 1, end: 0.2 },
				alpha: { start: 1, end: 0 },
				tint: [0xffb13b, 0xff6a1f, 0xff3b1f],
				frequency: 90,
			})
			.setDepth(-6);
	}

	layout(view: ViewSize): void {
		if (this.art) {
			// Smallest integer scale that covers the logical screen (keeps pixels square).
			const s = Math.max(
				1,
				Math.ceil(Math.max(view.width / this.art.width, view.height / this.art.height)),
			);
			this.art
				.setScale(s)
				.setPosition(Math.round(view.width / 2), Math.round(view.height / 2));
		}
		this.shade.setPosition(view.width / 2, 0).setDisplaySize(view.width, view.height * 0.45);
		this.zone.setTo(0, view.height, view.width, 8);
	}
}

/** 50% chance for each key art every time the menu opens (user request). */
function pickArt(scene: Phaser.Scene): string | null {
	const keys = [KEYS.keyart('jack'), KEYS.keyart('bob')].filter((k) => scene.textures.exists(k));
	if (keys.length === 0) return null;
	return keys[Math.floor(Math.random() * keys.length)] as string;
}

function ensureTextures(scene: Phaser.Scene): void {
	if (!scene.textures.exists(EMBER)) {
		const t = scene.textures.createCanvas(EMBER, 2, 2);
		if (t) {
			const ctx = t.getContext();
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, 2, 2);
			t.refresh();
		}
	}
	if (!scene.textures.exists(SHADE)) {
		const t = scene.textures.createCanvas(SHADE, 4, 64);
		if (t) {
			const ctx = t.getContext();
			const g = ctx.createLinearGradient(0, 0, 0, 64);
			g.addColorStop(0, 'rgba(11,14,20,0.85)');
			g.addColorStop(1, 'rgba(11,14,20,0)');
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, 4, 64);
			t.refresh();
		}
	}
}
