import type Phaser from 'phaser';
import { MAX_ENEMIES } from '../config/constants';
import { ARENA } from '../data/arena';
import { DANGER, type DangerMods, EXTRA_WAVES } from '../data/difficulty';
import { ENEMY_LIST, type EnemyDef } from '../data/enemies';
import { OBSTACLES } from '../data/obstacles';
import { Enemy } from '../entities/Enemy';
import {
	type Bounds,
	clampToArena,
	insideBounds,
	type SpawnPoint,
	spawnRing,
} from '../logic/arena';
import { bossForRound } from '../logic/biome';
import { AI, cloakAlpha, stepAi } from '../logic/enemy-ai';
import { type ObstacleField, pushOut } from '../logic/obstacles';
import type { Vec2 } from '../logic/projection';
import type { Rng } from '../logic/rng';
import {
	bossHpMul,
	dmgMul,
	type EliteTier,
	hpMul,
	isBossRound,
	rollElite,
	spawnRate,
	speedMul,
} from '../logic/round';
import { SpatialGrid } from '../logic/spatial-grid';
import { pickEnemy, SpawnQueue } from '../logic/spawn';
import { speedFactor, type Tick, tickStatus } from '../logic/status';
import { seekWithSeparation } from '../logic/steering';

/** Special attacks are resolved by the scene (it owns combat, fx and projectiles). */
export interface EnemyAttacks {
	shoot: (enemy: Enemy) => void;
	explode: (enemy: Enemy) => void;
	swipe: (enemy: Enemy) => void;
	summon: (enemy: Enemy) => void;
	volley: (enemy: Enemy) => void;
	pool: (enemy: Enemy) => void;
	hazard: (enemy: Enemy) => void;
}

/** World size covered by the neighbor grid around the hero (larger than any view). */
const GRID_SIZE = 3072;

/** Spawns, steers and pools the horde. Enemies far away from the hero are recycled. */
export class EnemySystem {
	readonly active: Enemy[] = [];
	readonly grid = new SpatialGrid<Enemy>(48, GRID_SIZE, GRID_SIZE);
	private readonly pool: Enemy[] = [];
	private readonly scratch: Enemy[] = [];
	private spawnBudget = 0;
	boss: Enemy | null = null;
	/** Run seed: draws the endless-mode boss. */
	seed = 0;
	/** Danger multipliers on enemy HP, damage and speed (ADR-008). */
	mods: DangerMods = DANGER[1];
	/** Extra wave of the current round (SDD-005 RF-02): elites ×3 or spawn rate ×2. */
	wave: 'elite' | 'horde' | null = null;
	/** Solid decorations walkers slide around (flyers and bosses ignore them). */
	obstacles: ObstacleField | null = null;
	/** Arena walls: every enemy, flyers and boss included, stays inside (RF-03). */
	bounds: Bounds | null = null;
	/** Called when a spawn lands inside the camera view: show the telegraph there. */
	onTelegraph: ((x: number, y: number) => void) | null = null;
	/** Debug/audit counters: `silentInView` must stay 0 (no visible spawn without a telegraph). */
	readonly spawnStats = { total: 0, telegraphed: 0, silentInView: 0 };
	private readonly pending = new SpawnQueue<{ def: EnemyDef; elite: EliteTier | null }>();
	private readonly tick: Tick = { bleed: 0, poison: 0, burn: 0 };

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly rng: Rng,
		private readonly onDot: (enemy: Enemy, tick: Tick) => void,
		private readonly attacks: EnemyAttacks,
	) {}

	private round = 1;

	/** Extra spawn outside the normal flow (boss summons). */
	spawnAt(def: EnemyDef, x: number, y: number): void {
		if (this.active.length >= MAX_ENEMIES) return;
		const m = this.mods;
		this.take().spawn(
			def,
			x,
			y,
			hpMul(this.round) * m.hp,
			dmgMul(this.round) * m.dmg,
			null,
			m.speed * speedMul(this.round),
		);
	}

	/** `view` is the camera's world rectangle: spawns avoid it, or are telegraphed inside it. */
	startRound(round: number, view: Bounds): void {
		this.spawnBudget = 0;
		this.pending.clear();
		this.boss = null;
		if (this.bounds && isBossRound(round)) {
			const def = bossForRound(round, this.seed);
			// The ring is hidden from round 10 on (arena wider than the view), so no telegraph.
			const p = spawnRing(this.bounds, view, this.rng, 1)[0] as SpawnPoint;
			this.boss = this.take();
			const m = this.mods;
			this.boss.spawn(
				def,
				p.x,
				p.y,
				bossHpMul(round) * m.hp,
				dmgMul(round) * m.dmg,
				null,
				m.speed * speedMul(round),
			);
		}
	}

	update(dt: number, round: number, hero: Vec2, view: Bounds): void {
		this.round = round;
		this.pending.update(dt, (p) => this.materialize(p.x, p.y, p.data, view, true));
		this.spawnBudget +=
			spawnRate(round) * (this.wave === 'horde' ? EXTRA_WAVES.hordeMul : 1) * dt;
		while (this.spawnBudget >= 1) {
			this.spawnBudget -= 1;
			if (this.active.length + this.pending.size >= MAX_ENEMIES || !this.bounds) break;
			const data = {
				def: pickEnemy(this.rng, ENEMY_LIST, round),
				elite: rollElite(
					round,
					this.rng.next() / (this.wave === 'elite' ? EXTRA_WAVES.eliteMul : 1),
				),
			};
			const p = spawnRing(this.bounds, view, this.rng, 1)[0] as SpawnPoint;
			if (p.telegraph) {
				this.pending.add(p.x, p.y, ARENA.spawnTelegraph, data);
				this.onTelegraph?.(p.x, p.y);
			} else this.materialize(p.x, p.y, data, view, false);
		}

		this.grid.clear();
		this.grid.recenter(hero.x, hero.y);
		for (const e of this.active) this.grid.insert(e);

		// Recycle stragglers that fell far outside the area around the hero.
		const leash = GRID_SIZE / 2;
		for (let i = this.active.length - 1; i >= 0; i--) {
			const e = this.active[i] as Enemy;
			if (e === this.boss) continue;
			if (Math.abs(e.x - hero.x) > leash || Math.abs(e.y - hero.y) > leash) this.release(i);
		}

		// Iterate backwards: a DoT may kill (and swap-remove) the current enemy.
		for (let i = this.active.length - 1; i >= 0; i--) {
			const e = this.active[i] as Enemy;
			const t = tickStatus(e.status, dt, this.tick);
			if (t.bleed + t.poison + t.burn > 0) {
				this.onDot(e, t);
				if (!e.alive) continue;
			}
			const slow = speedFactor(e.status);
			const dx = hero.x - e.x;
			const dy = hero.y - e.y;
			const dist = Math.hypot(dx, dy);
			// Frozen/stunned enemies also pause their attack timers.
			const step =
				slow > 0 ? stepAi(e.def, e.ai, dist, dt) : { move: 'hold' as const, action: null };
			e.telegraph = e.ai.mode === 'windup';
			if (step.action === 'chargeStart') {
				e.chargeX = dx / (dist || 1);
				e.chargeY = dy / (dist || 1);
			} else if (step.action) {
				this.attacks[step.action](e);
				if (!e.alive) continue;
			}
			let v = { vx: 0, vy: 0 };
			if (step.move === 'seek') {
				const blockers =
					this.obstacles && e.def.behavior !== 'flyer' && e !== this.boss
						? this.obstacles.near(e.x, e.y, e.radius + OBSTACLES.avoidLookahead)
						: undefined;
				v = seekWithSeparation(
					e,
					hero.x,
					hero.y,
					this.grid,
					this.scratch,
					undefined,
					blockers,
				);
			} else if (step.move === 'charge') {
				const mul = e.ai.chargeMul || AI.chargeSpeed;
				v = { vx: e.chargeX * e.speed * mul, vy: e.chargeY * e.speed * mul };
			}
			e.x += v.vx * slow * dt;
			e.y += v.vy * slow * dt;
			if (this.obstacles && e.def.behavior !== 'flyer' && e !== this.boss)
				pushOut(e, e.radius, this.obstacles.near(e.x, e.y, e.radius));
			if (this.bounds) clampToArena(e, e.radius, this.bounds);
			e.sync(dt, v.vx < 0);
			if (e.def.cloakRange)
				e.setCloak(cloakAlpha(Math.hypot(e.x - hero.x, e.y - hero.y), e.def.cloakRange));
		}
	}

	private materialize(
		x: number,
		y: number,
		data: { def: EnemyDef; elite: EliteTier | null },
		view: Bounds,
		telegraphed: boolean,
	): void {
		if (this.active.length >= MAX_ENEMIES) return;
		const stats = this.spawnStats;
		stats.total++;
		if (telegraphed) stats.telegraphed++;
		else if (insideBounds({ x, y }, view)) stats.silentInView++;
		this.take().spawn(
			data.def,
			x,
			y,
			hpMul(this.round) * this.mods.hp,
			dmgMul(this.round) * this.mods.dmg,
			data.elite,
			this.mods.speed * speedMul(this.round),
		);
	}

	kill(enemy: Enemy): void {
		const i = this.active.indexOf(enemy);
		if (i >= 0) this.release(i);
		if (enemy === this.boss) this.boss = null;
	}

	clear(): void {
		for (let i = this.active.length - 1; i >= 0; i--) this.release(i);
		this.boss = null;
	}

	private take(): Enemy {
		const e = this.pool.pop() ?? new Enemy(this.scene);
		this.active.push(e);
		return e;
	}

	private release(index: number): void {
		const e = this.active[index] as Enemy;
		e.despawn();
		this.active[index] = this.active[this.active.length - 1] as Enemy;
		this.active.pop();
		this.pool.push(e);
	}
}
