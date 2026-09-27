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
	canvas(scene, KEYS.pickup('xp'), 8, 10, (ctx) => {
		ctx.fillStyle = '#5fe0ff';
		ctx.beginPath();
		ctx.moveTo(4, 0);
		ctx.lineTo(8, 5);
		ctx.lineTo(4, 10);
		ctx.lineTo(0, 5);
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle = '#e8fbff';
		ctx.fillRect(3, 3, 2, 2);
	});
	canvas(scene, KEYS.pickup('fish'), 14, 8, (ctx) => {
		ctx.fillStyle = '#ff9a3c';
		ctx.beginPath();
		ctx.ellipse(6, 4, 6, 3, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.moveTo(11, 4);
		ctx.lineTo(14, 0);
		ctx.lineTo(14, 8);
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle = '#10131a';
		ctx.fillRect(3, 3, 1, 1);
	});
	canvas(scene, KEYS.pickup('meat'), 12, 10, (ctx) => {
		ctx.fillStyle = '#c4161c';
		ctx.beginPath();
		ctx.ellipse(5, 5, 5, 4, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#f2e6d0';
		ctx.fillRect(8, 4, 4, 2);
	});
	const rect = (key: string, w: number, h: number, color: string, accent?: string) =>
		canvas(scene, key, w, h, (ctx) => {
			ctx.fillStyle = color;
			ctx.fillRect(0, 0, w, h);
			if (accent) {
				ctx.fillStyle = accent;
				ctx.fillRect(0, 0, Math.max(1, Math.floor(w / 3)), h);
			}
		});
	rect(KEYS.projectile('knife'), 10, 3, '#d8dee8', '#6b4a2f');
	rect(KEYS.projectile('blade'), 14, 4, '#f2f4f8', '#9aa3b5');
	rect(KEYS.projectile('bottle'), 5, 8, '#5c8a3a', '#ff7a2f');
	rect(KEYS.projectile('grenade'), 6, 6, '#3f5a2a', '#9aa3b5');
	canvas(scene, KEYS.projectile('meteor'), 14, 14, (ctx) => {
		ctx.fillStyle = '#ff7a2f';
		ctx.beginPath();
		ctx.arc(7, 7, 7, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#ffe07a';
		ctx.fillRect(4, 4, 4, 4);
	});
	canvas(scene, KEYS.drone, 16, 10, (ctx) => {
		ctx.fillStyle = '#3a4152';
		ctx.fillRect(2, 3, 12, 5);
		ctx.fillStyle = '#9aa3b5';
		ctx.fillRect(0, 1, 5, 2);
		ctx.fillRect(11, 1, 5, 2);
		ctx.fillStyle = '#ff3b3b';
		ctx.fillRect(7, 5, 2, 2);
	});
	canvas(scene, KEYS.ring, 128, 64, (ctx) => {
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.ellipse(64, 32, 62, 30, 0, 0, Math.PI * 2);
		ctx.stroke();
	});
	canvas(scene, KEYS.zone, 128, 64, (ctx) => {
		const g = ctx.createRadialGradient(64, 32, 4, 64, 32, 62);
		g.addColorStop(0, 'rgba(255,255,255,0.7)');
		g.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = g;
		ctx.save();
		ctx.scale(1, 0.5);
		ctx.beginPath();
		ctx.arc(64, 64, 62, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	});
	canvas(scene, KEYS.barrier, 48, 56, (ctx) => {
		ctx.strokeStyle = 'rgba(179,71,255,0.9)';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.ellipse(24, 28, 22, 26, 0, 0, Math.PI * 2);
		ctx.stroke();
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
