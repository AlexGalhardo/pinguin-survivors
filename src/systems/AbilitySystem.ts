import type Phaser from 'phaser';
import { SFX, TEX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import type { AbilitySlotInfo } from '../core/events';
import { ABILITY_DATA, type AbilityId, EVOLUTION } from '../data/abilities';
import type { Enemy } from '../entities/Enemy';
import {
	chainAt,
	cryoAt,
	distToSegmentSq,
	dronesAt,
	gravityAt,
	laserAt,
	missilesAt,
	nanitesAt,
	novaAt,
	sawAt,
	turretAt,
} from '../logic/abilities';
import type { AbilityState } from '../logic/run-state';
import { abilityDamage, rangeMul } from '../logic/stats';
import type { GameScene } from '../scenes/GameScene';

/** Runtime of one owned ability. */
interface AbilityRuntime {
	readonly id: AbilityId;
	level: number;
	evolved: boolean;
	update(dt: number): void;
	/** 0..1 cooldown fill for the HUD (1 = ready / continuous). */
	readiness(): number;
	destroy(): void;
}

abstract class BaseAbility implements AbilityRuntime {
	evolved = false;

	constructor(
		protected readonly g: GameScene,
		readonly id: AbilityId,
		public level: number,
	) {}

	abstract update(dt: number): void;

	readiness(): number {
		return 1;
	}

	destroy(): void {}

	/** Ability damage with Damage%, Ability Power% and the evolution bonus. */
	protected dmg(base: number): number {
		return abilityDamage(base, this.g.stats) * (this.evolved ? EVOLUTION.damageMul : 1);
	}

	/** Extra count (drones, jumps, missiles…) when evolved. */
	protected extra(): number {
		return this.evolved ? EVOLUTION.extraCount : 0;
	}

	/** Area multiplier (Range% and evolution). */
	protected area(): number {
		return rangeMul(this.g.stats) * (this.evolved ? EVOLUTION.areaMul : 1);
	}
}

abstract class CooldownAbility extends BaseAbility {
	protected timer = 0.5;

	protected abstract cooldown(): number;
	/** Returns false if there was nothing to hit (retries soon). */
	protected abstract trigger(): boolean;

	update(dt: number): void {
		this.timer -= dt;
		if (this.timer > 0) return;
		this.timer = this.trigger() ? this.cooldown() : 0.2;
	}

	override readiness(): number {
		return 1 - Math.max(0, Math.min(1, this.timer / this.cooldown()));
	}
}

class OrbitalDrones extends BaseAbility {
	private angle = 0;
	private readonly drones: Phaser.GameObjects.Image[] = [];
	private readonly nextHit = new WeakMap<Enemy, number>();
	private time = 0;

	constructor(g: GameScene, level: number) {
		super(g, 'orbital_drones', level);
	}

	update(dt: number): void {
		const d = ABILITY_DATA.orbital_drones;
		const { damage } = dronesAt(this.level);
		const count = dronesAt(this.level).count + this.extra();
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
			if (this.evolved) drone.setTint(PALETTE.amber);
			this.g.enemies.forEachInRadius(drone.x, drone.y, d.hitRadius, (e) => {
				if ((this.nextHit.get(e) ?? 0) > this.time) return;
				this.nextHit.set(e, this.time + d.tick);
				const len = Math.hypot(e.x - p.x, e.y - p.y) || 1;
				this.g.combat.damageEnemy(
					e,
					this.dmg(damage),
					false,
					{ dirX: (e.x - p.x) / len, dirY: (e.y - p.y) / len, force: 40 },
					true,
				);
			});
		});
	}

	override destroy(): void {
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
		const { damage } = chainAt(this.level);
		const jumps = chainAt(this.level).jumps + this.extra() * 2;
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
		const outer = this.evolved ? PALETTE.plum : PALETTE.blue;
		for (const [width, color] of [
			[3, outer],
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
		const r = radius * this.area();
		const p = g.player;
		if (!g.enemies.nearest(p.x, p.y, r + 16)) return false;
		g.fx.flashSprite(TEX.fxNova, p.x, p.y, 0.3, {
			scale: 0.3,
			grow: (r * 2) / 64 / 0.3,
			tint: this.evolved ? PALETTE.amber : undefined,
		});
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

class CryoField extends BaseAbility {
	private readonly aura: Phaser.GameObjects.Image;
	private tick = 0;

	constructor(g: GameScene, level: number) {
		super(g, 'cryo_field', level);
		this.aura = g.add.image(0, 0, TEX.fxCryo).setDepth(1);
	}

	update(dt: number): void {
		const g = this.g;
		const { dps, radius } = cryoAt(this.level);
		const slow = this.evolved ? EVOLUTION.cryoSlow : cryoAt(this.level).slow;
		const r = radius * this.area();
		const p = g.player;
		this.aura.setPosition(p.x, p.y).setScale((r * 2) / 64);
		if (this.evolved) this.aura.setTint(PALETTE.white);
		this.tick -= dt;
		const doDamage = this.tick <= 0;
		if (doDamage) this.tick = ABILITY_DATA.cryo_field.tick;
		g.enemies.forEachInRadius(p.x, p.y, r, (e) => {
			e.slow = Math.max(e.slow, slow);
			if (doDamage) {
				g.combat.damageEnemy(
					e,
					this.dmg(dps * ABILITY_DATA.cryo_field.tick),
					false,
					undefined,
					'dot',
				);
			}
		});
	}

	override destroy(): void {
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
		const { damage } = missilesAt(this.level);
		const count = missilesAt(this.level).count + this.extra() * 2;
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
		const { damage } = laserAt(this.level);
		const width = laserAt(this.level).width * (this.evolved ? EVOLUTION.areaMul * 1.5 : 1);
		const length = d.length * rangeMul(g.stats);
		const p = g.player;
		this.firing -= dt;
		this.beam
			.setVisible(this.firing > 0)
			.setPosition(p.x, p.y)
			.setRotation(this.angle)
			.setScale(length / 8, width / 8)
			.setAlpha(0.75 + Math.random() * 0.25);
		if (this.evolved) this.beam.setTint(PALETTE.salmon);
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
		const best = densest(g, p.x, p.y, length, d.densityRadius, this.neighbors);
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

/** Enemy with the most neighbors within `radius` among the first 60 in `reach`. */
function densest(
	g: GameScene,
	x: number,
	y: number,
	reach: number,
	radius: number,
	scratch: Enemy[],
): Enemy | undefined {
	let best: Enemy | undefined;
	let bestCount = -1;
	let checked = 0;
	for (const e of g.enemies.active) {
		if (!e.active || Math.hypot(e.x - x, e.y - y) > reach) continue;
		if (checked++ > 60) break;
		scratch.length = 0;
		const n = g.enemies.grid.queryRadius(e.x, e.y, radius, scratch).length;
		if (n > bestCount) {
			bestCount = n;
			best = e;
		}
	}
	return best;
}

interface Turret {
	img: Phaser.GameObjects.Image;
	life: number;
	fire: number;
}

class ArcTurret extends BaseAbility {
	private readonly turrets: Turret[] = [];
	private deploy = 0.5;

	constructor(g: GameScene, level: number) {
		super(g, 'arc_turret', level);
	}

	update(dt: number): void {
		const g = this.g;
		const d = ABILITY_DATA.arc_turret;
		const max = turretAt(this.level).turrets + (this.evolved ? 1 : 0);
		const fireEvery = d.fireEvery * (this.evolved ? 0.5 : 1);
		this.deploy -= dt;
		if (this.deploy <= 0) {
			this.deploy = d.deployEvery;
			if (this.turrets.length >= max) this.turrets.shift()?.img.destroy();
			const a = g.rng.range(0, Math.PI * 2);
			const img = g.add
				.image(
					g.player.x + Math.cos(a) * 20,
					g.player.y + Math.sin(a) * 20,
					TEX.abilityTurret,
				)
				.setDepth(4);
			this.turrets.push({ img, life: d.lifetime, fire: 0 });
		}
		for (let i = this.turrets.length - 1; i >= 0; i--) {
			const t = this.turrets[i];
			if (!t) continue;
			t.life -= dt;
			t.fire -= dt;
			t.img.setAlpha(t.life < 1.5 && Math.floor(t.life * 8) % 2 === 0 ? 0.4 : 1);
			if (t.life <= 0) {
				t.img.destroy();
				this.turrets.splice(i, 1);
				continue;
			}
			if (t.fire > 0) continue;
			const target = g.enemies.nearest(t.img.x, t.img.y, d.range * rangeMul(g.stats));
			if (!target) continue;
			t.fire = fireEvery;
			const len = Math.hypot(target.x - t.img.x, target.y - t.img.y) || 1;
			g.playerShots.fire({
				texture: TEX.projBlaster,
				x: t.img.x,
				y: t.img.y - 4,
				dirX: (target.x - t.img.x) / len,
				dirY: (target.y - t.img.y) / len,
				speed: d.shotSpeed,
				damage: this.dmg(turretAt(this.level).damage),
				range: d.range * 1.2,
				source: this.id,
			});
		}
	}

	override readiness(): number {
		return 1 - Math.max(0, Math.min(1, this.deploy / ABILITY_DATA.arc_turret.deployEvery));
	}

	override destroy(): void {
		for (const t of this.turrets) t.img.destroy();
		this.turrets.length = 0;
	}
}

class SawDisc extends CooldownAbility {
	constructor(g: GameScene, level: number) {
		super(g, 'saw_disc', level);
	}

	protected cooldown(): number {
		return ABILITY_DATA.saw_disc.cooldown;
	}

	protected trigger(): boolean {
		const g = this.g;
		const d = ABILITY_DATA.saw_disc;
		const count = sawAt(this.level).count + this.extra();
		const target = g.enemies.nearest(g.player.x, g.player.y, d.range * 1.5);
		const base = target
			? Math.atan2(target.y - g.player.y, target.x - g.player.x)
			: g.rng.range(0, Math.PI * 2);
		for (let i = 0; i < count; i++) {
			const a = base + (i / count) * Math.PI * 2;
			g.playerShots.fire({
				texture: TEX.abilitySaw,
				x: g.player.x,
				y: g.player.y,
				dirX: Math.cos(a),
				dirY: Math.sin(a),
				speed: d.speed,
				damage: this.dmg(sawAt(this.level).damage),
				range: d.range * rangeMul(g.stats),
				radius: 7,
				pierce: 999,
				spin: d.spin,
				source: this.id,
			});
		}
		g.sfx(SFX.blade);
		return true;
	}
}

class GravityWell extends CooldownAbility {
	private readonly vortex: Phaser.GameObjects.Image;
	private active = 0;
	private tick = 0;
	private x = 0;
	private y = 0;
	private readonly neighbors: Enemy[] = [];

	constructor(g: GameScene, level: number) {
		super(g, 'gravity_well', level);
		this.vortex = g.add
			.image(0, 0, TEX.fxShockwave)
			.setDepth(2)
			.setVisible(false)
			.setTint(PALETTE.plum);
	}

	protected cooldown(): number {
		return ABILITY_DATA.gravity_well.cooldown;
	}

	override update(dt: number): void {
		super.update(dt);
		if (this.active <= 0) return;
		const g = this.g;
		const d = ABILITY_DATA.gravity_well;
		const r = gravityAt(this.level).radius * this.area();
		this.active -= dt;
		this.vortex
			.setVisible(this.active > 0)
			.setPosition(this.x, this.y)
			.setScale((r * 2) / 64)
			.setAngle(this.vortex.angle + 360 * dt);
		this.tick -= dt;
		const doDamage = this.tick <= 0;
		if (doDamage) this.tick = d.tick;
		g.enemies.forEachInRadius(this.x, this.y, r, (e) => {
			const dx = this.x - e.x;
			const dy = this.y - e.y;
			const len = Math.hypot(dx, dy) || 1;
			if (len > 6 && e.def.type !== 'boss') {
				e.pullX += (dx / len) * d.pull;
				e.pullY += (dy / len) * d.pull;
			}
			if (doDamage) {
				g.combat.damageEnemy(
					e,
					this.dmg(gravityAt(this.level).damage),
					false,
					undefined,
					'dot',
				);
			}
		});
	}

	protected trigger(): boolean {
		const g = this.g;
		const best = densest(g, g.player.x, g.player.y, 220, 48, this.neighbors);
		if (!best) return false;
		this.x = best.x;
		this.y = best.y;
		this.active = ABILITY_DATA.gravity_well.duration;
		this.tick = 0;
		g.sfx(SFX.psi);
		return true;
	}

	override destroy(): void {
		this.vortex.destroy();
	}
}

class NaniteSwarm extends CooldownAbility {
	constructor(g: GameScene, level: number) {
		super(g, 'nanite_swarm', level);
	}

	protected cooldown(): number {
		return ABILITY_DATA.nanite_swarm.cooldown;
	}

	protected trigger(): boolean {
		const g = this.g;
		const d = ABILITY_DATA.nanite_swarm;
		const { dps, targets } = nanitesAt(this.level);
		const p = g.player;
		const range = d.range * rangeMul(g.stats);
		const pool = g.enemies.active.filter(
			(e) => e.active && Math.hypot(e.x - p.x, e.y - p.y) <= range && e.dotTime <= 0,
		);
		if (pool.length === 0) return false;
		const n = targets + this.extra();
		const perSecond = this.dmg(dps);
		for (let i = 0; i < n && pool.length > 0; i++) {
			const e = pool.splice(g.rng.int(0, pool.length - 1), 1)[0];
			if (!e) continue;
			e.infect(perSecond, d.duration);
			// Evolved: the swarm also spreads to close neighbors.
			if (this.evolved) {
				g.enemies.forEachInRadius(e.x, e.y, d.spreadRadius, (other) => {
					if (other.dotTime <= 0) other.infect(perSecond * 0.5, d.duration);
				});
			}
		}
		return true;
	}
}

const FACTORIES: Record<AbilityId, (g: GameScene, level: number) => AbilityRuntime> = {
	orbital_drones: (g, l) => new OrbitalDrones(g, l),
	chain_lightning: (g, l) => new ChainLightning(g, l),
	plasma_nova: (g, l) => new PlasmaNova(g, l),
	cryo_field: (g, l) => new CryoField(g, l),
	homing_missiles: (g, l) => new HomingMissiles(g, l),
	laser_beam: (g, l) => new LaserBeam(g, l),
	arc_turret: (g, l) => new ArcTurret(g, l),
	saw_disc: (g, l) => new SawDisc(g, l),
	gravity_well: (g, l) => new GravityWell(g, l),
	nanite_swarm: (g, l) => new NaniteSwarm(g, l),
};

/** Runs every owned ability; kept in sync with RunState.abilities. */
export class AbilitySystem {
	private readonly runtimes: AbilityRuntime[] = [];

	constructor(private readonly g: GameScene) {}

	/** Creates/levels runtimes to match the run's ability list (order = HUD slots). */
	sync(abilities: readonly AbilityState[]): void {
		for (const a of abilities) {
			let r = this.runtimes.find((x) => x.id === a.id);
			if (!r) {
				const factory = FACTORIES[a.id as AbilityId];
				if (!factory) continue;
				r = factory(this.g, a.level);
				this.runtimes.push(r);
			}
			r.level = a.level;
			r.evolved = a.evolved ?? false;
		}
	}

	update(dt: number): void {
		for (const r of this.runtimes) r.update(dt);
	}

	slots(): AbilitySlotInfo[] {
		return this.runtimes.map((r) => ({
			id: r.id,
			level: r.level,
			ready: r.readiness(),
			evolved: r.evolved,
		}));
	}

	destroy(): void {
		for (const r of this.runtimes) r.destroy();
		this.runtimes.length = 0;
	}
}
