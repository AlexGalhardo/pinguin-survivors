import type Phaser from 'phaser';
import { HERO_IDS } from '../config/constants';
import { PALETTE, toCss } from '../config/palette';
import { ARENA } from '../data/arena';
import { ENEMY_LIST } from '../data/enemies';
import { GEAR } from '../data/equipment';
import { DIRS, type Dir } from '../logic/projection';
import { BIOMES, KEYS } from './manifest';

const T = ARENA.tile;
/** Wall thickness drawn on the outermost tile ring, in px. */
const WALL = 12;

/** Code-drawn stand-ins for every key until the PixelLab art lands (phase 3). */
export function installPlaceholders(scene: Phaser.Scene): void {
	biomePlaceholders(scene);
	borderPlaceholders(scene);
	gearPlaceholders(scene);
	const biome = BIOMES.antarctica;
	const tileColors = [PALETTE.snow, PALETTE.snowDark, PALETTE.snowLight, PALETTE.ice];
	for (let v = 0; v < biome.tileVariants; v++) {
		canvas(scene, KEYS.tile(biome.id, v), T, T, (ctx) => {
			ctx.fillStyle = toCss(tileColors[v] ?? PALETTE.snow);
			ctx.fillRect(0, 0, T, T);
			ctx.fillStyle = 'rgba(0,0,0,0.12)';
			ctx.fillRect(T / 2 - 1, T - 6, 2, 1);
			ctx.fillRect(12 + v * 9, 14, 3, 1);
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
		canvas(scene, KEYS.enemy(e.id), w, h, (ctx) =>
			e.placeholder.shape === 'alien'
				? alien(ctx, w, h, e.placeholder.color)
				: zombie(ctx, w, h, e.placeholder.color),
		);
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
	rect(KEYS.projectile('bolt'), 12, 2, '#c8a870', '#6b4a2f');
	canvas(scene, KEYS.projectile('fishBoomerang'), 14, 8, (ctx) => {
		ctx.fillStyle = '#6fa3c7';
		ctx.beginPath();
		ctx.ellipse(6, 4, 6, 3, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.moveTo(11, 4);
		ctx.lineTo(14, 0);
		ctx.lineTo(14, 8);
		ctx.closePath();
		ctx.fill();
	});
	canvas(scene, KEYS.projectile('mine'), 10, 6, (ctx) => {
		ctx.fillStyle = '#3a4152';
		ctx.beginPath();
		ctx.ellipse(5, 3, 5, 3, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#ff3b3b';
		ctx.fillRect(4, 1, 2, 2);
	});
	canvas(scene, KEYS.projectile('totem'), 8, 22, (ctx) => {
		ctx.fillStyle = '#5a4a3a';
		ctx.fillRect(2, 4, 4, 18);
		ctx.fillStyle = '#fff27a';
		ctx.fillRect(0, 0, 8, 5);
	});
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
	canvas(scene, KEYS.ring, 128, 128, (ctx) => {
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.arc(64, 64, 62, 0, Math.PI * 2);
		ctx.stroke();
	});
	canvas(scene, KEYS.zone, 128, 128, (ctx) => {
		const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
		g.addColorStop(0, 'rgba(255,255,255,0.7)');
		g.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = g;
		ctx.beginPath();
		ctx.arc(64, 64, 62, 0, Math.PI * 2);
		ctx.fill();
	});
	canvas(scene, KEYS.barrier, 48, 56, (ctx) => {
		ctx.strokeStyle = 'rgba(179,71,255,0.9)';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.ellipse(24, 28, 22, 26, 0, 0, Math.PI * 2);
		ctx.stroke();
	});
	const blade = (id: string, len: number, color: string, edge: string, teeth = false) =>
		canvas(scene, KEYS.weapon(id), len, 8, (ctx) => {
			ctx.fillStyle = '#5a3a22';
			ctx.fillRect(0, 3, 7, 3);
			ctx.fillStyle = '#9aa3b5';
			ctx.fillRect(7, 2, 2, 5);
			ctx.fillStyle = color;
			ctx.fillRect(9, 2, len - 11, 4);
			ctx.fillStyle = edge;
			ctx.fillRect(9, 5, len - 11, 1);
			if (teeth) for (let x = 10; x < len - 2; x += 3) ctx.fillRect(x, 1, 1, 1);
			ctx.fillStyle = '#a3121a';
			ctx.fillRect(len - 8, 3, 4, 2);
		});
	blade('machete', 26, '#c8ced8', '#f2f4f8');
	blade('hammer', 24, '#7d8699', '#c8ced8');
	blade('katana', 34, '#dfe5ee', '#ffffff');
	blade('chainsword', 36, '#7d8699', '#ffb13b', true);
	const gun = (id: string, len: number, body: string, barrels: number, tip?: string) =>
		canvas(scene, KEYS.weapon(id), len, 10, (ctx) => {
			ctx.fillStyle = '#5a3a22';
			ctx.fillRect(0, 4, 9, 4);
			ctx.fillStyle = body;
			ctx.fillRect(8, 2, len - 8, 3 + barrels);
			ctx.fillStyle = '#2c2f3a';
			for (let b = 0; b < barrels; b++) ctx.fillRect(10, 2 + b * 2, len - 12, 1);
			if (tip) {
				ctx.fillStyle = tip;
				ctx.fillRect(len - 4, 1, 4, 6);
			}
		});
	gun('doubleBarrel', 28, '#6b7488', 2);
	gun('autoShotgun', 30, '#4a5266', 2, '#3a4152');
	gun('rocketShotgun', 32, '#5c8a3a', 3, '#c4161c');
	gun('auxPistol', 14, '#6b7488', 1);
	const staff = (id: string, len: number, gems: string[]) =>
		canvas(scene, KEYS.weapon(id), len, 12, (ctx) => {
			ctx.fillStyle = '#6b4a2f';
			ctx.fillRect(0, 5, len - 8, 2);
			ctx.fillStyle = '#8fd8ff';
			ctx.beginPath();
			ctx.arc(len - 5, 6, 4, 0, Math.PI * 2);
			ctx.fill();
			gems.forEach((g, i) => {
				ctx.fillStyle = g;
				ctx.fillRect(len - 10 + i * 2, i % 2 ? 1 : 10, 2, 1);
			});
		});
	staff('elementStaff', 30, ['#ff7a2f', '#6fdc4a', '#8fd8ff', '#fff27a']);
	staff('arcaneStaff', 34, ['#b347ff', '#b347ff', '#e8d8ff', '#b347ff']);
	staff('stormStaff', 38, ['#ff7a2f', '#6fdc4a', '#8fd8ff', '#fff27a']);
	// Secondary weapons shown around the hero (P-67), until PixelLab sprites land.
	blade('knives', 16, '#d8dee8', '#f2f4f8');
	blade('fishBoomerang', 18, '#6fa3c7', '#8fd8ff');
	blade('bladeWhirl', 22, '#dfe5ee', '#ffffff');
	blade('seismicStomp', 20, '#8a6f5a', '#b08a4f');
	gun('crossbow', 22, '#6b4a2f', 1, '#c8a870');
	gun('molotov', 14, '#5c8a3a', 1, '#ff7a2f');
	gun('mine', 14, '#3a4152', 1, '#ff3b3b');
	gun('grenadeBelt', 16, '#3f5a2a', 2, '#9aa3b5');
	gun('droneSentinel', 18, '#3a4152', 1, '#ff3b3b');
	staff('iceShards', 22, ['#8fd8ff', '#e8fbff']);
	staff('flameRing', 22, ['#ff7a2f', '#ffb13b']);
	staff('lightningTotem', 24, ['#fff27a', '#fff27a']);
	staff('poisonCloud', 22, ['#6fdc4a', '#6fdc4a']);
	staff('arcaneChain', 24, ['#fff27a', '#b347ff']);
	staff('meteorShower', 24, ['#ff7a2f', '#c4161c']);
	staff('frostNova', 24, ['#8fd8ff', '#ffffff']);
	canvas(scene, KEYS.muzzle, 12, 10, (ctx) => {
		ctx.fillStyle = '#ffe07a';
		ctx.beginPath();
		ctx.moveTo(0, 5);
		ctx.lineTo(12, 0);
		ctx.lineTo(9, 5);
		ctx.lineTo(12, 10);
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 4, 5, 2);
	});
	canvas(scene, KEYS.spawnMark, 48, 48, (ctx) => {
		ctx.strokeStyle = '#ff3b3b';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.arc(24, 24, 20, 0, Math.PI * 2);
		ctx.moveTo(12, 12);
		ctx.lineTo(36, 36);
		ctx.moveTo(36, 12);
		ctx.lineTo(12, 36);
		ctx.stroke();
	});
	canvas(scene, KEYS.slash, 64, 32, (ctx) => {
		ctx.strokeStyle = '#f2f4f8';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.ellipse(32, 16, 30, 14, 0, Math.PI * 1.05, Math.PI * 1.95);
		ctx.stroke();
	});
	for (const [kind, main, dark] of [
		['blood', PALETTE.blood, PALETTE.bloodDark],
		['goo', PALETTE.goo, 0x2f7a1f],
	] as const) {
		for (let n = 0; n < 4; n++) {
			canvas(scene, KEYS.splat(kind, n), 36, 36, (ctx) => splat(ctx, 36, 36, main, dark, n));
		}
	}
	for (let n = 0; n < 4; n++) {
		canvas(scene, KEYS.gib(n), 6, 5, (ctx) => {
			ctx.fillStyle = toCss(n % 2 ? PALETTE.bloodDark : PALETTE.blood);
			ctx.fillRect(0, 1, 6, 3);
			ctx.fillStyle = toCss(n < 2 ? 0xd8c8b8 : PALETTE.zombie);
			ctx.fillRect(1 + n, 0, 2, 2);
		});
	}
	canvas(scene, KEYS.droplet, 2, 2, (ctx) => {
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, 2, 2);
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

/** Arena wall: 0 = straight edge (wall on the top), 1 = outer corner (top and left). */
function borderPlaceholders(scene: Phaser.Scene): void {
	const walls = {
		antarctica: PALETTE.rock,
		forest: PALETTE.forestDark,
		city: PALETTE.concrete,
		station: PALETTE.metalDark,
		ruins: PALETTE.brick,
	} as const;
	for (const id of Object.keys(walls) as (keyof typeof walls)[]) {
		const wall = toCss(walls[id]);
		const band = (ctx: CanvasRenderingContext2D, vertical: boolean) => {
			ctx.fillStyle = wall;
			if (vertical) ctx.fillRect(0, 0, WALL, T);
			else ctx.fillRect(0, 0, T, WALL);
			ctx.fillStyle = 'rgba(255,255,255,0.22)';
			if (vertical) ctx.fillRect(WALL - 2, 0, 2, T);
			else ctx.fillRect(0, WALL - 2, T, 2);
		};
		canvas(scene, KEYS.border(id, 0), T, T, (ctx) => band(ctx, false));
		canvas(scene, KEYS.border(id, 1), T, T, (ctx) => {
			band(ctx, false);
			band(ctx, true);
		});
	}
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

/** Original alien silhouette: domed head with three acid-green eyes over a segmented, limbless body. */
function alien(ctx: CanvasRenderingContext2D, w: number, h: number, color: number): void {
	ctx.fillStyle = toCss(color);
	ctx.beginPath();
	ctx.moveTo(w * 0.15, h);
	ctx.lineTo(w * 0.28, h * 0.5);
	ctx.lineTo(w * 0.72, h * 0.5);
	ctx.lineTo(w * 0.85, h);
	ctx.closePath();
	ctx.fill();
	ctx.beginPath();
	ctx.arc(w / 2, h * 0.34, w * 0.36, Math.PI, 0);
	ctx.lineTo(w * 0.86, h * 0.5);
	ctx.lineTo(w * 0.14, h * 0.5);
	ctx.closePath();
	ctx.fill();
	ctx.fillStyle = 'rgba(0,0,0,0.3)';
	for (let i = 0; i < 3; i++) ctx.fillRect(w * 0.2, h * (0.62 + i * 0.12), w * 0.6, 2);
	ctx.fillStyle = toCss(PALETTE.goo);
	for (let i = 0; i < 3; i++)
		ctx.fillRect(Math.round(w * (0.28 + i * 0.2)), Math.round(h * 0.3), 3, 3);
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

/** Irregular flat puddle with drops around it. */
function splat(
	ctx: CanvasRenderingContext2D,
	w: number,
	h: number,
	main: number,
	dark: number,
	seed: number,
): void {
	let r = seed * 9301 + 49297;
	const rand = () => {
		r = (r * 9301 + 49297) % 233280;
		return r / 233280;
	};
	ctx.fillStyle = toCss(main);
	for (let i = 0; i < 7; i++) {
		ctx.beginPath();
		ctx.ellipse(
			w / 2 + (rand() - 0.5) * w * 0.5,
			h / 2 + (rand() - 0.5) * h * 0.4,
			3 + rand() * w * 0.18,
			2 + rand() * h * 0.18,
			0,
			0,
			Math.PI * 2,
		);
		ctx.fill();
	}
	for (let i = 0; i < 6; i++)
		ctx.fillRect(Math.floor(rand() * w), Math.floor(rand() * h), 1 + Math.floor(rand() * 2), 1);
	ctx.fillStyle = toCss(dark);
	ctx.beginPath();
	ctx.ellipse(w / 2, h / 2, w * 0.14, h * 0.14, 0, 0, Math.PI * 2);
	ctx.fill();
}

/** Ground and props of biomes 2 (station/harbor: plates, crates, barrels) and 3 (ruins). */
function biomePlaceholders(scene: Phaser.Scene): void {
	const looks = {
		forest: {
			tiles: [
				PALETTE.forestGround,
				PALETTE.forestMoss,
				PALETTE.forestDirt,
				PALETTE.forestDark,
			],
			props: [PALETTE.trunk, PALETTE.leaf, PALETTE.forestDirt],
		},
		city: {
			tiles: [PALETTE.asphalt, PALETTE.concrete, PALETTE.rubble, PALETTE.asphalt],
			props: [PALETTE.burnedCar, PALETTE.rubble, PALETTE.concrete],
		},
		station: {
			tiles: [PALETTE.metal, PALETTE.metalDark, PALETTE.rust, PALETTE.harborWater],
			props: [PALETTE.rust, PALETTE.metal, PALETTE.auraOrange],
		},
		ruins: {
			tiles: [PALETTE.asphalt, PALETTE.concrete, PALETTE.rubble, PALETTE.brick],
			props: [PALETTE.concrete, PALETTE.brick, PALETTE.rubble],
		},
	} as const;
	for (const id of ['forest', 'city', 'station', 'ruins'] as const) {
		const biome = BIOMES[id];
		const look = looks[id];
		for (let v = 0; v < biome.tileVariants; v++) {
			canvas(scene, KEYS.tile(id, v), T, T, (ctx) => {
				ctx.fillStyle = toCss(look.tiles[v] ?? PALETTE.metal);
				ctx.fillRect(0, 0, T, T);
				ctx.fillStyle = 'rgba(0,0,0,0.18)';
				if (id === 'forest') {
					// Grass tufts and leaf litter.
					for (let i = 0; i < 9; i++)
						ctx.fillRect(
							6 + ((i * 17 + v * 5) % 52),
							6 + ((i * 23 + v * 11) % 52),
							2,
							3,
						);
				} else if (id === 'city') {
					// Cracked asphalt.
					ctx.fillRect(8, 20 + v * 6, 30, 1);
					ctx.fillRect(38, 20 + v * 6, 1, 14);
					ctx.fillRect(20, 40, 24, 1);
				} else {
					// Plate seams / cracks so the ground reads as man-made.
					ctx.fillRect(T / 2 - 12, T / 2, 24, 1);
					ctx.fillRect(T / 2, T / 2 - 8, 1, 16);
				}
			});
		}
		for (let v = 0; v < biome.decoVariants; v++) {
			const w = 22 + v * 8;
			canvas(scene, KEYS.deco(id, v), w, w, (ctx) => {
				const color = toCss(look.props[v] ?? PALETTE.metal);
				ctx.fillStyle = color;
				if (id === 'forest' && v !== 2) {
					// Tree (v 0: trunk with a dark canopy, v 1: round leafy bush).
					ctx.fillStyle = toCss(PALETTE.trunk);
					ctx.fillRect(w * 0.42, w * 0.55, w * 0.16, w * 0.4);
					ctx.fillStyle = toCss(v === 0 ? PALETTE.forestDark : PALETTE.leaf);
					ctx.beginPath();
					ctx.arc(w / 2, w * 0.4, w * (v === 0 ? 0.38 : 0.3), 0, Math.PI * 2);
					ctx.fill();
				} else if (id === 'forest') {
					// Fallen log.
					ctx.fillRect(w * 0.08, w * 0.55, w * 0.84, w * 0.3);
					ctx.fillStyle = 'rgba(0,0,0,0.3)';
					ctx.fillRect(w * 0.08, w * 0.7, w * 0.84, 2);
				} else if (id === 'city' && v === 0) {
					// Burned-out car.
					ctx.fillRect(w * 0.08, w * 0.45, w * 0.84, w * 0.35);
					ctx.fillStyle = 'rgba(255,120,40,0.35)';
					ctx.fillRect(w * 0.3, w * 0.3, w * 0.4, w * 0.18);
					ctx.fillStyle = 'rgba(0,0,0,0.5)';
					ctx.fillRect(w * 0.15, w * 0.75, w * 0.18, w * 0.12);
					ctx.fillRect(w * 0.67, w * 0.75, w * 0.18, w * 0.12);
				} else if (id === 'city' && v === 2) {
					// Broken wall block with rebar.
					ctx.fillRect(w * 0.2, w * 0.25, w * 0.6, w * 0.7);
					ctx.fillStyle = 'rgba(0,0,0,0.35)';
					ctx.fillRect(w * 0.45, w * 0.1, 2, w * 0.2);
				} else if ((id === 'city' && v === 1) || (id === 'ruins' && v === 2)) {
					// Rubble heap.
					ctx.beginPath();
					ctx.moveTo(0, w);
					ctx.lineTo(w * 0.35, w * 0.45);
					ctx.lineTo(w * 0.6, w * 0.6);
					ctx.lineTo(w * 0.8, w * 0.35);
					ctx.lineTo(w, w);
					ctx.closePath();
					ctx.fill();
				} else if (id === 'station' && v === 1) {
					// Barrel.
					ctx.fillRect(w * 0.3, w * 0.2, w * 0.4, w * 0.75);
					ctx.fillStyle = 'rgba(0,0,0,0.3)';
					ctx.fillRect(w * 0.3, w * 0.45, w * 0.4, 2);
				} else {
					// Crate / broken wall block.
					ctx.fillRect(w * 0.15, w * 0.3, w * 0.7, w * 0.65);
					ctx.fillStyle = 'rgba(255,255,255,0.15)';
					ctx.fillRect(w * 0.15, w * 0.3, w * 0.7, 2);
					ctx.fillStyle = 'rgba(0,0,0,0.25)';
					ctx.fillRect(w * 0.48, w * 0.3, 2, w * 0.65);
				}
			});
		}
	}
}

/** Health packs (3 sizes), equipment icons (shape per slot, color per rarity) and their glow. */
export function gearPlaceholders(scene: Phaser.Scene): void {
	for (const [percent, size] of [
		[25, 10],
		[50, 12],
		[75, 14],
	] as const) {
		canvas(scene, KEYS.healPack(percent), size, size, (ctx) => {
			ctx.fillStyle = '#f2f4f8';
			ctx.fillRect(0, 0, size, size);
			ctx.fillStyle = toCss(PALETTE.blood);
			const t = Math.max(2, Math.round(size / 4));
			ctx.fillRect((size - t) / 2, 2, t, size - 4);
			ctx.fillRect(2, (size - t) / 2, size - 4, t);
		});
	}
	const rarityColor = {
		common: PALETTE.rarityCommon,
		rare: PALETTE.rarityRare,
		legendary: PALETTE.rarityLegendary,
	} as const;
	for (const item of GEAR) {
		const c = toCss(rarityColor[item.rarity]);
		canvas(scene, KEYS.gear(item.id), 20, 20, (ctx) => {
			ctx.fillStyle = '#10131a';
			ctx.fillRect(0, 0, 20, 20);
			ctx.strokeStyle = c;
			ctx.fillStyle = c;
			ctx.lineWidth = 2;
			switch (item.slot) {
				case 'helmet':
					ctx.beginPath();
					ctx.arc(10, 12, 7, Math.PI, 0);
					ctx.fill();
					ctx.fillRect(3, 12, 14, 3);
					break;
				case 'armor':
					ctx.fillRect(5, 5, 10, 12);
					ctx.fillRect(2, 5, 16, 4);
					break;
				case 'legs':
					ctx.fillRect(5, 3, 4, 14);
					ctx.fillRect(11, 3, 4, 14);
					ctx.fillRect(5, 3, 10, 4);
					break;
				case 'ring':
					ctx.beginPath();
					ctx.arc(10, 11, 6, 0, Math.PI * 2);
					ctx.stroke();
					ctx.fillRect(8, 2, 4, 4);
					break;
				case 'amulet':
					ctx.beginPath();
					ctx.moveTo(4, 2);
					ctx.lineTo(10, 10);
					ctx.lineTo(16, 2);
					ctx.stroke();
					ctx.beginPath();
					ctx.arc(10, 13, 4, 0, Math.PI * 2);
					ctx.fill();
					break;
			}
			ctx.strokeStyle = c;
			ctx.lineWidth = 1;
			ctx.strokeRect(0.5, 0.5, 19, 19);
		});
	}
	canvas(scene, KEYS.gearGlow, 48, 24, (ctx) => {
		const g = ctx.createRadialGradient(24, 12, 1, 24, 12, 23);
		g.addColorStop(0, 'rgba(255,255,255,0.95)');
		g.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = g;
		ctx.save();
		ctx.scale(1, 0.5);
		ctx.beginPath();
		ctx.arc(24, 24, 23, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	});
}
