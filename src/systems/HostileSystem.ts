import type Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { isoDepth, worldToScreen } from '../logic/iso';

interface Shot {
	sprite: Phaser.GameObjects.Image;
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	damage: number;
	alive: boolean;
}

const MAX_SHOTS = 120;
const SHOT_RADIUS = 6;

/** Enemy projectiles (scientist spit); they only collide with the hero. */
export class HostileSystem {
	private readonly shots: Shot[] = [];

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly onHitHero: (damage: number) => void,
	) {}

	spawn(
		x: number,
		y: number,
		tx: number,
		ty: number,
		speed: number,
		range: number,
		damage: number,
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
				this.onHitHero(s.damage);
				s.life = 0;
			}
			if (s.life <= 0) {
				s.alive = false;
				s.sprite.setVisible(false);
				continue;
			}
			const p = worldToScreen(s.x, s.y, 14);
			s.sprite
				.setPosition(Math.round(p.x), Math.round(p.y))
				.setDepth(isoDepth(s.x, s.y) + 0.5);
		}
	}

	clear(): void {
		for (const s of this.shots) {
			s.alive = false;
			s.sprite.setVisible(false);
		}
	}
}
