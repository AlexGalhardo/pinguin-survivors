import type Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { ECONOMY } from '../data/economy';
import { isoDepth, worldToScreen } from '../logic/iso';

export type PickupKind = 'xp' | 'fish' | 'meat';

interface Pickup {
	sprite: Phaser.GameObjects.Image;
	kind: PickupKind;
	value: number;
	x: number;
	y: number;
	magnet: boolean;
	alive: boolean;
	bob: number;
}

const MAX_PICKUPS = 500;

/** XP orbs, Fish and meat on the ground; pulled in by the hero's pickup range. */
export class PickupSystem {
	private readonly items: Pickup[] = [];
	private vacuum = false;

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly onCollect: (kind: PickupKind, value: number) => void,
	) {}

	drop(kind: PickupKind, value: number, x: number, y: number): void {
		let p = this.items.find((i) => !i.alive);
		if (!p) {
			if (this.items.length >= MAX_PICKUPS) {
				// Full: merge XP into the oldest orb instead of losing it.
				const orb = this.items.find((i) => i.alive && i.kind === kind);
				if (orb) orb.value += value;
				return;
			}
			p = {
				sprite: this.scene.add.image(0, 0, KEYS.pickup(kind)),
				kind,
				value: 0,
				x: 0,
				y: 0,
				magnet: false,
				alive: false,
				bob: 0,
			};
			this.items.push(p);
		}
		p.kind = kind;
		p.value = value;
		p.x = x;
		p.y = y;
		p.magnet = false;
		p.alive = true;
		p.bob = Math.random() * Math.PI * 2;
		p.sprite.setTexture(KEYS.pickup(kind)).setVisible(true);
	}

	/** End of round: everything on the ground is collected at once. */
	collectAll(): void {
		for (const p of this.items) {
			if (!p.alive) continue;
			p.alive = false;
			p.sprite.setVisible(false);
			this.onCollect(p.kind, p.value);
		}
	}

	/** Pulls every pickup towards the hero (magnet effect). */
	attractAll(): void {
		this.vacuum = true;
	}

	update(dt: number, hx: number, hy: number, pickupRange: number): void {
		let any = false;
		for (const p of this.items) {
			if (!p.alive) continue;
			any = true;
			const dx = hx - p.x;
			const dy = hy - p.y;
			const d = Math.hypot(dx, dy);
			if (d < ECONOMY.collectRadius) {
				p.alive = false;
				p.sprite.setVisible(false);
				this.onCollect(p.kind, p.value);
				continue;
			}
			if (this.vacuum || d < pickupRange) p.magnet = true;
			if (p.magnet) {
				const speed = ECONOMY.magnetSpeed * (this.vacuum ? 3 : 1);
				p.x += (dx / d) * Math.min(d, speed * dt);
				p.y += (dy / d) * Math.min(d, speed * dt);
			}
			p.bob += dt * 4;
			const s = worldToScreen(p.x, p.y, 4 + Math.sin(p.bob) * 2);
			p.sprite.setPosition(Math.round(s.x), Math.round(s.y)).setDepth(isoDepth(p.x, p.y) - 1);
		}
		if (!any) this.vacuum = false;
	}
}
