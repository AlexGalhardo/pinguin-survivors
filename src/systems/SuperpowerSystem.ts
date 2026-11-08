import type Phaser from 'phaser';
import { KEYS, SUPER_FX_FRAMES } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { shake } from '../core/feel';
import { SUPER, SUPERPOWERS, type SuperpowerDef } from '../data/superpowers';
import type { Enemy } from '../entities/Enemy';
import type { Element } from '../logic/combat';
import { depthOf, screenToWorld, worldToScreen } from '../logic/projection';
import type { Rng } from '../logic/rng';
import type { SpatialGrid } from '../logic/spatial-grid';
import type { PlayerStats } from '../logic/stats';
import { applyBleed, applyBurn, applyEarth, applyIce } from '../logic/status';
import type { ActiveWeapon } from '../logic/weapons';
import type { AreaSystem } from './AreaSystem';

const CATACLYSM_ELEMENTS: readonly Element[] = ['fire', 'ice', 'earth', 'energy'];
const ELEMENT_COLOR: Record<Element, number> = {
	fire: PALETTE.elFire,
	ice: PALETTE.elIce,
	earth: PALETTE.elEarth,
	energy: PALETTE.elEnergy,
};

/** Base hit when the hero has no weapon at all (everything sold). */
const FALLBACK_HIT = 10;

/**
 * The three superpowers (P-39): Red Harvest (Jack), Carpet Bombing (Bob) and Elemental
 * Cataclysm (Lucia). VFX are placeholders until the PixelLab effects (phase 3.5).
 */
export class SuperpowerSystem {
	active = false;
	private def!: SuperpowerDef;
	private time = 0;
	private tick = 0;
	private bombsLeft = 0;
	private elementIndex = 0;
	/** Kills while the current cast is active (Overkill achievement). */
	killsThisCast = 0;
	private readonly scratch: Enemy[] = [];
	/** Looping effect sprite that follows the hero while the cast lasts (when the art exists). */
	private vfx: Phaser.GameObjects.Sprite | null = null;

	constructor(
		private readonly rng: Rng,
		private readonly stats: PlayerStats,
		private readonly area: AreaSystem,
		private readonly hitFn: (enemy: Enemy, amount: number, element?: Element) => void,
	) {}

	/** Damage of the lead weapon's attack (all pellets), the base of every superpower. */
	private weaponHit(weapon: ActiveWeapon | null): number {
		if (!weapon) return FALLBACK_HIT * this.stats.damage;
		return weapon.damage * weapon.count * this.stats.tagMul[weapon.tag] * this.stats.damage;
	}

	cast(heroId: keyof typeof SUPERPOWERS, hx: number, hy: number, scene: Phaser.Scene): void {
		this.def = SUPERPOWERS[heroId];
		this.active = true;
		this.time = this.def.duration;
		this.tick = 0;
		this.killsThisCast = 0;
		this.bombsLeft = this.def.explosions ?? 0;
		shake(scene, 250, 0.006);
		this.startVfx(heroId, scene, hx, hy);
		this.area.flash(
			hx,
			hy,
			this.def.radius,
			heroId === 'jack'
				? PALETTE.blood
				: heroId === 'bob'
					? PALETTE.auraOrange
					: PALETTE.lucia,
			0.5,
		);
	}

	update(
		dt: number,
		hx: number,
		hy: number,
		grid: SpatialGrid<Enemy>,
		weapon: ActiveWeapon | null,
		view: { width: number; height: number },
	): void {
		if (!this.active) return;
		this.time -= dt;
		this.tick -= dt;
		const def = this.def;
		const base = this.weaponHit(weapon) * def.damageMul;
		if (def.hero === 'bob') {
			// Bombs are spread evenly over the duration across the visible screen.
			const interval = def.duration / (def.explosions ?? 1);
			while (this.bombsLeft > 0 && this.tick <= 0) {
				this.tick += interval;
				this.bombsLeft--;
				const off = screenToWorld(
					this.rng.range(-view.width / 2, view.width / 2) * 0.9,
					this.rng.range(-view.height / 2, view.height / 2) * 0.9,
				);
				this.area.impact(
					hx + off.x,
					hy + off.y,
					def.radius,
					0.45,
					base,
					KEYS.projectile('grenade'),
					{
						element: 'fire',
						tint: PALETTE.auraOrange,
					},
				);
			}
		} else if (this.tick <= 0) {
			this.tick = SUPER.tick;
			this.scratch.length = 0;
			grid.queryRadius(hx, hy, def.radius, this.scratch);
			const element =
				def.hero === 'lucia'
					? (CATACLYSM_ELEMENTS[
							this.elementIndex++ % CATACLYSM_ELEMENTS.length
						] as Element)
					: undefined;
			for (const e of this.scratch) {
				if (!e.alive) continue;
				if (def.hero === 'jack') {
					for (let i = 0; i < 5; i++) applyBleed(e.status, base);
				} else if (element === 'fire') applyBurn(e.status, base);
				else if (element === 'ice') applyIce(e.status);
				else if (element === 'earth') applyEarth(e.status, 0);
				this.hitFn(e, base, element);
			}
			this.area.flash(
				hx,
				hy,
				def.radius,
				element ? ELEMENT_COLOR[element] : PALETTE.blood,
				SUPER.tick,
			);
		}
		if (def.pull) {
			this.scratch.length = 0;
			grid.queryRadius(hx, hy, def.radius * 1.4, this.scratch);
			for (const e of this.scratch) {
				if (!e.alive || e.def.behavior === 'boss') continue;
				const dx = hx - e.x;
				const dy = hy - e.y;
				const d = Math.hypot(dx, dy) || 1;
				e.x += (dx / d) * def.pull * dt;
				e.y += (dy / d) * def.pull * dt;
			}
		}
		this.followVfx(hx, hy);
		if (this.time <= 0) {
			this.active = false;
			this.vfx?.destroy();
			this.vfx = null;
		}
	}

	/** `fx.super.<hero>` loop sized to the power radius; code-drawn flash only when the art is missing. */
	private startVfx(hero: string, scene: Phaser.Scene, hx: number, hy: number): void {
		this.vfx?.destroy();
		this.vfx = null;
		const first = KEYS.superFx(hero, 0);
		if (!scene.textures.exists(first)) return;
		const animKey = `fx.super.${hero}`;
		if (!scene.anims.exists(animKey)) {
			scene.anims.create({
				key: animKey,
				frames: Array.from({ length: SUPER_FX_FRAMES }, (_, i) => ({
					key: KEYS.superFx(hero, i),
				})),
				frameRate: 18,
				repeat: -1,
			});
		}
		const size = scene.textures.getFrame(first).width;
		this.vfx = scene.add
			.sprite(0, 0, first)
			.setScale((this.def.radius * 2) / size)
			.setAlpha(0.8)
			.play(animKey);
		this.followVfx(hx, hy);
	}

	private followVfx(hx: number, hy: number): void {
		if (!this.vfx) return;
		const s = worldToScreen(hx, hy, 0);
		this.vfx.setPosition(Math.round(s.x), Math.round(s.y)).setDepth(depthOf(hx, hy) - 1);
	}
}
