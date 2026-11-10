import type Phaser from 'phaser';
import { PALETTE, toCss } from '../config/palette';
import { CAMPFIRE } from '../data/ambient';
import { KEYS } from './manifest';

function make(
	scene: Phaser.Scene,
	key: string,
	w: number,
	h: number,
	draw: (ctx: CanvasRenderingContext2D) => void,
): void {
	if (scene.textures.exists(key)) return;
	const tex = scene.textures.createCanvas(key, w, h);
	if (!tex) return;
	draw(tex.getContext());
	tex.refresh();
}

/** Flame tip height and sway per frame: a small loop that reads as fire at 2x. */
const FLAME = [
	{ tip: 4, lean: 0 },
	{ tip: 2, lean: 1 },
	{ tip: 5, lean: 0 },
	{ tip: 3, lean: -1 },
] as const;

/** Weather particles, glow, vignette and the campfire frames, all drawn in code (SDD-017). */
export function installAmbientArt(scene: Phaser.Scene): void {
	make(scene, KEYS.weather('dot'), 2, 2, (ctx) => {
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, 2, 2);
	});
	make(scene, KEYS.weather('streak'), 2, 10, (ctx) => {
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, 1, 10);
	});
	make(scene, KEYS.weather('leaf'), 5, 3, (ctx) => {
		ctx.fillStyle = '#fff';
		ctx.fillRect(1, 0, 3, 1);
		ctx.fillRect(0, 1, 5, 1);
		ctx.fillRect(1, 2, 3, 1);
	});
	make(scene, KEYS.glow, 128, 128, (ctx) => {
		const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
		g.addColorStop(0, 'rgba(255,255,255,1)');
		g.addColorStop(0.4, 'rgba(255,255,255,0.45)');
		g.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, 128, 128);
	});
	// White-to-night radial: clear in the middle 55%, darkening towards the corners. Alpha is the
	// image alpha, so one texture serves every biome.
	make(scene, KEYS.vignette, 256, 144, (ctx) => {
		const g = ctx.createRadialGradient(128, 72, 40, 128, 72, 150);
		g.addColorStop(0, 'rgba(255,255,255,0)');
		g.addColorStop(0.45, 'rgba(255,255,255,0)');
		g.addColorStop(1, 'rgba(255,255,255,1)');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, 256, 144);
	});
	for (let n = 0; n < CAMPFIRE.frames; n++) {
		make(scene, KEYS.campfire(n), 20, 22, (ctx) => {
			const f = FLAME[n % FLAME.length] ?? FLAME[0];
			const rect = (c: number, x: number, y: number, w: number, h: number): void => {
				ctx.fillStyle = toCss(c);
				ctx.fillRect(x, y, w, h);
			};
			rect(PALETTE.rock, 2, 17, 4, 3);
			rect(PALETTE.rock, 14, 17, 4, 3);
			rect(PALETTE.trunk, 3, 16, 14, 3);
			rect(PALETTE.forestDirt, 5, 14, 10, 3);
			rect(PALETTE.elFire, 5, f.tip + 4, 10, 11 - f.tip);
			rect(PALETTE.elFire, 7 + f.lean, f.tip, 6, 6);
			rect(PALETTE.fish, 7, f.tip + 6, 6, 8 - f.tip);
			rect(PALETTE.crit, 8 + f.lean, f.tip + 6, 4, 6);
			rect(PALETTE.textLight, 9, 12, 2, 2);
		});
	}
}
