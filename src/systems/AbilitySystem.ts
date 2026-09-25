import type Phaser from 'phaser';
import { SFX, TEX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import type { AbilitySlotInfo } from '../core/events';
import { ABILITY_DATA, type AbilityId } from '../data/abilities';
import type { Enemy } from '../entities/Enemy';
import {
	chainAt,
	cryoAt,
	distToSegmentSq,
	dronesAt,
	laserAt,
	missilesAt,
	novaAt,
} from '../logic/abilities';
import type { AbilityState } from '../logic/run-state';
import { abilityDamage, rangeMul } from '../logic/stats';
import type { GameScene } from '../scenes/GameScene';

/** Runtime of one owned ability. */
interface AbilityRuntime {
	readonly id: AbilityId;
	level: number;
	update(dt: number): void;
	/** 0..1 cooldown fill for the HUD (1 = ready / continuous). */
	readiness(): number;
	destroy(): void;
}

abstract class CooldownAbility implements AbilityRuntime {
	protected timer = 0.5;

	constructor(
		protected readonly g: GameScene,
		readonly id: AbilityId,
		public level: number,
	) {}

	protected abstract cooldown(): number;
	/** Returns false if there was nothing to hit (retries soon). */
	protected abstract trigger(): boolean;

	update(dt: number): void {
		this.timer -= dt;
		if (this.timer > 0) return;
		this.timer = this.trigger() ? this.cooldown() : 0.2;
	}

	readiness(): number {
		return 1 - Math.max(0, Math.min(1, this.timer / this.cooldown()));
	}

	destroy(): void {}

	protected dmg(base: number): number {
		return abilityDamage(base, this.g.stats);
	}
}

class OrbitalDrones implements AbilityRuntime {
	readonly id = 'orbital_drones' as const;
	private angle = 0;
	private readonly drones: Phaser.GameObjects.Image[] = [];
	private readonly nextHit = new WeakMap<Enemy, number>();
	private time = 0;

	constructor(
		private readonly g: GameScene,
		public level: number,
	) {}

	update(dt: number): void {
		const d = ABILITY_DATA.orbital_drones;
		const { count, damage } = dronesAt(this.level);
		while (this.drones.length < count) {
			this.drones.push(this.g.add.image(0, 0, TEX.abilityDrone).setDepth(11));
		}
		this.time += dt;
		this.angle += d.spin * dt;
		const radius = d.orbitRadius * rangeMul(this.g.stats);
		const p = this.g.player;
		this.drones.forEach((drone, i) => {
			const a = this.angle + (i / count) * Math.PI * 2;
			drone.setPosition(p.x + Math.cos(a) * radius, p.y + Math.sin(a) * radius);
			this.g.enemies.forEachInRadius(drone.x, drone.y, d.hitRadius, (e) => {
				if ((this.nextHit.get(e) ?? 0) > this.time) return;
				this.nextHit.set(e, this.time + d.tick);
				const len = Math.hypot(e.x - p.x, e.y - p.y) || 1;
				this.g.combat.damageEnemy(
					e,
					abilityDamage(damage, this.g.stats),
					false,
					{ dirX: (e.x - p.x) / len, dirY: (e.y - p.y) / len, force: 40 },
					true,
				);
			});
		});
	}

	readiness(): number {
		return 1;
	}

	destroy(): void {
		for (const d of this.drones) d.destroy();
		this.drones.length = 0;
	}
}

class ChainLightning extends CooldownAbility {
	private readonly gfx: Phaser.GameObjects.Graphics;
	private readonly hit = new Set<Enemy>();

	constructor(g: GameScene, level: number) {
		super(g, 'chain_lightning', level);
		this.gfx = g.add.graphics().setDepth(12);
	}

	protected cooldown(): number {
		return chainAt(this.level).cooldown;
	}

	protected trigger(): boolean {
		const g = this.g;
		const d = ABILITY_DATA.chain_lightning;
		const { damage, jumps } = chainAt(this.level);
		const range = rangeMul(g.stats);
		let from = { x: g.player.x, y: g.player.y };
		let target = g.enemies.nearest(from.x, from.y, d.range * range);
		if (!target) return false;
		this.hit.clear();
		this.gfx.clear();
		for (let i = 0; i <= jumps && target; i++) {
			this.zap(from.x, from.y, target.x, target.y);
			this.hit.add(target);
			from = { x: target.x, y: target.y };
			g.combat.damageEnemy(target, this.dmg(damage), false, undefined, i > 0);
			target = g.enemies.nearest(
				from.x,
				from.y,
				d.jumpRange * range,
				(e) => !this.hit.has(e),
			);
		}
		g.tweens.killTweensOf(this.gfx);
		this.gfx.setAlpha(1);
		g.tweens.add({ targets: this.gfx, alpha: 0, duration: 180 });
		g.sfx(SFX.blaster);
		return true;
	}

	/** Jagged pixel lightning between two points. */
	private zap(x0: number, y0: number, x1: number, y1: number): void {
		const segs = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 12));
		const pts: { x: number; y: number }[] = [{ x: x0, y: y0 }];
		for (let i = 1; i < segs; i++) {
			const t = i / segs;
			pts.push({
				x: x0 + (x1 - x0) * t + (Math.random() - 0.5) * 8,
				y: y0 + (y1 - y0) * t + (Math.random() - 0.5) * 8,
			});
		}
		pts.push({ x: x1, y: y1 });
		for (const [width, color] of [
			[3, PALETTE.blue],
			[1, PALETTE.white],
		] as const) {
			this.gfx.lineStyle(width, color, 1);
			this.gfx.beginPath();
			this.gfx.moveTo(pts[0]?.x ?? x0, pts[0]?.y ?? y0);
			for (const p of pts) this.gfx.lineTo(p.x, p.y);
			this.gfx.strokePath();
		}
	}

	override destroy(): void {
		this.gfx.destroy();
	}
}

class PlasmaNova extends CooldownAbility {
	constructor(g: GameScene, level: number) {
		super(g, 'plasma_nova', level);
	}

	protected cooldown(): number {
		return novaAt(this.level).cooldown;
	}

	protected trigger(): boolean {
		const g = this.g;
		const { damage, radius } = novaAt(this.level);
		const r = radius * rangeMul(g.stats);
		const p = g.player;
		if (!g.enemies.nearest(p.x, p.y, r + 16)) return false;
		g.fx.flashSprite(TEX.fxNova, p.x, p.y, 0.3, { scale: 0.3, grow: (r * 2) / 64 / 0.3 });
		g.enemies.forEachInRadius(p.x, p.y, r, (e) => {
			const len = Math.hypot(e.x - p.x, e.y - p.y) || 1;
			g.combat.damageEnemy(
				e,
				this.dmg(damage),
				false,
				{
					dirX: (e.x - p.x) / len,
					dirY: (e.y - p.y) / len,
					force: ABILITY_DATA.plasma_nova.knockback,
				},
				true,
			);
		});
		g.sfx(SFX.psi);
		return true;
	}
}

class CryoField implements AbilityRuntime {
	readonly id = 'cryo_field' as const;
	private readonly aura: Phaser.GameObjects.Image;
	private tick = 0;

	constructor(
		private readonly g: GameScene,
		public level: number,
	) {
		this.aura = g.add.image(0, 0, TEX.fxCryo).setDepth(1);
	}

	update(dt: number): void {
		const g = this.g;
		const { dps, radius, slow } = cryoAt(this.level);
		const r = radius * rangeMul(g.stats);
		const p = g.player;
		this.aura.setPosition(p.x, p.y).setScale((r * 2) / 64);
		this.tick -= dt;
		const doDamage = this.tick <= 0;
		if (doDamage) this.tick = ABILITY_DATA.cryo_field.tick;
		g.enemies.forEachInRadius(p.x, p.y, r, (e) => {
			e.slow = Math.max(e.slow, slow);
			if (doDamage) {
				g.combat.damageEnemy(
					e,
					abilityDamage(dps * ABILITY_DATA.cryo_field.tick, g.stats),
					false,
					undefined,
					true,
				);
			}
		});
	}

	readiness(): number {
		return 1;
	}

	destroy(): void {
		this.aura.destroy();
	}
}

class HomingMissiles extends CooldownAbility {
	constructor(g: GameScene, level: number) {
		super(g, 'homing_missiles', level);
	}

	protected cooldown(): number {
		return ABILITY_DATA.homing_missiles.cooldown;
	}

	protected trigger(): boolean {
		const g = this.g;
		const d = ABILITY_DATA.homing_missiles;
		const { count, damage } = missilesAt(this.level);
		const p = g.player;
		const range = d.targetRange * rangeMul(g.stats);
		const candidates = g.enemies.active.filter(
			(e) => e.active && Math.hypot(e.x - p.x, e.y - p.y) <= range,
		);
		if (candidates.length === 0) return false;
		for (let i = 0; i < count; i++) {
			const target = g.rng.pick(candidates);
			const a = g.rng.range(0, Math.PI * 2);
			const m = g.playerShots.fire({
				texture: TEX.abilityMissile,
				x: p.x,
				y: p.y,
				dirX: Math.cos(a),
				dirY: Math.sin(a),
				speed: d.speed,
				damage: this.dmg(damage),
				range: d.range,
				radius: 4,
				homing: d.turnRate,
				source: this.id,
			});
			if (m) m.target = target;
		}
		g.sfx(SFX.blaster);
		return true;
	}
}

class LaserBeam extends CooldownAbility {
	private readonly beam: Phaser.GameObjects.Image;
	private firing = 0;
	private tickTimer = 0;
	private angle = 0;
	private readonly neighbors: Enemy[] = [];

	constructor(g: GameScene, level: number) {
		super(g, 'laser_beam', level);
		this.beam = g.add.image(0, 0, TEX.fxLaser).setOrigin(0, 0.5).setDepth(12).setVisible(false);
	}

	protected cooldown(): number {
		return ABILITY_DATA.laser_beam.cooldown + laserAt(this.level).duration;
	}

	override update(dt: number): void {
		super.update(dt);
		if (this.firing <= 0) return;
		const g = this.g;
		const d = ABILITY_DATA.laser_beam;
		const { damage, width } = laserAt(this.level);
		const length = d.length * rangeMul(g.stats);
		const p = g.player;
		this.firing -= dt;
		this.beam
			.setVisible(this.firing > 0)
			.setPosition(p.x, p.y)
			.setRotation(this.angle)
			.setScale(length / 8, width / 8)
			.setAlpha(0.75 + Math.random() * 0.25);
		this.tickTimer -= dt;
		if (this.tickTimer > 0) return;
		this.tickTimer = d.tick;
		const ex = p.x + Math.cos(this.angle) * length;
		const ey = p.y + Math.sin(this.angle) * length;
		for (const e of g.enemies.active) {
			if (!e.active) continue;
			const reach = width / 2 + e.radius;
			if (distToSegmentSq(e.x, e.y, p.x, p.y, ex, ey) <= reach * reach) {
				g.combat.damageEnemy(e, this.dmg(damage), false, undefined, true);
			}
		}
	}

	protected trigger(): boolean {
		const g = this.g;
		const d = ABILITY_DATA.laser_beam;
		const p = g.player;
		const length = d.length * rangeMul(g.stats);
		// Aim at the enemy with the most neighbors (the densest crowd) in reach.
		let best: Enemy | undefined;
		let bestCount = -1;
		let checked = 0;
		for (const e of g.enemies.active) {
			if (!e.active || Math.hypot(e.x - p.x, e.y - p.y) > length) continue;
			if (checked++ > 60) break;
			this.neighbors.length = 0;
			const n = g.enemies.grid.queryRadius(e.x, e.y, d.densityRadius, this.neighbors).length;
			if (n > bestCount) {
				bestCount = n;
				best = e;
			}
		}
		if (!best) return false;
		this.angle = Math.atan2(best.y - p.y, best.x - p.x);
		this.firing = laserAt(this.level).duration;
		this.tickTimer = 0;
		g.sfx(SFX.blaster);
		return true;
	}

	override destroy(): void {
		this.beam.destroy();
	}
}

const FACTORIES: Record<AbilityId, (g: GameScene, level: number) => AbilityRuntime> = {
	orbital_drones: (g, l) => new OrbitalDrones(g, l),
	chain_lightning: (g, l) => new ChainLightning(g, l),
	plasma_nova: (g, l) => new PlasmaNova(g, l),
	cryo_field: (g, l) => new CryoField(g, l),
	homing_missiles: (g, l) => new HomingMissiles(g, l),
	laser_beam: (g, l) => new LaserBeam(g, l),
};

/** Runs every owned ability; kept in sync with RunState.abilities. */
export class AbilitySystem {
	private readonly runtimes: AbilityRuntime[] = [];

	constructor(private readonly g: GameScene) {}

	/** Creates/levels runtimes to match the run's ability list (order = HUD slots). */
	sync(abilities: readonly AbilityState[]): void {
		for (const a of abilities) {
			const existing = this.runtimes.find((r) => r.id === a.id);
			if (existing) existing.level = a.level;
			else {
				const factory = FACTORIES[a.id as AbilityId];
				if (factory) this.runtimes.push(factory(this.g, a.level));
			}
		}
	}

	update(dt: number): void {
		for (const r of this.runtimes) r.update(dt);
	}

	slots(): AbilitySlotInfo[] {
		return this.runtimes.map((r) => ({ id: r.id, level: r.level, ready: r.readiness() }));
	}

	destroy(): void {
		for (const r of this.runtimes) r.destroy();
		this.runtimes.length = 0;
	}
}
