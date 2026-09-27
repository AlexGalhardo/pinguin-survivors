import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import type { ViewSize } from '../logic/viewport';

const EMBER = 'fx.ember';
const SHADE = 'fx.menuShade';

/**
 * Animated key art behind the menus: slow drift, rising embers, pulsing lava glow and
 * lightning flashes. The art is scaled by an integer factor that covers the screen.
 */
export class MenuBackground {
	private readonly art: Phaser.GameObjects.Image | null;
	private readonly glow: Phaser.GameObjects.Rectangle;
	private readonly flash: Phaser.GameObjects.Rectangle;
	private readonly shade: Phaser.GameObjects.Image;
	private view: ViewSize = { zoom: 1, width: 0, height: 0 };
	private time = 0;
	private nextLightning = 4;
	/** Emission line along the bottom edge; resized on layout. */
	private readonly zone = new Phaser.Geom.Rectangle(0, 0, 1, 1);

	constructor(private readonly scene: Phaser.Scene) {
		ensureTextures(scene);
		const key = pickArt(scene);
		this.art = key ? scene.add.image(0, 0, key).setOrigin(0.5).setDepth(-10) : null;
		// Normal blend on purpose: ADD over the bright lava art washes everything out.
		this.glow = scene.add.rectangle(0, 0, 10, 10, 0xff3b1f, 0).setOrigin(0).setDepth(-9);
		this.shade = scene.add.image(0, 0, SHADE).setOrigin(0.5, 0).setDepth(-8);
		this.flash = scene.add.rectangle(0, 0, 10, 10, 0xfff4e0, 0).setOrigin(0).setDepth(-7);
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
				blendMode: Phaser.BlendModes.ADD,
			})
			.setDepth(-6);
		scene.events.on('update', this.update, this);
		scene.events.once('shutdown', () => scene.events.off('update', this.update, this));
	}

	layout(view: ViewSize): void {
		this.view = view;
		if (this.art) {
			// Smallest integer scale that covers the logical screen (keeps pixels square).
			const s = Math.max(
				1,
				Math.ceil(Math.max(view.width / this.art.width, view.height / this.art.height)),
			);
			this.art.setScale(s).setPosition(view.width / 2, view.height / 2);
		}
		this.glow.setSize(view.width, view.height);
		this.flash.setSize(view.width, view.height);
		this.shade.setPosition(view.width / 2, 0).setDisplaySize(view.width, view.height * 0.45);
		this.zone.setTo(0, view.height, view.width, 8);
	}

	private update(_t: number, deltaMs: number): void {
		const dt = deltaMs / 1000;
		this.time += dt;
		if (this.art) {
			// Slow drift, a few pixels only, so the pixel art never looks smeared.
			this.art.x = Math.round(this.view.width / 2 + Math.sin(this.time * 0.15) * 6);
			this.art.y = Math.round(this.view.height / 2 + Math.cos(this.time * 0.11) * 3);
		}
		this.glow.fillAlpha =
			0.06 + 0.05 * Math.sin(this.time * 1.7) + 0.03 * Math.sin(this.time * 4.3);
		this.nextLightning -= dt;
		if (this.nextLightning <= 0) {
			this.nextLightning = 5 + Math.random() * 7;
			this.scene.tweens.add({
				targets: this.flash,
				fillAlpha: { from: 0.35, to: 0 },
				duration: 380,
				ease: 'Quad.easeOut',
			});
		}
	}
}

/** Alternates between the available key arts so both candidates can be compared in game. */
function pickArt(scene: Phaser.Scene): string | null {
	const keys = [KEYS.keyart('jack'), KEYS.keyart('bob')].filter((k) => scene.textures.exists(k));
	if (keys.length === 0) return null;
	const n = (scene.registry.get('menuArtIndex') as number | undefined) ?? 0;
	scene.registry.set('menuArtIndex', n + 1);
	return keys[n % keys.length] as string;
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
