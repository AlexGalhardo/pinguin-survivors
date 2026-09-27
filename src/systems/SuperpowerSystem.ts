import type Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { SUPER, SUPERPOWERS, type SuperpowerDef } from '../data/superpowers';
import type { SignatureWeapon } from '../data/weapons';
import type { Enemy } from '../entities/Enemy';
import type { Element } from '../logic/combat';
import { screenToWorld } from '../logic/iso';
import type { Rng } from '../logic/rng';
import type { SpatialGrid } from '../logic/spatial-grid';
import type { PlayerStats } from '../logic/stats';
import { applyBleed, applyBurn, applyEarth, applyIce } from '../logic/status';
import type { AreaSystem } from './AreaSystem';

const CATACLYSM_ELEMENTS: readonly Element[] = ['fire', 'ice', 'earth', 'energy'];
const ELEMENT_COLOR: Record<Element, number> = {
	fire: PALETTE.elFire,
	ice: PALETTE.elIce,
	earth: PALETTE.elEarth,
	energy: PALETTE.elEnergy,
};

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

	constructor(
		private readonly rng: Rng,
		private readonly stats: PlayerStats,
		private readonly area: AreaSystem,
		private readonly hitFn: (enemy: Enemy, amount: number, element?: Element) => void,
	) {}

	/** Damage of one signature attack (all pellets), the base of every superpower. */
	private weaponHit(weapon: SignatureWeapon): number {
		return (
			weapon.damage * (weapon.count ?? 1) * this.stats.tagMul[weapon.tag] * this.stats.damage
		);
	}

	cast(heroId: keyof typeof SUPERPOWERS, hx: number, hy: number, scene: Phaser.Scene): void {
		this.def = SUPERPOWERS[heroId];
		this.active = true;
		this.time = this.def.duration;
		this.tick = 0;
		this.killsThisCast = 0;
		this.bombsLeft = this.def.explosions ?? 0;
		scene.cameras.main.shake(250, 0.006);
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
		weapon: SignatureWeapon,
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
		if (this.time <= 0) this.active = false;
	}
}
