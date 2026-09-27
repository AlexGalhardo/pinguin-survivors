import type Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import type { Enemy } from '../entities/Enemy';
import type { Element } from '../logic/combat';
import { isoDepth, worldToScreen } from '../logic/iso';
import type { SpatialGrid } from '../logic/spatial-grid';
import { GROUND_DEPTH } from '../world/ChunkManager';

/** Radius in world units → scale of the 128×64 ring/zone textures (their radius is 62 px). */
const scaleFor = (radius: number) => (radius * 2) / 124;

export type AreaHit = (
	enemy: Enemy,
	amount: number,
	element: Element | undefined,
	poison: boolean,
) => void;

interface Zone {
	img: Phaser.GameObjects.Image;
	x: number;
	y: number;
	radius: number;
	life: number;
	tick: number;
	interval: number;
	damage: number;
	element: Element | undefined;
	poison: boolean;
	alive: boolean;
}

interface Pending {
	img: Phaser.GameObjects.Image;
	x: number;
	y: number;
	z0: number;
	radius: number;
	delay: number;
	total: number;
	damage: number;
	element: Element | undefined;
	tint: number;
	alive: boolean;
}

interface Flash {
	img: Phaser.GameObjects.Image;
	life: number;
	total: number;
}

/**
 * Ground areas: lingering zones (molotov fire, toxic clouds), delayed impacts (grenades,
 * meteors, bombardment) and expanding ring flashes (stomps, novas, explosions).
 */
export class AreaSystem {
	private readonly zones: Zone[] = [];
	private readonly pending: Pending[] = [];
	private readonly flashes: Flash[] = [];
	private readonly scratch: Enemy[] = [];

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly onHit: AreaHit,
	) {}

	zone(
		x: number,
		y: number,
		radius: number,
		duration: number,
		damagePerTick: number,
		opts: { element?: Element; poison?: boolean; tint: number; interval?: number },
	): void {
		let z = this.zones.find((q) => !q.alive);
		if (!z) {
			z = {
				img: this.scene.add.image(0, 0, KEYS.zone),
				x: 0,
				y: 0,
				radius: 0,
				life: 0,
				tick: 0,
				interval: 0.5,
				damage: 0,
				element: undefined,
				poison: false,
				alive: false,
			};
			this.zones.push(z);
		}
		Object.assign(z, {
			x,
			y,
			radius,
			life: duration,
			tick: 0,
			interval: opts.interval ?? 0.5,
			damage: damagePerTick,
			element: opts.element,
			poison: opts.poison ?? false,
			alive: true,
		});
		const s = worldToScreen(x, y);
		z.img
			.setPosition(s.x, s.y)
			.setScale(scaleFor(radius))
			.setTint(opts.tint)
			.setAlpha(0.7)
			.setDepth(GROUND_DEPTH + 2)
			.setVisible(true);
	}

	/** Something falls from the sky (or is lobbed) and explodes after `delay` seconds. */
	impact(
		x: number,
		y: number,
		radius: number,
		delay: number,
		damage: number,
		texture: string,
		opts: { element?: Element; tint: number; fromZ?: number },
	): void {
		let p = this.pending.find((q) => !q.alive);
		if (!p) {
			p = {
				img: this.scene.add.image(0, 0, texture),
				x: 0,
				y: 0,
				z0: 0,
				radius: 0,
				delay: 0,
				total: 0,
				damage: 0,
				element: undefined,
				tint: 0xffffff,
				alive: false,
			};
			this.pending.push(p);
		}
		Object.assign(p, {
			x,
			y,
			z0: opts.fromZ ?? 220,
			radius,
			delay,
			total: delay,
			damage,
			element: opts.element,
			tint: opts.tint,
			alive: true,
		});
		p.img.setTexture(texture).setVisible(true);
	}

	flash(x: number, y: number, radius: number, tint: number, duration = 0.3): void {
		let f = this.flashes.find((q) => q.life <= 0);
		if (!f) {
			f = { img: this.scene.add.image(0, 0, KEYS.ring), life: 0, total: 0 };
			this.flashes.push(f);
		}
		f.life = duration;
		f.total = duration;
		const s = worldToScreen(x, y);
		f.img
			.setPosition(s.x, s.y)
			.setTint(tint)
			.setScale(scaleFor(radius) * 0.3)
			.setData('target', scaleFor(radius))
			.setAlpha(1)
			.setDepth(isoDepth(x, y) + 2)
			.setVisible(true);
	}

	/** Deals `damage` to every enemy inside the circle, once. */
	burst(
		grid: SpatialGrid<Enemy>,
		x: number,
		y: number,
		radius: number,
		damage: number,
		element: Element | undefined,
		poison = false,
	): Enemy[] {
		this.scratch.length = 0;
		grid.queryRadius(x, y, radius + 24, this.scratch);
		const hit: Enemy[] = [];
		for (const e of this.scratch) {
			if (!e.alive) continue;
			const dx = e.x - x;
			const dy = e.y - y;
			if (dx * dx + dy * dy > (radius + e.radius) ** 2) continue;
			hit.push(e);
		}
		for (const e of hit) this.onHit(e, damage, element, poison);
		return hit;
	}

	update(dt: number, grid: SpatialGrid<Enemy>): void {
		for (const z of this.zones) {
			if (!z.alive) continue;
			z.life -= dt;
			z.tick -= dt;
			if (z.tick <= 0) {
				z.tick = z.interval;
				this.burst(grid, z.x, z.y, z.radius, z.damage, z.element, z.poison);
			}
			z.img.setAlpha(Math.min(0.7, z.life));
			if (z.life <= 0) {
				z.alive = false;
				z.img.setVisible(false);
			}
		}
		for (const p of this.pending) {
			if (!p.alive) continue;
			p.delay -= dt;
			const t = Math.max(0, p.delay / p.total);
			const s = worldToScreen(p.x, p.y, p.z0 * t);
			p.img.setPosition(Math.round(s.x), Math.round(s.y)).setDepth(isoDepth(p.x, p.y) + 3);
			if (p.delay <= 0) {
				p.alive = false;
				p.img.setVisible(false);
				this.burst(grid, p.x, p.y, p.radius, p.damage, p.element);
				this.flash(p.x, p.y, p.radius, p.tint);
			}
		}
		for (const f of this.flashes) {
			if (f.life <= 0) continue;
			f.life -= dt;
			const k = 1 - Math.max(0, f.life / f.total);
			const target = f.img.getData('target') as number;
			f.img.setScale(target * (0.3 + 0.7 * k)).setAlpha(1 - k);
			if (f.life <= 0) f.img.setVisible(false);
		}
	}

	clear(): void {
		for (const z of this.zones) {
			z.alive = false;
			z.img.setVisible(false);
		}
		for (const p of this.pending) {
			p.alive = false;
			p.img.setVisible(false);
		}
	}
}
