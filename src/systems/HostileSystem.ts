import type Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { type Bounds, insideBounds } from '../logic/arena';
import { depthOf, worldToScreen } from '../logic/projection';
import { GROUND_DEPTH } from '../world/Arena';

/** spit poisons, ink only hits, acid is a pool's damage over time. */
export type HostileKind = 'spit' | 'ink' | 'acid';

interface Shot {
	sprite: Phaser.GameObjects.Image;
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	damage: number;
	kind: HostileKind;
	alive: boolean;
}

/** Ground hazard (boss acid): telegraphed while arming, then hurts the hero standing in it. */
interface Pool {
	img: Phaser.GameObjects.Image;
	x: number;
	y: number;
	radius: number;
	arm: number;
	life: number;
	dps: number;
	alive: boolean;
}

const MAX_SHOTS = 120;
const POOL_ARM = 0.9;
const POOL_ALPHA = 0.55;
const SHOT_RADIUS = 6;

/** Enemy projectiles (spit, boss ink) and boss ground hazards; they only hurt the hero. */
export class HostileSystem {
	private readonly shots: Shot[] = [];
	private readonly pools: Pool[] = [];
	/** Arena walls: shots vanish when they cross them (RF-03). */
	bounds: Bounds | null = null;

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly onHitHero: (damage: number, kind: HostileKind) => void,
	) {}

	/** Shot fired at `angle` (world radians), for boss volleys. */
	spawnAngle(
		x: number,
		y: number,
		angle: number,
		speed: number,
		range: number,
		damage: number,
		kind: HostileKind,
	): void {
		this.spawn(x, y, x + Math.cos(angle), y + Math.sin(angle), speed, range, damage, kind);
	}

	pool(x: number, y: number, radius: number, duration: number, dps: number, tint: number): void {
		let p = this.pools.find((q) => !q.alive);
		if (!p) {
			p = {
				img: this.scene.add.image(0, 0, KEYS.zone),
				x: 0,
				y: 0,
				radius: 0,
				arm: 0,
				life: 0,
				dps: 0,
				alive: false,
			};
			this.pools.push(p);
		}
		Object.assign(p, { x, y, radius, arm: POOL_ARM, life: duration, dps, alive: true });
		const s = worldToScreen(x, y);
		p.img
			.setPosition(Math.round(s.x), Math.round(s.y))
			.setDisplaySize(radius * 2, radius * 2)
			.setTint(tint)
			.setAlpha(0.2)
			.setDepth(GROUND_DEPTH + 2)
			.setVisible(true);
	}

	spawn(
		x: number,
		y: number,
		tx: number,
		ty: number,
		speed: number,
		range: number,
		damage: number,
		kind: HostileKind = 'spit',
	): void {
		let s = this.shots.find((q) => !q.alive);
		if (!s) {
			if (this.shots.length >= MAX_SHOTS) return;
			s = {
				sprite: this.scene.add.image(0, 0, KEYS.projectile('spit')),
				x: 0,
				y: 0,
				vx: 0,
				vy: 0,
				life: 0,
				damage: 0,
				kind: 'spit',
				alive: false,
			};
			this.shots.push(s);
		}
		const a = Math.atan2(ty - y, tx - x);
		Object.assign(s, {
			x,
			y,
			vx: Math.cos(a) * speed,
			vy: Math.sin(a) * speed,
			life: range / speed,
			damage,
			kind,
			alive: true,
		});
		s.sprite.setVisible(true);
	}

	update(dt: number, hx: number, hy: number, heroRadius: number): void {
		for (const s of this.shots) {
			if (!s.alive) continue;
			s.x += s.vx * dt;
			s.y += s.vy * dt;
			s.life -= dt;
			const dx = hx - s.x;
			const dy = hy - s.y;
			if (dx * dx + dy * dy <= (heroRadius + SHOT_RADIUS) ** 2) {
				this.onHitHero(s.damage, s.kind);
				s.life = 0;
			}
			if (s.life <= 0 || (this.bounds && !insideBounds(s, this.bounds))) {
				s.alive = false;
				s.sprite.setVisible(false);
				continue;
			}
			const p = worldToScreen(s.x, s.y, 14);
			s.sprite
				.setPosition(Math.round(p.x), Math.round(p.y))
				.setDepth(depthOf(s.x, s.y) + 0.5);
		}
		for (const p of this.pools) {
			if (!p.alive) continue;
			if (p.arm > 0) {
				p.arm -= dt;
				// Blinking telegraph while arming.
				p.img.setAlpha(0.15 + 0.2 * Math.abs(Math.sin(p.arm * 12)));
				continue;
			}
			p.life -= dt;
			p.img.setAlpha(POOL_ALPHA * Math.min(1, p.life * 2));
			if (p.life <= 0) {
				p.alive = false;
				p.img.setVisible(false);
				continue;
			}
			const dx = hx - p.x;
			const dy = hy - p.y;
			if (dx * dx + dy * dy <= (p.radius + heroRadius) ** 2)
				this.onHitHero(p.dps * dt, 'acid');
		}
	}

	clear(): void {
		for (const s of this.shots) {
			s.alive = false;
			s.sprite.setVisible(false);
		}
		for (const p of this.pools) {
			p.alive = false;
			p.img.setVisible(false);
		}
	}
}
