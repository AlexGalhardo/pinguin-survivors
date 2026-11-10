import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { PALETTE } from '../config/palette';

const LIGHT = 'fx.light';
/** Radius of the light texture, in pixels (the texture is 2·R wide). */
const R = 64;
const MAX_LIGHTS = 64;

/** A light in HUD (screen logical) coordinates. */
export interface Light {
	x: number;
	y: number;
	radius: number;
	/** 0..1, how much darkness it removes at the center. */
	strength: number;
}

/**
 * Polar-night darkness with holes of light (P-08, Diablo 4 mood): a screen-sized render texture
 * filled with the night colour, where each light erases a soft radial gradient every frame.
 */
export class Lighting {
	private readonly rt: Phaser.GameObjects.RenderTexture;
	private tint: number = PALETTE.night;

	constructor(
		scene: Phaser.Scene,
		private darkness: number,
	) {
		if (!scene.textures.exists(LIGHT)) {
			const t = scene.textures.createCanvas(LIGHT, R * 2, R * 2);
			if (t) {
				const ctx = t.getContext();
				const g = ctx.createRadialGradient(R, R, 0, R, R, R);
				g.addColorStop(0, 'rgba(255,255,255,1)');
				g.addColorStop(0.55, 'rgba(255,255,255,0.85)');
				g.addColorStop(1, 'rgba(255,255,255,0)');
				ctx.fillStyle = g;
				ctx.fillRect(0, 0, R * 2, R * 2);
				t.refresh();
			}
		}
		this.rt = scene.add.renderTexture(0, 0, 16, 16).setOrigin(0, 0).setDepth(-100);
	}

	resize(width: number, height: number): void {
		this.rt.resize(Math.ceil(width), Math.ceil(height));
	}

	setDarkness(value: number): void {
		this.darkness = value;
	}

	/** Ambient look of the biome: night colour and strength (SDD-017 RF-06). */
	setLook(tint: number, darkness: number): void {
		this.tint = tint;
		this.darkness = darkness;
	}

	draw(lights: readonly Light[]): void {
		const rt = this.rt;
		rt.clear();
		if (this.darkness <= 0) {
			rt.render();
			return;
		}
		rt.fill(this.tint, this.darkness);
		for (const l of lights.slice(0, MAX_LIGHTS)) {
			// stamp() honours scale/alpha; erase() with a game object ignores its scale.
			rt.stamp(LIGHT, undefined, l.x, l.y, {
				scaleX: l.radius / R,
				scaleY: (l.radius / R) * 0.75,
				alpha: l.strength,
				blendMode: Phaser.BlendModes.ERASE,
			});
		}
		rt.render();
	}
}

/** Dark edges of the screen (SDD-017): one stretched image above the darkness layer, every tier. */
export class Vignette {
	private readonly img: Phaser.GameObjects.Image;

	constructor(scene: Phaser.Scene) {
		this.img = scene.add
			.image(0, 0, KEYS.vignette)
			.setOrigin(0, 0)
			.setDepth(-99)
			.setVisible(false);
	}

	resize(width: number, height: number): void {
		this.img.setDisplaySize(Math.ceil(width), Math.ceil(height));
	}

	setLook(tint: number, strength: number): void {
		this.img
			.setTint(tint)
			.setAlpha(strength)
			.setVisible(strength > 0);
	}

	destroy(): void {
		this.img.destroy();
	}
}
