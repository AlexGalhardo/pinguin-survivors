import type Phaser from 'phaser';
import { HERO_IDS, TILE_H, TILE_W } from '../config/constants';
import { PALETTE, toCss } from '../config/palette';
import { ENEMY_LIST } from '../data/enemies';
import { DIRS, type Dir } from '../logic/iso';
import { BIOMES, KEYS } from './manifest';

/** Code-drawn stand-ins for every key until the PixelLab art lands (phase 3). */
export function installPlaceholders(scene: Phaser.Scene): void {
	const biome = BIOMES.antarctica;
	const tileColors = [PALETTE.snow, PALETTE.snowDark, PALETTE.snowLight, PALETTE.ice];
	for (let v = 0; v < biome.tileVariants; v++) {
		canvas(scene, KEYS.tile(biome.id, v), TILE_W, TILE_H, (ctx) => {
			diamond(ctx, TILE_W, TILE_H, tileColors[v] ?? PALETTE.snow);
			ctx.fillStyle = 'rgba(0,0,0,0.12)';
			ctx.fillRect(TILE_W / 2 - 1, TILE_H - 2, 2, 1);
		});
	}
	for (let v = 0; v < biome.decoVariants; v++) {
		const w = 24 + v * 8;
		canvas(scene, KEYS.deco(biome.id, v), w, w, (ctx) => {
			ctx.fillStyle = toCss(v === 2 ? PALETTE.rock : PALETTE.ice);
			ctx.beginPath();
			ctx.moveTo(w / 2, 0);
			ctx.lineTo(w, w * 0.7);
			ctx.lineTo(w / 2, w);
			ctx.lineTo(0, w * 0.7);
			ctx.closePath();
			ctx.fill();
			ctx.fillStyle = 'rgba(255,255,255,0.25)';
			ctx.fillRect(w / 2 - 2, 4, 3, w / 3);
		});
	}
	canvas(scene, KEYS.shadow, 32, 16, (ctx) => {
		ctx.fillStyle = 'rgba(0,0,0,0.45)';
		ctx.beginPath();
		ctx.ellipse(16, 8, 15, 7, 0, 0, Math.PI * 2);
		ctx.fill();
	});
	canvas(scene, KEYS.achievementBadge, 32, 32, (ctx) => {
		ctx.fillStyle = toCss(PALETTE.blood);
		ctx.fillRect(9, 20, 5, 11);
		ctx.fillRect(18, 20, 5, 11);
		ctx.fillStyle = toCss(PALETTE.crit);
		ctx.beginPath();
		ctx.arc(16, 14, 12, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#10131a';
		ctx.beginPath();
		ctx.ellipse(16, 15, 4, 6, 0, 0, Math.PI * 2);
		ctx.fill();
	});
	for (const e of ENEMY_LIST) {
		const h = e.placeholder.height;
		const w = Math.round(h * 0.7);
		canvas(scene, KEYS.enemy(e.id), w, h, (ctx) => zombie(ctx, w, h, e.placeholder.color));
	}
	for (const [tier, color] of [
		['purple', PALETTE.auraPurple],
		['orange', PALETTE.auraOrange],
	] as const) {
		canvas(scene, KEYS.aura(tier), 64, 32, (ctx) => {
			const g = ctx.createRadialGradient(32, 16, 2, 32, 16, 30);
			g.addColorStop(0, `${toCss(color)}cc`);
			g.addColorStop(1, `${toCss(color)}00`);
			ctx.fillStyle = g;
			ctx.save();
			ctx.scale(1, 0.5);
			ctx.beginPath();
			ctx.arc(32, 32, 31, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		});
	}
	canvas(scene, KEYS.projectile('pellet'), 4, 4, (ctx) => {
		ctx.fillStyle = toCss(PALETTE.crit);
		ctx.fillRect(0, 0, 4, 4);
	});
	canvas(scene, KEYS.projectile('orb'), 10, 10, (ctx) => {
		ctx.fillStyle = toCss(PALETTE.lucia);
		ctx.beginPath();
		ctx.arc(5, 5, 5, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#e8d8ff';
		ctx.fillRect(3, 3, 3, 3);
	});
	canvas(scene, KEYS.projectile('spit'), 8, 8, (ctx) => {
		ctx.fillStyle = toCss(PALETTE.goo);
		ctx.beginPath();
		ctx.arc(4, 4, 4, 0, Math.PI * 2);
		ctx.fill();
	});
	canvas(scene, KEYS.slash, 64, 32, (ctx) => {
		ctx.strokeStyle = '#f2f4f8';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.ellipse(32, 16, 30, 14, 0, Math.PI * 1.05, Math.PI * 1.95);
		ctx.stroke();
	});
	canvas(scene, KEYS.blood, 16, 8, (ctx) => {
		ctx.fillStyle = toCss(PALETTE.blood);
		ctx.beginPath();
		ctx.ellipse(8, 4, 8, 4, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = toCss(PALETTE.bloodDark);
		ctx.fillRect(5, 3, 4, 2);
	});
	for (const hero of HERO_IDS) {
		for (const tier of [1, 2, 3]) {
			for (const dir of DIRS) {
				canvas(scene, KEYS.heroFacing(hero, tier, dir), 40, 56, (ctx) =>
					penguin(ctx, PALETTE[hero], dir),
				);
			}
		}
	}
}

function canvas(
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

function diamond(ctx: CanvasRenderingContext2D, w: number, h: number, color: number): void {
	ctx.fillStyle = toCss(color);
	ctx.beginPath();
	ctx.moveTo(w / 2, 0);
	ctx.lineTo(w, h / 2);
	ctx.lineTo(w / 2, h);
	ctx.lineTo(0, h / 2);
	ctx.closePath();
	ctx.fill();
}

const DIR_VEC: Record<Dir, [number, number]> = {
	s: [0, 1],
	se: [1, 1],
	e: [1, 0],
	ne: [1, -1],
	n: [0, -1],
	nw: [-1, -1],
	w: [-1, 0],
	sw: [-1, 1],
};

function penguin(ctx: CanvasRenderingContext2D, accent: number, dir: Dir): void {
	const [dx, dy] = DIR_VEC[dir];
	ctx.fillStyle = '#10131a';
	ctx.beginPath();
	ctx.ellipse(20, 32, 14, 21, 0, 0, Math.PI * 2);
	ctx.fill();
	if (dy >= 0) {
		ctx.fillStyle = '#e8ecf2';
		ctx.beginPath();
		ctx.ellipse(20 + dx * 3, 36, 9, 15, 0, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.fillStyle = toCss(accent);
	ctx.fillRect(8, 12, 24, 4);
	if (dy >= 0 || dx !== 0) {
		ctx.fillStyle = '#f08a24';
		ctx.fillRect(18 + dx * 9, 20 + Math.max(0, dy) * 2, 5, 3);
	}
	ctx.fillStyle = '#f08a24';
	ctx.fillRect(12, 51, 6, 3);
	ctx.fillRect(22, 51, 6, 3);
}

function zombie(ctx: CanvasRenderingContext2D, w: number, h: number, color: number): void {
	ctx.fillStyle = toCss(color);
	ctx.beginPath();
	ctx.ellipse(w / 2, h * 0.58, w * 0.45, h * 0.4, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = 'rgba(0,0,0,0.25)';
	ctx.fillRect(Math.round(w * 0.2), Math.round(h * 0.7), Math.round(w * 0.25), 3);
	ctx.fillStyle = toCss(PALETTE.blood);
	ctx.fillRect(Math.round(w * 0.55), Math.round(h * 0.55), 4, 3);
	ctx.fillStyle = '#ff3b3b';
	ctx.fillRect(Math.round(w * 0.3), Math.round(h * 0.32), 3, 2);
	ctx.fillRect(Math.round(w * 0.6), Math.round(h * 0.32), 3, 2);
}
