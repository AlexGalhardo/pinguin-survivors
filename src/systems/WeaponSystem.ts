import { KEYS } from '../art/manifest';
import { PALETTE } from '../config/palette';
import type { SignatureWeapon } from '../data/weapons';
import type { Enemy } from '../entities/Enemy';
import { type Element, rollOutgoing } from '../logic/combat';
import { inArc, spreadAngles } from '../logic/geometry';
import type { Rng } from '../logic/rng';
import type { SpatialGrid } from '../logic/spatial-grid';
import type { PlayerStats } from '../logic/stats';
import type { ProjectilePool } from './ProjectilePool';

/** Melee aims at enemies a bit beyond the blade so the hero swings as they close in. */
/** Melee only swings at targets it can reach (a wider aim wasted swings on far enemies). */
const MELEE_AIM_FACTOR = 1;
const ELEMENTS: readonly Element[] = ['fire', 'ice', 'earth', 'energy'];
export const ELEMENT_TINT: Record<Element, number> = {
	fire: PALETTE.elFire,
	ice: PALETTE.elIce,
	earth: PALETTE.elEarth,
	energy: PALETTE.elEnergy,
};

export type MeleeHit = (enemy: Enemy, amount: number, crit: boolean, bleedChance: number) => void;

/** Per-frame modifiers from hero perks (docs/game-design.md §5.1). */
export interface WeaponBonus {
	/** Extra attack-rate multiplier (Bloodlust, Run and Gun). */
	rate: number;
	/** Next attack is a guaranteed critical hit (Reflex). */
	forceCrit: boolean;
	/** Extra damage multiplier (Elemental Attunement). */
	damage: number;
	/** Firearm projectile bounces (Ricochet). */
	bounces: number;
}

/** Fires the hero's signature weapon automatically (P-18/P-19). */
export class WeaponSystem {
	private cooldown = 0;
	private elementIndex = 0;
	private readonly scratch: Enemy[] = [];
	readonly bonus: WeaponBonus = { rate: 1, forceCrit: false, damage: 1, bounces: 0 };

	constructor(
		private readonly rng: Rng,
		private readonly stats: PlayerStats,
		public weapon: SignatureWeapon,
		private readonly pool: ProjectilePool,
		private readonly onMelee: MeleeHit,
		private readonly onSlash: (
			x: number,
			y: number,
			screenAngle: number,
			range: number,
		) => void,
		private readonly onElement: (element: Element) => void,
		private readonly onFire: (angle: number, cooldown: number) => void = () => {},
	) {}

	update(dt: number, hx: number, hy: number, grid: SpatialGrid<Enemy>): void {
		this.cooldown -= dt;
		if (this.cooldown > 0) return;
		const aimRange =
			this.weapon.kind === 'arc' ? this.weapon.range * MELEE_AIM_FACTOR : this.weapon.range;
		// Bosses and elites in range come first, so they don't hide behind the horde.
		const target =
			grid.nearest(
				hx,
				hy,
				aimRange,
				(e) => e.alive && (e.elite !== null || e.def.behavior === 'boss'),
			) ?? grid.nearest(hx, hy, aimRange, (e) => e.alive);
		if (!target) return;
		const angle = Math.atan2(target.y - hy, target.x - hx);
		this.fire(hx, hy, angle, grid);
		this.cooldown = 1 / (this.weapon.rate * this.stats.attackSpeed * this.bonus.rate);
		this.onFire(angle, this.cooldown);
	}

	private fire(hx: number, hy: number, angle: number, grid: SpatialGrid<Enemy>): void {
		const w = this.weapon;
		const attack = {
			base: w.damage,
			tag: w.tag,
			multiplier: this.stats.tagMul[w.tag] * this.stats.damage * this.bonus.damage,
			critChance: this.bonus.forceCrit ? 1 : this.stats.crit,
			critDamage: this.stats.critDamage,
		};
		this.bonus.forceCrit = false;
		if (w.kind === 'arc') {
			const range = w.range * this.stats.area;
			const arc = ((w.angle ?? 90) * Math.PI) / 180;
			this.scratch.length = 0;
			grid.queryRadius(hx, hy, range + 40, this.scratch);
			for (const e of this.scratch) {
				if (!e.alive || !inArc(hx, hy, angle, arc, range, e.x, e.y, e.radius)) continue;
				const out = rollOutgoing(attack, { crit: this.rng.next() });
				this.onMelee(e, out.amount, out.crit, w.bleedChance ?? 0);
			}
			const c = Math.cos(angle);
			const s = Math.sin(angle);
			this.onSlash(hx, hy, Math.atan2((c + s) / 2, c - s), range);
			return;
		}
		const count = w.kind === 'spread' ? (w.count ?? 1) : 1;
		const step =
			w.kind === 'spread' ? ((w.angle ?? 30) * Math.PI) / 180 / Math.max(1, count - 1) : 0;
		const element =
			w.kind === 'bolt' ? ELEMENTS[this.elementIndex++ % ELEMENTS.length] : undefined;
		if (element) this.onElement(element);
		for (const a of spreadAngles(angle, count, step)) {
			const out = rollOutgoing(attack, { crit: this.rng.next() });
			this.pool.spawn({
				x: hx,
				y: hy,
				angle: a,
				speed: w.projectileSpeed ?? 400,
				range: w.range,
				damage: out.amount,
				crit: out.crit,
				texture: KEYS.projectile(element ? 'orb' : 'pellet'),
				tint: element ? ELEMENT_TINT[element] : PALETTE.crit,
				pierce: w.pierce ?? 0,
				bounces: w.tag === 'firearm' ? this.bonus.bounces : 0,
				element,
				bleedChance: w.bleedChance ?? 0,
			});
		}
	}
}
