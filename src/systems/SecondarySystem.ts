import type Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { STATUS } from '../data/combat';
import { levelScale, SECONDARIES, type SecondaryDef, type SecondaryId } from '../data/secondaries';
import type { Enemy } from '../entities/Enemy';
import type { Build } from '../logic/build';
import { type Element, rollOutgoing } from '../logic/combat';
import { isoDepth, worldToScreen } from '../logic/iso';
import type { Rng } from '../logic/rng';
import type { SpatialGrid } from '../logic/spatial-grid';
import type { PlayerStats } from '../logic/stats';
import type { AreaSystem } from './AreaSystem';
import type { ProjectilePool } from './ProjectilePool';
import { ELEMENT_TINT } from './WeaponSystem';

export type SecondaryHit = (
	enemy: Enemy,
	amount: number,
	crit: boolean,
	element: Element | undefined,
) => void;

interface OrbitState {
	angle: number;
	sprites: Phaser.GameObjects.Image[];
	/** Enemy → time left before this orbit can hit it again. */
	cooldowns: Map<Enemy, number>;
}

const ORBIT_SPEED = 3;
const ORBIT_HIT_RADIUS = 14;
const LOB_TIME = 0.55;
const METEOR_TIME = 0.7;

/** Secondary weapons and weapon-like exclusives from the build (docs/game-design.md §5.1, §9). */
export class SecondarySystem {
	private readonly timers = new Map<SecondaryId, number>();
	private readonly orbits = new Map<SecondaryId, OrbitState>();
	private drone: Phaser.GameObjects.Image | null = null;
	private readonly droneAt = { x: 0, y: 0 };
	private readonly scratch: Enemy[] = [];
	private readonly lightning: Phaser.GameObjects.Graphics;
	private lightningLife = 0;
	/** Frost Nova is reactive (on hero hit), so it keeps its own cooldown. */
	private novaCooldown = 0;

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly rng: Rng,
		private readonly stats: PlayerStats,
		private readonly build: Build,
		private readonly pool: ProjectilePool,
		private readonly area: AreaSystem,
		private readonly onHit: SecondaryHit,
	) {
		this.lightning = scene.add.graphics().setDepth(1e8);
	}

	/** Base damage roll for a weapon at its level, with the hero's multipliers. */
	private roll(def: SecondaryDef, level: number): { amount: number; crit: boolean } {
		return rollOutgoing(
			{
				base: def.damage * levelScale(level),
				tag: def.tag,
				multiplier: this.stats.tagMul[def.tag] * this.stats.damage,
				critChance: this.stats.crit,
				critDamage: this.stats.critDamage,
			},
			{ crit: this.rng.next() },
		);
	}

	update(dt: number, hx: number, hy: number, grid: SpatialGrid<Enemy>): void {
		this.novaCooldown -= dt;
		for (const [id, level] of Object.entries(this.build.secondaries) as [
			SecondaryId,
			number,
		][]) {
			const def: SecondaryDef = SECONDARIES[id];
			if (def.behavior === 'orbit') {
				this.updateOrbit(id, def, level, dt, hx, hy, grid);
				continue;
			}
			if (def.behavior === 'follower') this.moveDrone(dt, hx, hy);
			if (def.behavior === 'nova') continue;
			const left = (this.timers.get(id) ?? 0) - dt;
			if (left > 0) {
				this.timers.set(id, left);
				continue;
			}
			const fired = this.activate(def, level, hx, hy, grid);
			this.timers.set(id, fired ? def.cooldown / this.stats.attackSpeed : 0.2);
		}
		if (this.lightningLife > 0) {
			this.lightningLife -= dt;
			if (this.lightningLife <= 0) this.lightning.clear();
		}
	}

	/** Returns false when there was no target (retry soon instead of waiting the cooldown). */
	private activate(
		def: SecondaryDef,
		level: number,
		hx: number,
		hy: number,
		grid: SpatialGrid<Enemy>,
	): boolean {
		switch (def.behavior) {
			case 'thrown': {
				const count = (def.count ?? 1) + (def.countPerLevel ?? 0) * (level - 1);
				const target = grid.nearest(hx, hy, def.range, (e) => e.alive);
				if (!target) return false;
				const base = Math.atan2(target.y - hy, target.x - hx);
				for (let i = 0; i < count; i++) {
					const out = this.roll(def, level);
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
			case 'shooter':
			case 'follower': {
				const from = def.behavior === 'follower' ? this.droneAt : { x: hx, y: hy };
				const target = grid.nearest(from.x, from.y, def.range, (e) => e.alive);
				if (!target) return false;
				const out = this.roll(def, level);
				this.pool.spawn({
					x: from.x,
					y: from.y,
					angle: Math.atan2(target.y - from.y, target.x - from.x),
					speed: 520,
					range: def.range,
					damage: out.amount,
					crit: out.crit,
					texture: KEYS.projectile('pellet'),
					tint: def.behavior === 'follower' ? PALETTE.blood : PALETTE.crit,
				});
				return true;
			}
			case 'lob': {
				const target = this.pickCrowd(grid, hx, hy, def.range);
				if (!target) return false;
				const out = this.roll(def, level);
				const radius = (def.radius ?? 50) * this.stats.area;
				if (def.id === 'molotov') {
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
				const radius = (def.radius ?? 100) * this.stats.area;
				const out = this.roll(def, level);
				const hit = this.area.burst(grid, hx, hy, radius, out.amount, undefined);
				for (const e of hit) e.status.stunned = Math.max(e.status.stunned, 0.6);
				this.area.flash(hx, hy, radius, PALETTE.elEarth, 0.35);
				return true;
			}
			case 'chain': {
				const first = grid.nearest(hx, hy, def.range, (e) => e.alive);
				if (!first) return false;
				const out = this.roll(def, level);
				this.lightning.clear().lineStyle(2, PALETTE.elEnergy, 1);
				let from = { x: hx, y: hy };
				let current: Enemy | undefined = first;
				let amount = out.amount;
				const hit = new Set<Enemy>();
				for (let j = 0; j < (def.count ?? 5) && current; j++) {
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
				const radius = (def.radius ?? 60) * this.stats.area;
				for (let i = 0; i < (def.count ?? 3); i++) {
					const target = alive[this.rng.int(0, alive.length - 1)] as Enemy;
					const out = this.roll(def, level);
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
		const radius = def.radius * this.stats.area;
		const out = this.roll(def, level);
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
		id: SecondaryId,
		def: SecondaryDef,
		level: number,
		dt: number,
		hx: number,
		hy: number,
		grid: SpatialGrid<Enemy>,
	): void {
		let state = this.orbits.get(id);
		if (!state) {
			state = { angle: 0, sprites: [], cooldowns: new Map() };
			this.orbits.set(id, state);
		}
		const count = (def.count ?? 2) + (def.countPerLevel ?? 0) * (level - 1);
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
				.setDepth(isoDepth(x, y) + 0.5)
				.setRotation(a);
			this.scratch.length = 0;
			grid.queryRadius(x, y, ORBIT_HIT_RADIUS + 20, this.scratch);
			for (const e of this.scratch) {
				if (!e.alive || state.cooldowns.has(e)) continue;
				const dx = e.x - x;
				const dy = e.y - y;
				if (dx * dx + dy * dy > (ORBIT_HIT_RADIUS + e.radius) ** 2) continue;
				state.cooldowns.set(e, def.cooldown);
				const out = this.roll(def, level);
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
		// Hovers behind-left of Bob, easing towards him.
		const k = Math.min(1, dt * 4);
		this.droneAt.x += (hx - 20 - this.droneAt.x) * k;
		this.droneAt.y += (hy - 20 - this.droneAt.y) * k;
		const s = worldToScreen(this.droneAt.x, this.droneAt.y, 40);
		this.drone
			.setPosition(Math.round(s.x), Math.round(s.y))
			.setDepth(isoDepth(this.droneAt.x, this.droneAt.y) + 50);
	}

	private drawBolt(from: { x: number; y: number }, to: Enemy): void {
		const a = worldToScreen(from.x, from.y, 16);
		const b = worldToScreen(to.x, to.y, 16);
		const mx = (a.x + b.x) / 2 + this.rng.range(-8, 8);
		const my = (a.y + b.y) / 2 + this.rng.range(-8, 8);
		this.lightning.beginPath().moveTo(a.x, a.y).lineTo(mx, my).lineTo(b.x, b.y).strokePath();
	}
}
