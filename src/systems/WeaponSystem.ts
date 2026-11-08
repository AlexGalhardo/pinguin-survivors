import { KEYS } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { weaponColor } from '../data/weapons';
import type { Enemy } from '../entities/Enemy';
import type { Build } from '../logic/build';
import { type Element, rollOutgoing } from '../logic/combat';
import { inArc, spreadAngles } from '../logic/geometry';
import type { Rng } from '../logic/rng';
import type { SpatialGrid } from '../logic/spatial-grid';
import type { PlayerStats } from '../logic/stats';
import { type ActiveWeapon, isDirect, resolveWeapon } from '../logic/weapons';
import type { ProjectilePool } from './ProjectilePool';
import { pickTarget } from './targeting';

const ELEMENTS: readonly Element[] = ['fire', 'ice', 'earth', 'energy'];
export const ELEMENT_TINT: Record<Element, number> = {
	fire: PALETTE.elFire,
	ice: PALETTE.elIce,
	earth: PALETTE.elEarth,
	energy: PALETTE.elEnergy,
};

export type MeleeHit = (
	enemy: Enemy,
	amount: number,
	crit: boolean,
	bleedChance: number,
	color: number | undefined,
) => void;

/** Per-frame modifiers from hero perks (docs/gdd.md §5.1). */
export interface WeaponBonus {
	/** Extra attack-rate multiplier (Bloodlust, Run and Gun, Quick Reload). */
	rate: number;
	/** Next attack is a guaranteed critical hit (Reflex). */
	forceCrit: boolean;
	/** Extra damage multiplier (Elemental Attunement). */
	damage: number;
	/** Firearm projectile bounces (Ricochet). */
	bounces: number;
	/** Arcane Echo: every Nth projectile volley repeats one projectile (0 = off). */
	echoEvery: number;
}

interface SlotState {
	id: string;
	tier: number;
	cooldown: number;
}

/** Fires the weapons that attack by themselves (arc, spread, bolt), one timer per slot. */
export class WeaponSystem {
	private readonly states: SlotState[] = [];
	private elementIndex = 0;
	private volleys = 0;
	private readonly scratch: Enemy[] = [];
	readonly bonus: WeaponBonus = {
		rate: 1,
		forceCrit: false,
		damage: 1,
		bounces: 0,
		echoEvery: 0,
	};

	constructor(
		private readonly rng: Rng,
		private readonly stats: PlayerStats,
		private readonly build: Build,
		private readonly pool: ProjectilePool,
		private readonly onMelee: MeleeHit,
		private readonly onSlash: (x: number, y: number, angle: number, range: number) => void,
		private readonly onElement: (element: Element) => void,
		private readonly onFire: (slot: number, angle: number, cooldown: number) => void = () => {},
	) {}

	update(dt: number, hx: number, hy: number, grid: SpatialGrid<Enemy>): void {
		const slots = this.build.weapons;
		this.states.length = slots.length;
		for (let i = 0; i < slots.length; i++) {
			const w = resolveWeapon(slots[i] as (typeof slots)[number]);
			let st = this.states[i];
			if (!st || st.id !== w.id || st.tier !== w.tier) {
				st = { id: w.id, tier: w.tier, cooldown: 0 };
				this.states[i] = st;
			}
			if (!isDirect(w)) continue;
			st.cooldown -= dt;
			if (st.cooldown > 0) continue;
			const target = pickTarget(grid, hx, hy, w.range);
			if (!target) continue;
			const angle = Math.atan2(target.y - hy, target.x - hx);
			this.fire(w, hx, hy, angle, grid);
			st.cooldown = w.cooldown / (this.stats.attackSpeed * this.bonus.rate);
			this.onFire(i, angle, st.cooldown);
		}
	}

	private fire(
		w: ActiveWeapon,
		hx: number,
		hy: number,
		angle: number,
		grid: SpatialGrid<Enemy>,
	): void {
		const attack = {
			base: w.damage,
			tag: w.tag,
			multiplier: this.stats.tagMul[w.tag] * this.stats.damage * this.bonus.damage,
			critChance: this.bonus.forceCrit ? 1 : this.stats.crit,
			critDamage: this.stats.critDamage,
		};
		this.bonus.forceCrit = false;
		if (w.behavior === 'arc') {
			const range = w.range * this.stats.area;
			const arc = (w.angle * Math.PI) / 180;
			this.scratch.length = 0;
			grid.queryRadius(hx, hy, range + 40, this.scratch);
			for (const e of this.scratch) {
				if (!e.alive || !inArc(hx, hy, angle, arc, range, e.x, e.y, e.radius)) continue;
				const out = rollOutgoing(attack, { crit: this.rng.next() });
				this.onMelee(e, out.amount, out.crit, w.bleedChance, weaponColor(w.id));
			}
			this.onSlash(hx, hy, angle, range);
			return;
		}
		const spread = w.behavior === 'spread';
		const count = spread ? w.count : 1;
		const step = spread ? (w.angle * Math.PI) / 180 / Math.max(1, count - 1) : 0;
		const element =
			w.behavior === 'bolt' ? ELEMENTS[this.elementIndex++ % ELEMENTS.length] : undefined;
		if (element) this.onElement(element);
		const angles = spreadAngles(angle, count, step);
		const echo = this.bonus.echoEvery > 0 && ++this.volleys % this.bonus.echoEvery === 0;
		if (echo) angles.push(angle);
		for (const a of angles) {
			const out = rollOutgoing(attack, { crit: this.rng.next() });
			this.pool.spawn({
				x: hx,
				y: hy,
				angle: a,
				speed: w.projectileSpeed,
				range: w.range,
				damage: out.amount,
				crit: out.crit,
				texture: KEYS.projectile(element ? 'orb' : 'pellet'),
				tint: element ? ELEMENT_TINT[element] : weaponColor(w.id),
				color: weaponColor(w.id),
				pierce: w.pierce,
				bounces: w.tag === 'firearm' ? this.bonus.bounces : 0,
				element,
				bleedChance: w.bleedChance,
			});
		}
	}
}
