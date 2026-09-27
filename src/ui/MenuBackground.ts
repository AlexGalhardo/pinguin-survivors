import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import type { ViewSize } from '../logic/viewport';

const EMBER = 'fx.ember';
const SHADE = 'fx.menuShade';

/**
 * Key art behind the menus: a still image (integer scale covering the screen) with rising
 * embers and a soft lava glow pulse on top. No lightning flashes or drift (user request).
 */
export class MenuBackground {
	private readonly art: Phaser.GameObjects.Image | null;
	private readonly shade: Phaser.GameObjects.Image;
	private readonly glow: Phaser.GameObjects.Rectangle;
	private time = 0;
	/** Emission line along the bottom edge; resized on layout. */
	private readonly zone = new Phaser.Geom.Rectangle(0, 0, 1, 1);

	constructor(scene: Phaser.Scene) {
		ensureTextures(scene);
		const key = pickArt(scene);
		this.art = key ? scene.add.image(0, 0, key).setOrigin(0.5).setDepth(-10) : null;
		// Normal blend on purpose: ADD over the bright lava art washes everything out.
		this.glow = scene.add.rectangle(0, 0, 10, 10, 0xff3b1f, 0).setOrigin(0).setDepth(-9);
		this.shade = scene.add.image(0, 0, SHADE).setOrigin(0.5, 0).setDepth(-8);
		scene.events.on('update', this.pulse, this);
		scene.events.once('shutdown', () => scene.events.off('update', this.pulse, this));
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
		this.glow.setSize(view.width, view.height);
		this.shade.setPosition(view.width / 2, 0).setDisplaySize(view.width, view.height * 0.45);
		this.zone.setTo(0, view.height, view.width, 8);
	}

	private pulse(_t: number, deltaMs: number): void {
		this.time += deltaMs / 1000;
		this.glow.fillAlpha =
			0.05 + 0.04 * Math.sin(this.time * 1.7) + 0.02 * Math.sin(this.time * 4.3);
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
