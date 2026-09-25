import Phaser from 'phaser';
import { TEX } from '../art/manifest';

export type PickupKind = 'gold' | 'medkit';

/** Radius (px) at which a pickup touching the player is collected. */
const COLLECT_RADIUS = 10;
/** Max gold coins dropped for one kill (the value is split among them). */
const MAX_COINS_PER_DROP = 5;

export class Pickup extends Phaser.GameObjects.Image {
	kind: PickupKind = 'gold';
	value = 0;
	/** True once the magnet grabbed it (it keeps flying to the player). */
	attracted = false;
	speed = 0;
	bob = 0;
}

/** Pooled gold/medkit pickups. */
export class PickupSystem {
	readonly group: Phaser.GameObjects.Group;
	onCollect?: (kind: PickupKind, value: number) => void;

	constructor(
		scene: Phaser.Scene,
		private readonly player: { x: number; y: number },
	) {
		this.group = scene.add.group({ classType: Pickup, maxSize: 500 });
	}

	dropGold(x: number, y: number, amount: number): void {
		const coins = Math.min(MAX_COINS_PER_DROP, amount);
		const base = Math.floor(amount / coins);
		let rest = amount - base * coins;
		for (let i = 0; i < coins; i++) {
			const v = base + (rest > 0 ? 1 : 0);
			rest--;
			const ox = coins > 1 ? (Math.random() - 0.5) * 16 : 0;
			const oy = coins > 1 ? (Math.random() - 0.5) * 16 : 0;
			this.spawn('gold', x + ox, y + oy, v);
		}
	}

	spawn(kind: PickupKind, x: number, y: number, value: number): Pickup | null {
		const texture = kind === 'gold' ? TEX.pickupGold : TEX.pickupMedkit;
		const p = this.group.get(x, y, texture) as Pickup | null;
		if (!p) return null;
		p.setTexture(texture).setActive(true).setVisible(true).setPosition(x, y).setDepth(3);
		p.kind = kind;
		p.value = value;
		p.attracted = false;
		p.speed = 0;
		p.bob = Math.random() * Math.PI * 2;
		return p;
	}

	forEachActive(fn: (p: Pickup) => void): void {
		for (const child of this.group.getChildren()) {
			const p = child as Pickup;
			if (p.active) fn(p);
		}
	}

	/**
	 * Moves attracted pickups toward the player and collects the ones touching it.
	 * `magnetRadius` is the Pickup Range stat.
	 */
	update(dt: number, magnetRadius: number): void {
		const px = this.player.x;
		const py = this.player.y;
		this.forEachActive((p) => {
			const dx = px - p.x;
			const dy = py - p.y;
			const d = Math.hypot(dx, dy);
			if (d <= COLLECT_RADIUS) {
				this.collect(p);
				return;
			}
			if (!p.attracted && d <= magnetRadius) p.attracted = true;
			if (p.attracted) {
				p.speed = Math.min(p.speed + 600 * dt, 420);
				p.x += (dx / d) * p.speed * dt;
				p.y += (dy / d) * p.speed * dt;
			}
		});
	}

	/** Pulls every gold coin to the player (end of wave). */
	attractAll(kind: PickupKind = 'gold'): void {
		this.forEachActive((p) => {
			if (p.kind === kind) p.attracted = true;
		});
	}

	/** Collects everything immediately (used when leaving the arena). */
	collectAll(): void {
		this.forEachActive((p) => this.collect(p));
	}

	get activeCount(): number {
		return this.group.countActive(true);
	}

	private collect(p: Pickup): void {
		p.setActive(false).setVisible(false);
		this.onCollect?.(p.kind, p.value);
	}
}
