import type Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { STATUS } from '../data/combat';
import {
	DEPLOYABLES,
	levelScale,
	SECONDARIES,
	type SecondaryDef,
	type SecondaryId,
} from '../data/secondaries';
import type { Enemy } from '../entities/Enemy';
import { boomerangDistance } from '../logic/boomerang';
import type { Build } from '../logic/build';
import { type DamageTag, type Element, rollOutgoing } from '../logic/combat';
import { depthOf, worldToScreen } from '../logic/projection';
import type { Rng } from '../logic/rng';
import type { SpatialGrid } from '../logic/spatial-grid';
import type { PlayerStats } from '../logic/stats';
import { type ActiveWeapon, isDirect, resolveWeapon } from '../logic/weapons';
import type { AreaSystem } from './AreaSystem';
import type { ProjectilePool } from './ProjectilePool';
import { pickTarget } from './targeting';
import { ELEMENT_TINT, type WeaponBonus } from './WeaponSystem';

export type SecondaryHit = (
	enemy: Enemy,
	amount: number,
	crit: boolean,
	element: Element | undefined,
) => void;

/** What an activation needs, whether it comes from a weapon slot or a hero active. */
type ActBehavior = ActiveWeapon['behavior'] | 'stomp' | 'chain' | 'meteor' | 'nova';

interface Act {
	id: string;
	tag: DamageTag;
	behavior: ActBehavior;
	damage: number;
	cooldown: number;
	range: number;
	radius: number;
	count: number;
	element?: Element;
	pierce: number;
	duration: number;
}

interface OrbitState {
	angle: number;
	sprites: Phaser.GameObjects.Image[];
	/** Enemy → time left before this orbit can hit it again. */
	cooldowns: Map<Enemy, number>;
}

/** Per weapon-slot state; reset when the slot's weapon or tier changes. */
interface SlotState {
	id: string;
	tier: number;
	timer: number;
	orbit: OrbitState | null;
}

/** Hero actives (stomp, chain, meteor, nova) at a level: damage and counts scale with it. */
function activeAct(def: SecondaryDef, level: number): Act {
	return {
		id: def.id,
		tag: def.tag,
		behavior: def.behavior,
		damage: def.damage * levelScale(level),
		cooldown: def.cooldown,
		range: def.range,
		radius: def.radius ?? 0,
		count: (def.count ?? 1) + (def.countPerLevel ?? 0) * (level - 1),
		element: def.element,
		pierce: def.pierce ?? 0,
		duration: def.duration ?? 0,
	};
}

interface Boomerang {
	sprite: Phaser.GameObjects.Image;
	angle: number;
	t: number;
	range: number;
	amount: number;
	crit: boolean;
	hit: Set<Enemy>;
	returning: boolean;
	alive: boolean;
}

interface Deployable {
	sprite: Phaser.GameObjects.Image;
	x: number;
	y: number;
	/** Mines: arming delay; totems: time to the next zap. */
	timer: number;
	life: number;
	act: Act | null;
	alive: boolean;
}

const ORBIT_SPEED = 3;
const BOOMERANG_HIT = 14;
const ORBIT_HIT_RADIUS = 14;
const LOB_TIME = 0.55;
const METEOR_TIME = 0.7;

/** Secondary weapons and weapon-like exclusives from the build (docs/gdd.md §5.1, §9). */
export class SecondarySystem {
	private readonly timers = new Map<SecondaryId, number>();
	private readonly slots: SlotState[] = [];
	private readonly actives = new Map<string, Act>();
	private drone: Phaser.GameObjects.Image | null = null;
	private readonly droneAt = { x: 0, y: 0 };
	private readonly scratch: Enemy[] = [];
	private readonly lightning: Phaser.GameObjects.Graphics;
	private lightningLife = 0;
	/** Frost Nova is reactive (on hero hit), so it keeps its own cooldown. */
	private novaCooldown = 0;
	private readonly boomerangs: Boomerang[] = [];
	private readonly mines: Deployable[] = [];
	private readonly totems: Deployable[] = [];
	private auraRing: Phaser.GameObjects.Image | null = null;

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly rng: Rng,
		private readonly stats: PlayerStats,
		private readonly build: Build,
		private readonly pool: ProjectilePool,
		private readonly area: AreaSystem,
		private readonly onHit: SecondaryHit,
		private readonly bonus: WeaponBonus,
		/** Weapon in `slot` activated towards `angle` (ring animation). */
		private readonly onFire: (slot: number, angle: number, cooldown: number) => void = () => {},
	) {
		this.lightning = scene.add.graphics().setDepth(1e8);
	}

	/** Damage roll for an activation, with the hero's multipliers. */
	private roll(def: Act): { amount: number; crit: boolean } {
		return rollOutgoing(
			{
				base: def.damage,
				tag: def.tag,
				multiplier: this.stats.tagMul[def.tag] * this.stats.damage * this.bonus.damage,
				critChance: this.stats.crit,
				critDamage: this.stats.critDamage,
			},
			{ crit: this.rng.next() },
		);
	}

	update(dt: number, hx: number, hy: number, grid: SpatialGrid<Enemy>): void {
		this.novaCooldown -= dt;
		const rate = this.stats.attackSpeed * this.bonus.rate;
		const weapons = this.build.weapons;
		this.trimSlots(weapons.length);
		let aura: ActiveWeapon | null = null;
		let drone = false;
		for (let i = 0; i < weapons.length; i++) {
			const w = resolveWeapon(weapons[i] as (typeof weapons)[number]);
			let st = this.slots[i];
			if (!st || st.id !== w.id || st.tier !== w.tier) {
				if (st) this.dropOrbit(st);
				st = { id: w.id, tier: w.tier, timer: 0, orbit: null };
				this.slots[i] = st;
			}
			if (isDirect(w)) continue;
			if (w.behavior === 'orbit') {
				this.updateOrbit(st, w, dt, hx, hy, grid);
				continue;
			}
			if (w.behavior === 'aura') aura ??= w;
			if (w.behavior === 'follower') {
				drone = true;
				this.moveDrone(dt, hx, hy);
			}
			st.timer -= dt;
			if (st.timer > 0) continue;
			const fired = this.activate(w, hx, hy, grid);
			st.timer = fired ? w.cooldown / rate : 0.2;
			if (fired) {
				const target = pickTarget(grid, hx, hy, w.range);
				this.onFire(i, target ? Math.atan2(target.y - hy, target.x - hx) : 0, st.timer);
			}
		}
		if (!drone) this.drone?.setVisible(false);
		for (const [id, level] of Object.entries(this.build.secondaries) as [
			SecondaryId,
			number,
		][]) {
			const def: SecondaryDef = SECONDARIES[id];
			if (def.behavior === 'nova') continue;
			const act = this.activeOf(def, level);
			const left = (this.timers.get(id) ?? 0) - dt;
			if (left > 0) {
				this.timers.set(id, left);
				continue;
			}
			const fired = this.activate(act, hx, hy, grid);
			this.timers.set(id, fired ? def.cooldown / rate : 0.2);
		}
		this.updateBoomerangs(dt, hx, hy, grid);
		this.updateMines(dt, grid);
		this.updateTotems(dt, grid);
		this.syncAura(aura, hx, hy);
		if (this.lightningLife > 0) {
			this.lightningLife -= dt;
			if (this.lightningLife <= 0) this.lightning.clear();
		}
	}

	private activeOf(def: SecondaryDef, level: number): Act {
		const key = `${def.id}:${level}`;
		let act = this.actives.get(key);
		if (!act) {
			act = activeAct(def, level);
			this.actives.set(key, act);
		}
		return act;
	}

	private dropOrbit(st: SlotState): void {
		for (const img of st.orbit?.sprites ?? []) img.destroy();
		st.orbit = null;
	}

	private trimSlots(n: number): void {
		while (this.slots.length > n) this.dropOrbit(this.slots.pop() as SlotState);
	}

	/** Round end: mines, totems and boomerangs in flight disappear. */
	clear(): void {
		for (const b of this.boomerangs) this.retire(b);
		for (const d of [...this.mines, ...this.totems]) this.retire(d);
	}

	private retire(d: { alive: boolean; sprite: Phaser.GameObjects.Image }): void {
		d.alive = false;
		d.sprite.setVisible(false);
	}

	private updateBoomerangs(dt: number, hx: number, hy: number, grid: SpatialGrid<Enemy>): void {
		for (const b of this.boomerangs) {
			if (!b.alive) continue;
			b.t += dt;
			const d = boomerangDistance(b.t, b.range, DEPLOYABLES.boomerangSpeed);
			if (d < 0) {
				this.retire(b);
				continue;
			}
			// Enemies can be hit again on the way back.
			if (!b.returning && b.t > b.range / DEPLOYABLES.boomerangSpeed) {
				b.returning = true;
				b.hit.clear();
			}
			const x = hx + Math.cos(b.angle) * d;
			const y = hy + Math.sin(b.angle) * d;
			const s = worldToScreen(x, y, 14);
			b.sprite
				.setPosition(Math.round(s.x), Math.round(s.y))
				.setDepth(depthOf(x, y) + 0.5)
				.setRotation(b.t * 18);
			this.scratch.length = 0;
			grid.queryRadius(x, y, BOOMERANG_HIT + 20, this.scratch);
			for (const e of this.scratch) {
				if (!e.alive || b.hit.has(e)) continue;
				if ((e.x - x) ** 2 + (e.y - y) ** 2 > (BOOMERANG_HIT + e.radius) ** 2) continue;
				b.hit.add(e);
				this.onHit(e, b.amount, b.crit, undefined);
			}
		}
	}

	private updateMines(dt: number, grid: SpatialGrid<Enemy>): void {
		for (const m of this.mines) {
			if (!m.alive || !m.act) continue;
			m.life -= dt;
			m.timer -= dt;
			if (m.life <= 0) {
				this.retire(m);
				continue;
			}
			m.sprite.setAlpha(m.timer > 0 ? 0.5 : 1);
			if (m.timer > 0) continue;
			if (!grid.nearest(m.x, m.y, DEPLOYABLES.mineTrigger + 20, (e) => e.alive)) continue;
			const radius = m.act.radius * this.stats.area;
			const out = this.roll(m.act);
			this.area.burst(grid, m.x, m.y, radius, out.amount, undefined);
			this.area.flash(m.x, m.y, radius, PALETTE.auraOrange, 0.3);
			this.retire(m);
		}
	}

	private updateTotems(dt: number, grid: SpatialGrid<Enemy>): void {
		for (const t of this.totems) {
			if (!t.alive || !t.act) continue;
			t.life -= dt;
			t.timer -= dt;
			if (t.life <= 0) {
				this.retire(t);
				continue;
			}
			if (t.timer > 0) continue;
			const target = pickTarget(grid, t.x, t.y, t.act.range);
			if (!target) continue;
			t.timer = DEPLOYABLES.totemZap;
			const out = this.roll(t.act);
			if (this.lightningLife <= 0) this.lightning.clear();
			this.lightning.lineStyle(2, PALETTE.elEnergy, 1);
			this.drawBolt(t, target);
			this.lightningLife = 0.1;
			this.onHit(target, out.amount, out.crit, 'energy');
		}
	}

	private syncAura(aura: ActiveWeapon | null, hx: number, hy: number): void {
		if (!aura) {
			this.auraRing?.setVisible(false);
			return;
		}
		this.auraRing ??= this.scene.add.image(0, 0, KEYS.ring).setAlpha(0.35);
		const radius = aura.radius * this.stats.area;
		const s = worldToScreen(hx, hy);
		this.auraRing
			.setVisible(true)
			.setTint(aura.element ? ELEMENT_TINT[aura.element] : PALETTE.elFire)
			.setPosition(Math.round(s.x), Math.round(s.y))
			.setDisplaySize(radius * 2, radius * 2)
			.setDepth(depthOf(hx, hy) - 1);
	}

	private place(
		list: Deployable[],
		texture: string,
		at: { x: number; y: number },
		timer: number,
		life: number,
		act: Act,
	): void {
		let d = list.find((q) => !q.alive);
		if (!d) {
			d = {
				sprite: this.scene.add.image(0, 0, texture).setOrigin(0.5, 0.9),
				x: 0,
				y: 0,
				timer: 0,
				life: 0,
				act: null,
				alive: false,
			};
			list.push(d);
		}
		Object.assign(d, { x: at.x, y: at.y, timer, life, act, alive: true });
		const s = worldToScreen(at.x, at.y);
		d.sprite
			.setPosition(Math.round(s.x), Math.round(s.y))
			.setDepth(depthOf(at.x, at.y))
			.setAlpha(1)
			.setVisible(true);
	}

	private throwBoomerangs(def: Act, base: number): void {
		const count = def.count;
		for (let i = 0; i < count; i++) {
			const out = this.roll(def);
			let b = this.boomerangs.find((q) => !q.alive);
			if (!b) {
				b = {
					sprite: this.scene.add.image(0, 0, KEYS.projectile('fishBoomerang')),
					angle: 0,
					t: 0,
					range: 0,
					amount: 0,
					crit: false,
					hit: new Set(),
					returning: false,
					alive: false,
				};
				this.boomerangs.push(b);
			}
			b.hit.clear();
			Object.assign(b, {
				angle: base + (i - (count - 1) / 2) * 0.5,
				t: 0,
				range: def.range,
				amount: out.amount,
				crit: out.crit,
				returning: false,
				alive: true,
			});
			b.sprite.setVisible(true);
		}
	}

	private layMine(def: Act, hx: number, hy: number): void {
		const max = Math.min(DEPLOYABLES.maxMines, def.count);
		const live = this.mines.filter((m) => m.alive);
		// The oldest mine goes when the field is full.
		if (live.length >= max) this.retire(live.reduce((a, b) => (a.life < b.life ? a : b)));
		this.place(
			this.mines,
			KEYS.projectile('mine'),
			{ x: hx, y: hy },
			DEPLOYABLES.mineArm,
			def.duration || 20,
			def,
		);
	}

	/** Returns false when there was no target (retry soon instead of waiting the cooldown). */
	private activate(def: Act, hx: number, hy: number, grid: SpatialGrid<Enemy>): boolean {
		switch (def.behavior) {
			case 'thrown': {
				const count = def.count;
				const target = pickTarget(grid, hx, hy, def.range);
				if (!target) return false;
				const base = Math.atan2(target.y - hy, target.x - hx);
				for (let i = 0; i < count; i++) {
					const out = this.roll(def);
					this.pool.spawn({
						x: hx,
						y: hy,
						angle: base + (i - (count - 1) / 2) * 0.18,
						speed: 420,
						range: def.range,
						damage: out.amount,
						crit: out.crit,
						texture: KEYS.projectile('knife'),
						orient: true,
					});
				}
				return true;
			}
			case 'boomerang': {
				const target = pickTarget(grid, hx, hy, def.range);
				if (!target) return false;
				this.throwBoomerangs(def, Math.atan2(target.y - hy, target.x - hx));
				return true;
			}
			case 'mine':
				this.layMine(def, hx, hy);
				return true;
			case 'aura': {
				const radius = (def.radius || 70) * this.stats.area;
				const out = this.roll(def);
				this.area.burst(grid, hx, hy, radius, out.amount, def.element);
				return true;
			}
			case 'totem': {
				if (!pickTarget(grid, hx, hy, def.range)) return false;
				const life = def.duration || 6;
				this.place(this.totems, KEYS.projectile('totem'), { x: hx, y: hy }, 0, life, def);
				return true;
			}
			case 'cloud': {
				const target = this.pickCrowd(grid, hx, hy, def.range);
				if (!target) return false;
				const out = this.roll(def);
				this.area.zone(
					target.x,
					target.y,
					(def.radius || 60) * this.stats.area,
					def.duration || 4,
					out.amount,
					{ poison: true, tint: PALETTE.dotPoison },
				);
				return true;
			}
			case 'shooter':
			case 'follower': {
				const from = def.behavior === 'follower' ? this.droneAt : { x: hx, y: hy };
				const target = pickTarget(grid, from.x, from.y, def.range);
				if (!target) return false;
				const out = this.roll(def);
				this.pool.spawn({
					x: from.x,
					y: from.y,
					angle: Math.atan2(target.y - from.y, target.x - from.x),
					speed: 520,
					range: def.range,
					damage: out.amount,
					crit: out.crit,
					texture: KEYS.projectile(def.pierce ? 'bolt' : 'pellet'),
					tint: def.pierce
						? undefined
						: def.behavior === 'follower'
							? PALETTE.blood
							: PALETTE.crit,
					pierce: def.pierce,
					orient: Boolean(def.pierce),
				});
				return true;
			}
			case 'lob': {
				const target = this.pickCrowd(grid, hx, hy, def.range);
				if (!target) return false;
				const out = this.roll(def);
				const radius = (def.radius || 50) * this.stats.area;
				if (def.element === 'fire' && def.behavior === 'lob') {
					this.area.impact(
						target.x,
						target.y,
						0,
						LOB_TIME,
						0,
						KEYS.projectile('bottle'),
						{
							tint: PALETTE.elFire,
							fromZ: 60,
						},
					);
					this.scene.time.delayedCall(LOB_TIME * 1000, () =>
						this.area.zone(target.x, target.y, radius, 3, out.amount, {
							element: 'fire',
							tint: PALETTE.elFire,
						}),
					);
				} else {
					this.area.impact(
						target.x,
						target.y,
						radius,
						LOB_TIME,
						out.amount,
						KEYS.projectile('grenade'),
						{
							tint: PALETTE.crit,
							fromZ: 60,
						},
					);
				}
				return true;
			}
			case 'stomp': {
				const radius = (def.radius || 100) * this.stats.area;
				const out = this.roll(def);
				const hit = this.area.burst(grid, hx, hy, radius, out.amount, undefined);
				for (const e of hit) e.status.stunned = Math.max(e.status.stunned, 0.6);
				this.area.flash(hx, hy, radius, PALETTE.elEarth, 0.35);
				return true;
			}
			case 'chain': {
				const first = pickTarget(grid, hx, hy, def.range);
				if (!first) return false;
				const out = this.roll(def);
				this.lightning.clear().lineStyle(2, PALETTE.elEnergy, 1);
				let from = { x: hx, y: hy };
				let current: Enemy | undefined = first;
				let amount = out.amount;
				const hit = new Set<Enemy>();
				for (let j = 0; j < (def.count || 5) && current; j++) {
					this.drawBolt(from, current);
					hit.add(current);
					this.onHit(current, amount, out.crit && j === 0, 'energy');
					from = { x: current.x, y: current.y };
					amount *= 0.8;
					current = grid.nearest(
						from.x,
						from.y,
						STATUS.energy.range * 1.3,
						(e) => e.alive && !hit.has(e),
					);
				}
				this.lightningLife = 0.12;
				return true;
			}
			case 'meteor': {
				this.scratch.length = 0;
				grid.queryRadius(hx, hy, def.range, this.scratch);
				const alive = this.scratch.filter((e) => e.alive);
				if (alive.length === 0) return false;
				const radius = (def.radius || 60) * this.stats.area;
				for (let i = 0; i < (def.count || 3); i++) {
					const target = alive[this.rng.int(0, alive.length - 1)] as Enemy;
					const out = this.roll(def);
					this.area.impact(
						target.x,
						target.y,
						radius,
						METEOR_TIME + i * 0.15,
						out.amount,
						KEYS.projectile('meteor'),
						{
							element: 'fire',
							tint: PALETTE.elFire,
						},
					);
				}
				return true;
			}
			default:
				return true;
		}
	}

	/** Frost Nova (Lucia): freezes everything around her when she gets hit. */
	onHeroHit(hx: number, hy: number, grid: SpatialGrid<Enemy>): void {
		const level = this.build.secondaries.frostNova;
		if (!level || this.novaCooldown > 0) return;
		const def = SECONDARIES.frostNova;
		this.novaCooldown = def.cooldown / levelScale(level);
		const act = this.activeOf(def, level);
		const radius = def.radius * this.stats.area;
		const out = this.roll(act);
		const hit = this.area.burst(grid, hx, hy, radius, out.amount, 'ice');
		for (const e of hit) e.status.frozen = Math.max(e.status.frozen, STATUS.ice.freeze);
		this.area.flash(hx, hy, radius, PALETTE.elIce, 0.4);
	}

	/** An enemy near others: a few random samples, keep the most crowded one. */
	private pickCrowd(
		grid: SpatialGrid<Enemy>,
		hx: number,
		hy: number,
		range: number,
	): Enemy | undefined {
		this.scratch.length = 0;
		grid.queryRadius(hx, hy, range, this.scratch);
		const alive = this.scratch.filter((e) => e.alive);
		if (alive.length === 0) return undefined;
		let best: Enemy | undefined;
		let bestCount = -1;
		const probe: Enemy[] = [];
		for (let i = 0; i < 4; i++) {
			const e = alive[this.rng.int(0, alive.length - 1)] as Enemy;
			probe.length = 0;
			const n = grid.queryRadius(e.x, e.y, 60, probe).length;
			if (n > bestCount) {
				bestCount = n;
				best = e;
			}
		}
		return best;
	}

	private updateOrbit(
		slot: SlotState,
		def: ActiveWeapon,
		dt: number,
		hx: number,
		hy: number,
		grid: SpatialGrid<Enemy>,
	): void {
		slot.orbit ??= { angle: 0, sprites: [], cooldowns: new Map() };
		const state = slot.orbit;
		const count = def.count;
		while (state.sprites.length < count) {
			const img = this.scene.add.image(
				0,
				0,
				def.element === 'ice' ? KEYS.projectile('orb') : KEYS.projectile('blade'),
			);
			if (def.element) img.setTint(ELEMENT_TINT[def.element]);
			state.sprites.push(img);
		}
		state.angle += ORBIT_SPEED * dt;
		for (const [e, t] of state.cooldowns) {
			if (t - dt <= 0 || !e.alive) state.cooldowns.delete(e);
			else state.cooldowns.set(e, t - dt);
		}
		const radius = def.range * this.stats.area;
		state.sprites.forEach((img, i) => {
			const a = state.angle + (i / count) * Math.PI * 2;
			const x = hx + Math.cos(a) * radius;
			const y = hy + Math.sin(a) * radius;
			const s = worldToScreen(x, y, 12);
			img.setPosition(Math.round(s.x), Math.round(s.y))
				.setDepth(depthOf(x, y) + 0.5)
				.setRotation(a);
			this.scratch.length = 0;
			grid.queryRadius(x, y, ORBIT_HIT_RADIUS + 20, this.scratch);
			for (const e of this.scratch) {
				if (!e.alive || state.cooldowns.has(e)) continue;
				const dx = e.x - x;
				const dy = e.y - y;
				if (dx * dx + dy * dy > (ORBIT_HIT_RADIUS + e.radius) ** 2) continue;
				state.cooldowns.set(e, def.cooldown);
				const out = this.roll(def);
				this.onHit(e, out.amount, out.crit, def.element);
			}
		});
	}

	private moveDrone(dt: number, hx: number, hy: number): void {
		if (!this.drone) {
			this.drone = this.scene.add.image(0, 0, KEYS.drone);
			this.droneAt.x = hx;
			this.droneAt.y = hy;
		}
		this.drone.setVisible(true);
		// Hovers behind-left of the hero, easing towards him.
		const k = Math.min(1, dt * 4);
		this.droneAt.x += (hx - 20 - this.droneAt.x) * k;
		this.droneAt.y += (hy - 20 - this.droneAt.y) * k;
		const s = worldToScreen(this.droneAt.x, this.droneAt.y, 40);
		this.drone
			.setPosition(Math.round(s.x), Math.round(s.y))
			.setDepth(depthOf(this.droneAt.x, this.droneAt.y) + 50);
	}

	private drawBolt(from: { x: number; y: number }, to: Enemy): void {
		const a = worldToScreen(from.x, from.y, 16);
		const b = worldToScreen(to.x, to.y, 16);
		const mx = (a.x + b.x) / 2 + this.rng.range(-8, 8);
		const my = (a.y + b.y) / 2 + this.rng.range(-8, 8);
		this.lightning.beginPath().moveTo(a.x, a.y).lineTo(mx, my).lineTo(b.x, b.y).strokePath();
	}
}
