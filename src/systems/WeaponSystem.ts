import type Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { PALETTE } from '../config/palette';
import type { SignatureWeapon } from '../data/weapons';
import type { Enemy } from '../entities/Enemy';
import { type Element, rollOutgoing } from '../logic/combat';
import { inArc, spreadAngles } from '../logic/geometry';
import { isoDepth, worldToScreen } from '../logic/iso';
import type { Rng } from '../logic/rng';
import type { SpatialGrid } from '../logic/spatial-grid';
import type { PlayerStats } from '../logic/stats';

const MAX_PROJECTILES = 400;
/** Melee aims at enemies a bit beyond the blade so the hero swings as they close in. */
const MELEE_AIM_FACTOR = 1.6;
const ELEMENTS: readonly Element[] = ['fire', 'ice', 'earth', 'energy'];
const ELEMENT_TINT: Record<Element, number> = {
	fire: 0xff7a2f,
	ice: 0x8fd8ff,
	earth: 0xb08a4f,
	energy: 0xfff27a,
};

interface Projectile {
	sprite: Phaser.GameObjects.Image;
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	damage: number;
	crit: boolean;
	pierce: number;
	alive: boolean;
	hit: Set<Enemy>;
	element: Element | undefined;
}

export type HitHandler = (
	enemy: Enemy,
	amount: number,
	crit: boolean,
	element: Element | undefined,
	bleedChance: number,
) => void;

/** Fires the hero's signature weapon automatically (P-18/P-19) and moves its projectiles. */
export class WeaponSystem {
	private cooldown = 0;
	private elementIndex = 0;
	private readonly projectiles: Projectile[] = [];
	private readonly scratch: Enemy[] = [];

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly rng: Rng,
		private readonly stats: PlayerStats,
		public weapon: SignatureWeapon,
		private readonly onHit: HitHandler,
		private readonly onSlash: (
			x: number,
			y: number,
			screenAngle: number,
			range: number,
		) => void,
	) {}

	update(dt: number, hx: number, hy: number, grid: SpatialGrid<Enemy>): void {
		this.cooldown -= dt;
		if (this.cooldown <= 0) {
			const aimRange =
				this.weapon.kind === 'arc'
					? this.weapon.range * MELEE_AIM_FACTOR
					: this.weapon.range;
			const target = grid.nearest(hx, hy, aimRange, (e) => e.alive);
			if (target) {
				this.fire(hx, hy, Math.atan2(target.y - hy, target.x - hx), grid);
				this.cooldown = 1 / (this.weapon.rate * this.stats.attackSpeed);
			}
		}
		this.moveProjectiles(dt, grid);
	}

	clear(): void {
		for (const p of this.projectiles) this.kill(p);
	}

	private fire(hx: number, hy: number, angle: number, grid: SpatialGrid<Enemy>): void {
		const w = this.weapon;
		const mul = this.stats.tagMul[w.tag] * this.stats.damage;
		const range = w.range * (w.kind === 'arc' ? this.stats.area : 1);
		const attack = {
			base: w.damage,
			tag: w.tag,
			multiplier: mul,
			critChance: this.stats.crit,
			critDamage: this.stats.critDamage,
		};
		if (w.kind === 'arc') {
			const arc = ((w.angle ?? 90) * Math.PI) / 180;
			this.scratch.length = 0;
			grid.queryRadius(hx, hy, range + 40, this.scratch);
			for (const e of this.scratch) {
				if (!e.alive || !inArc(hx, hy, angle, arc, range, e.x, e.y, e.radius)) continue;
				const out = rollOutgoing(attack, { crit: this.rng.next() });
				this.onHit(e, out.amount, out.crit, undefined, w.bleedChance ?? 0);
			}
			const c = Math.cos(angle);
			const s = Math.sin(angle);
			this.onSlash(hx, hy, Math.atan2((c + s) / 2, c - s), range);
			return;
		}
		const count = w.kind === 'spread' ? (w.count ?? 1) : 1;
		const spread =
			w.kind === 'spread' ? ((w.angle ?? 30) * Math.PI) / 180 / Math.max(1, count - 1) : 0;
		const element =
			w.kind === 'bolt' ? ELEMENTS[this.elementIndex++ % ELEMENTS.length] : undefined;
		for (const a of spreadAngles(angle, count, spread)) {
			const out = rollOutgoing(attack, { crit: this.rng.next() });
			this.spawnProjectile(hx, hy, a, out.amount, out.crit, element);
		}
	}

	private spawnProjectile(
		x: number,
		y: number,
		angle: number,
		damage: number,
		crit: boolean,
		element: Element | undefined,
	): void {
		let p = this.projectiles.find((q) => !q.alive);
		if (!p) {
			if (this.projectiles.length >= MAX_PROJECTILES) return;
			p = {
				sprite: this.scene.add.image(0, 0, KEYS.projectile('pellet')),
				x: 0,
				y: 0,
				vx: 0,
				vy: 0,
				life: 0,
				damage: 0,
				crit: false,
				pierce: 0,
				alive: false,
				hit: new Set(),
				element: undefined,
			};
			this.projectiles.push(p);
		}
		const w = this.weapon;
		const speed = w.projectileSpeed ?? 400;
		p.x = x;
		p.y = y;
		p.vx = Math.cos(angle) * speed;
		p.vy = Math.sin(angle) * speed;
		p.life = w.range / speed;
		p.damage = damage;
		p.crit = crit;
		p.pierce = w.pierce ?? 0;
		p.alive = true;
		p.hit.clear();
		p.sprite
			.setTexture(KEYS.projectile(element ? 'orb' : 'pellet'))
			.setTint(element ? ELEMENT_TINT[element] : PALETTE.crit)
			.setVisible(true);
		p.element = element;
	}

	private moveProjectiles(dt: number, grid: SpatialGrid<Enemy>): void {
		for (const p of this.projectiles) {
			if (!p.alive) continue;
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.life -= dt;
			if (p.life <= 0) {
				this.kill(p);
				continue;
			}
			const s = worldToScreen(p.x, p.y, 16);
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
				this.onHit(e, p.damage, p.crit, p.element, this.weapon.bleedChance ?? 0);
				if (p.pierce-- <= 0) {
					this.kill(p);
					break;
				}
			}
		}
	}

	private kill(p: Projectile): void {
		p.alive = false;
		p.sprite.setVisible(false);
	}
}
