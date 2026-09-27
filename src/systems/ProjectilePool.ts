import type Phaser from 'phaser';
import type { Enemy } from '../entities/Enemy';
import type { Element } from '../logic/combat';
import { isoDepth, worldToScreen } from '../logic/iso';
import type { SpatialGrid } from '../logic/spatial-grid';

const MAX_PROJECTILES = 600;
/** Fake height of flying projectiles (screen px above the ground). */
const FLIGHT_Z = 16;

export interface ProjectileSpec {
	x: number;
	y: number;
	angle: number;
	speed: number;
	range: number;
	damage: number;
	crit: boolean;
	texture: string;
	tint?: number;
	pierce?: number;
	/** Bounces to another enemy after a hit (Bob's Ricochet). */
	bounces?: number;
	bounceRange?: number;
	bounceShare?: number;
	element?: Element;
	bleedChance?: number;
	/** Rotates the sprite to face its travel direction (knives, bullets). */
	orient?: boolean;
}

export interface Projectile extends Required<Omit<ProjectileSpec, 'tint' | 'element'>> {
	element: Element | undefined;
	sprite: Phaser.GameObjects.Image;
	vx: number;
	vy: number;
	life: number;
	alive: boolean;
	hit: Set<Enemy>;
}

export type ProjectileHit = (enemy: Enemy, p: Projectile) => void;

/** Shared pool for every straight-flying projectile (signature and secondary weapons). */
export class ProjectilePool {
	private readonly items: Projectile[] = [];
	private readonly scratch: Enemy[] = [];

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly onHit: ProjectileHit,
	) {}

	spawn(spec: ProjectileSpec): void {
		let p = this.items.find((q) => !q.alive);
		if (!p) {
			if (this.items.length >= MAX_PROJECTILES) return;
			p = {
				sprite: this.scene.add.image(0, 0, spec.texture),
				x: 0,
				y: 0,
				angle: 0,
				speed: 0,
				range: 0,
				damage: 0,
				crit: false,
				texture: spec.texture,
				pierce: 0,
				bounces: 0,
				bounceRange: 0,
				bounceShare: 0,
				element: undefined,
				bleedChance: 0,
				orient: false,
				vx: 0,
				vy: 0,
				life: 0,
				alive: false,
				hit: new Set(),
			};
			this.items.push(p);
		}
		p.x = spec.x;
		p.y = spec.y;
		p.angle = spec.angle;
		p.speed = spec.speed;
		p.range = spec.range;
		p.damage = spec.damage;
		p.crit = spec.crit;
		p.texture = spec.texture;
		p.pierce = spec.pierce ?? 0;
		p.bounces = spec.bounces ?? 0;
		p.bounceRange = spec.bounceRange ?? 120;
		p.bounceShare = spec.bounceShare ?? 0.7;
		p.element = spec.element;
		p.bleedChance = spec.bleedChance ?? 0;
		p.orient = spec.orient ?? false;
		p.vx = Math.cos(spec.angle) * spec.speed;
		p.vy = Math.sin(spec.angle) * spec.speed;
		p.life = spec.range / spec.speed;
		p.alive = true;
		p.hit.clear();
		p.sprite.setTexture(spec.texture).setVisible(true);
		if (spec.tint !== undefined) p.sprite.setTint(spec.tint);
		else p.sprite.clearTint();
		this.orientSprite(p);
	}

	update(dt: number, grid: SpatialGrid<Enemy>): void {
		for (const p of this.items) {
			if (!p.alive) continue;
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.life -= dt;
			if (p.life <= 0) {
				this.kill(p);
				continue;
			}
			const s = worldToScreen(p.x, p.y, FLIGHT_Z);
			p.sprite
				.setPosition(Math.round(s.x), Math.round(s.y))
				.setDepth(isoDepth(p.x, p.y) + 0.5);
			this.scratch.length = 0;
			grid.queryRadius(p.x, p.y, 48, this.scratch);
			for (const e of this.scratch) {
				if (!e.alive || p.hit.has(e)) continue;
				const dx = e.x - p.x;
				const dy = e.y - p.y;
				if (dx * dx + dy * dy > (e.radius + 4) ** 2) continue;
				p.hit.add(e);
				this.onHit(e, p);
				if (p.bounces > 0) {
					const next = grid.nearest(
						p.x,
						p.y,
						p.bounceRange,
						(o) => o.alive && !p.hit.has(o),
					);
					if (next) {
						p.bounces--;
						p.damage *= p.bounceShare;
						const a = Math.atan2(next.y - p.y, next.x - p.x);
						p.vx = Math.cos(a) * p.speed;
						p.vy = Math.sin(a) * p.speed;
						p.life = p.bounceRange / p.speed + 0.1;
						this.orientSprite(p);
						break;
					}
				}
				if (p.pierce-- <= 0) {
					this.kill(p);
					break;
				}
			}
		}
	}

	clear(): void {
		for (const p of this.items) this.kill(p);
	}

	private orientSprite(p: Projectile): void {
		if (!p.orient) {
			p.sprite.setRotation(0);
			return;
		}
		// World direction → screen direction for the 2:1 projection.
		p.sprite.setRotation(Math.atan2((p.vx + p.vy) / 2, p.vx - p.vy));
	}

	private kill(p: Projectile): void {
		p.alive = false;
		p.sprite.setVisible(false);
	}
}
