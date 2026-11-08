import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { weaponArt } from '../art/weapon-art';
import { rarityColor } from '../config/palette';
import { COMBAT_FX } from '../data/combat-fx';
import { ECONOMY } from '../data/economy';
import { DROPS, GEAR_BY_ID } from '../data/equipment';
import { LEGACY_GEAR_RARITY, type Rarity, weaponVisualTier } from '../data/rarity';
import type { ItemDrop } from '../logic/equipment';
import { depthOf, worldToScreen } from '../logic/projection';

/** heal: value = share of max HP; gear: value unused, `gearId` names the item. */
export type PickupKind = 'xp' | 'fish' | 'meat' | 'heal' | 'gear';

interface Pickup {
	sprite: Phaser.GameObjects.Image;
	glow: Phaser.GameObjects.Image | null;
	/** Short light beam over a gear drop. */
	beam: Phaser.GameObjects.Image | null;
	/** Edge-of-screen pointer while the drop is out of view. */
	arrow: Phaser.GameObjects.Image | null;
	kind: PickupKind;
	value: number;
	gearId: string | null;
	/** Rarity IV/V drop: weapon or equipment with its rolled affixes (ADR-017). */
	item: ItemDrop | null;
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

const BEAM_KEY = 'fx.dropBeam';
const ARROW_KEY = 'fx.dropArrow';

/**
 * The one place that maps a gear drop to its highlight color (glow, beam, edge arrow): the rarity
 * I–V color from `config/palette`. Items without a roll read as their catalog rarity (I/II/III).
 */
export function dropColor(gearId: string | null, rarity?: Rarity): number {
	if (rarity) return rarityColor(rarity);
	const def = gearId ? GEAR_BY_ID[gearId] : undefined;
	return rarityColor(rarity ?? (def ? LEGACY_GEAR_RARITY[def.rarity] : 1));
}

/** Soft vertical beam (opaque at the foot) and a small pointer triangle, drawn once. */
function ensureDropTextures(scene: Phaser.Scene): void {
	if (!scene.textures.exists(BEAM_KEY)) {
		const c = scene.textures.createCanvas(BEAM_KEY, 8, 64);
		const ctx = c?.getContext();
		if (c && ctx) {
			const g = ctx.createLinearGradient(0, 64, 0, 0);
			g.addColorStop(0, 'rgba(255,255,255,0.9)');
			g.addColorStop(1, 'rgba(255,255,255,0)');
			ctx.fillStyle = g;
			ctx.fillRect(1, 0, 6, 64);
			c.refresh();
		}
	}
	if (!scene.textures.exists(ARROW_KEY)) {
		const c = scene.textures.createCanvas(ARROW_KEY, 16, 16);
		const ctx = c?.getContext();
		if (c && ctx) {
			ctx.beginPath();
			ctx.moveTo(15, 8);
			ctx.lineTo(1, 1);
			ctx.lineTo(4, 8);
			ctx.lineTo(1, 15);
			ctx.closePath();
			// Dark outline so the pointer reads on snow as well as on dark ground.
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#0b1020';
			ctx.stroke();
			ctx.fillStyle = '#ffffff';
			ctx.fill();
			c.refresh();
		}
	}
}

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
			item: ItemDrop | null,
		) => void,
	) {
		ensureDropTextures(scene);
	}

	drop(
		kind: PickupKind,
		value: number,
		x: number,
		y: number,
		gearId: string | null = null,
		item: ItemDrop | null = null,
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
					beam: null,
					arrow: null,
					kind,
					value: 0,
					gearId: null,
					item: null,
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
		p.item = item;
		p.x = x;
		p.y = y;
		p.magnet = false;
		p.alive = true;
		p.bob = Math.random() * Math.PI * 2;
		p.life = kind === 'gear' ? DROPS.gearLifetime : Number.POSITIVE_INFINITY;
		p.sprite
			.setTexture(this.textureOf(kind, value, gearId, item))
			.setVisible(true)
			.setAlpha(1);
		if (kind === 'gear') {
			const color = dropColor(gearId, item?.rarity);
			if (!p.glow) p.glow = this.scene.add.image(0, 0, KEYS.gearGlow);
			p.glow.setTint(color).setVisible(true);
			if (!p.beam)
				p.beam = this.scene.add
					.image(0, 0, BEAM_KEY)
					.setOrigin(0.5, 1)
					.setBlendMode(Phaser.BlendModes.ADD);
			p.beam.setTint(color).setVisible(true);
			if (!p.arrow) p.arrow = this.scene.add.image(0, 0, ARROW_KEY).setDepth(1e9 - 2);
			p.arrow.setTint(color).setVisible(false);
		} else this.hideGear(p);
	}

	private textureOf(
		kind: PickupKind,
		value: number,
		gearId: string | null,
		item: ItemDrop | null,
	): string {
		if (kind === 'heal') return KEYS.healPack(Math.round(value * 100));
		if (kind === 'gear' && item?.kind === 'weapon')
			return weaponArt(this.scene.textures, item.id, weaponVisualTier(item.rarity)).key;
		if (kind === 'gear' && gearId) return KEYS.gear(gearId);
		return KEYS.pickup(kind === 'gear' ? 'xp' : kind);
	}

	private collect(p: Pickup): void {
		p.alive = false;
		p.sprite.setVisible(false);
		this.hideGear(p);
		this.onCollect(p.kind, p.value, p.gearId, p.item);
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
				this.updateGear(p, dt, d, hx, hy);
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
			p.sprite.setPosition(Math.round(s.x), Math.round(s.y)).setDepth(depthOf(p.x, p.y) - 1);
		}
		if (!any) this.vacuum = false;
	}

	private hideGear(p: Pickup): void {
		p.glow?.setVisible(false);
		p.beam?.setVisible(false);
		p.arrow?.setVisible(false);
	}

	/** Arrow on the screen edge pointing at a gear drop the camera cannot see. */
	private pointAt(
		p: Pickup,
		gx: number,
		gy: number,
		hx: number,
		hy: number,
		alpha: number,
	): void {
		const arrow = p.arrow;
		if (!arrow) return;
		const view = this.scene.cameras.main.worldView;
		const m = COMBAT_FX.drop.arrowMargin;
		const inside =
			gx > view.x + m && gx < view.right - m && gy > view.y + m && gy < view.bottom - m;
		if (inside) {
			arrow.setVisible(false);
			return;
		}
		const hero = worldToScreen(hx, hy);
		const dx = gx - hero.x;
		const dy = gy - hero.y;
		// Where the hero-to-drop ray leaves the inset view rectangle.
		const k = Math.min(
			dx === 0
				? Number.POSITIVE_INFINITY
				: (dx > 0 ? view.right - m - hero.x : view.x + m - hero.x) / dx,
			dy === 0
				? Number.POSITIVE_INFINITY
				: (dy > 0 ? view.bottom - m - hero.y : view.y + m - hero.y) / dy,
		);
		arrow
			.setPosition(hero.x + dx * k, hero.y + dy * k)
			.setRotation(Math.atan2(dy, dx))
			.setScale(COMBAT_FX.drop.arrowSize / 16 / this.scene.cameras.main.zoom)
			.setAlpha(0.6 + 0.4 * alpha)
			.setVisible(true);
	}

	/** Blinking glow on the ground until stepped on; fades out at the end of its life. */
	private updateGear(p: Pickup, dt: number, dist: number, hx: number, hy: number): void {
		if (dist < GEAR_COLLECT_RADIUS) {
			this.collect(p);
			return;
		}
		p.life -= dt;
		if (p.life <= 0) {
			p.alive = false;
			p.sprite.setVisible(false);
			this.hideGear(p);
			return;
		}
		const blink =
			0.55 + 0.45 * Math.abs(Math.sin((this.time * Math.PI) / COMBAT_FX.drop.pulse + p.bob));
		const fade = Math.min(1, p.life / 3);
		const ground = worldToScreen(p.x, p.y);
		const depth = depthOf(p.x, p.y);
		p.glow
			?.setPosition(Math.round(ground.x), Math.round(ground.y))
			.setAlpha(blink * fade * 0.9)
			.setScale(0.9 + 0.15 * blink)
			.setDepth(depth - 1.5);
		p.beam
			?.setPosition(Math.round(ground.x), Math.round(ground.y))
			.setScale(2, (COMBAT_FX.drop.beam / 64) * (0.8 + 0.4 * blink))
			.setAlpha(blink * fade * 0.7)
			.setDepth(depth - 1.4);
		this.pointAt(p, ground.x, ground.y, hx, hy, blink * fade);
		const s = worldToScreen(p.x, p.y, 8 + Math.sin(this.time * 3 + p.bob) * 2);
		p.sprite.setPosition(Math.round(s.x), Math.round(s.y)).setAlpha(fade).setDepth(depth);
	}
}
