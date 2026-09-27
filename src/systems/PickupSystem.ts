import type Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { ECONOMY } from '../data/economy';
import { DROPS, GEAR_BY_ID, type GearRarity } from '../data/equipment';
import { isoDepth, worldToScreen } from '../logic/iso';

/** heal: value = share of max HP; gear: value unused, `gearId` names the item. */
export type PickupKind = 'xp' | 'fish' | 'meat' | 'heal' | 'gear';

interface Pickup {
	sprite: Phaser.GameObjects.Image;
	glow: Phaser.GameObjects.Image | null;
	kind: PickupKind;
	value: number;
	gearId: string | null;
	x: number;
	y: number;
	magnet: boolean;
	alive: boolean;
	bob: number;
	life: number;
}

const MAX_PICKUPS = 500;
/** Gear must be walked over (no magnet), a little more generous than orbs. */
const GEAR_COLLECT_RADIUS = 22;

export const RARITY_TINT: Record<GearRarity, number> = {
	common: PALETTE.rarityCommon,
	rare: PALETTE.rarityRare,
	legendary: PALETTE.rarityLegendary,
};

/**
 * XP orbs, Fish, meat and health packs on the ground (pulled in by the hero's pickup range) and
 * equipment drops, which blink on the ground Diablo-style until the hero steps on them.
 */
export class PickupSystem {
	private readonly items: Pickup[] = [];
	private vacuum = false;
	private time = 0;

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly onCollect: (
			kind: PickupKind,
			value: number,
			gearId: string | null,
		) => void,
	) {}

	drop(
		kind: PickupKind,
		value: number,
		x: number,
		y: number,
		gearId: string | null = null,
	): void {
		let p = this.items.find((i) => !i.alive);
		if (!p) {
			if (this.items.length >= MAX_PICKUPS) {
				// Full: merge XP into the oldest orb instead of losing it.
				const orb = this.items.find((i) => i.alive && i.kind === kind && kind === 'xp');
				if (orb) orb.value += value;
				if (kind !== 'gear') return;
				// Gear is never lost: recycle the oldest XP orb slot.
				p = this.items.find((i) => i.alive && i.kind === 'xp');
				if (!p) return;
			} else {
				p = {
					sprite: this.scene.add.image(0, 0, KEYS.pickup('xp')),
					glow: null,
					kind,
					value: 0,
					gearId: null,
					x: 0,
					y: 0,
					magnet: false,
					alive: false,
					bob: 0,
					life: 0,
				};
				this.items.push(p);
			}
		}
		p.kind = kind;
		p.value = value;
		p.gearId = gearId;
		p.x = x;
		p.y = y;
		p.magnet = false;
		p.alive = true;
		p.bob = Math.random() * Math.PI * 2;
		p.life = kind === 'gear' ? DROPS.gearLifetime : Number.POSITIVE_INFINITY;
		p.sprite
			.setTexture(this.textureOf(kind, value, gearId))
			.setVisible(true)
			.setAlpha(1);
		if (kind === 'gear') {
			const def = gearId ? GEAR_BY_ID[gearId] : undefined;
			if (!p.glow) p.glow = this.scene.add.image(0, 0, KEYS.gearGlow);
			p.glow.setTint(RARITY_TINT[def?.rarity ?? 'common']).setVisible(true);
		} else p.glow?.setVisible(false);
	}

	private textureOf(kind: PickupKind, value: number, gearId: string | null): string {
		if (kind === 'heal') return KEYS.healPack(Math.round(value * 100));
		if (kind === 'gear' && gearId) return KEYS.gear(gearId);
		return KEYS.pickup(kind === 'gear' ? 'xp' : kind);
	}

	private collect(p: Pickup): void {
		p.alive = false;
		p.sprite.setVisible(false);
		p.glow?.setVisible(false);
		this.onCollect(p.kind, p.value, p.gearId);
	}

	/** End of round: everything on the ground is collected at once (gear included). */
	collectAll(): void {
		for (const p of this.items) if (p.alive) this.collect(p);
	}

	/** Pulls every pickup towards the hero (magnet effect). */
	attractAll(): void {
		this.vacuum = true;
	}

	update(dt: number, hx: number, hy: number, pickupRange: number): void {
		this.time += dt;
		let any = false;
		for (const p of this.items) {
			if (!p.alive) continue;
			any = true;
			const dx = hx - p.x;
			const dy = hy - p.y;
			const d = Math.hypot(dx, dy);
			if (p.kind === 'gear') {
				this.updateGear(p, dt, d);
				continue;
			}
			if (d < ECONOMY.collectRadius) {
				this.collect(p);
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

	/** Blinking glow on the ground until stepped on; fades out at the end of its life. */
	private updateGear(p: Pickup, dt: number, dist: number): void {
		if (dist < GEAR_COLLECT_RADIUS) {
			this.collect(p);
			return;
		}
		p.life -= dt;
		if (p.life <= 0) {
			p.alive = false;
			p.sprite.setVisible(false);
			p.glow?.setVisible(false);
			return;
		}
		const blink = 0.55 + 0.45 * Math.abs(Math.sin(this.time * 4 + p.bob));
		const fade = Math.min(1, p.life / 3);
		const ground = worldToScreen(p.x, p.y);
		const depth = isoDepth(p.x, p.y);
		p.glow
			?.setPosition(Math.round(ground.x), Math.round(ground.y))
			.setAlpha(blink * fade * 0.9)
			.setScale(0.9 + 0.15 * blink)
			.setDepth(depth - 1.5);
		const s = worldToScreen(p.x, p.y, 8 + Math.sin(this.time * 3 + p.bob) * 2);
		p.sprite.setPosition(Math.round(s.x), Math.round(s.y)).setAlpha(fade).setDepth(depth);
	}
}
