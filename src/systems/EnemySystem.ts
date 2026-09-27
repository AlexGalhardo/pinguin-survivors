import type Phaser from 'phaser';
import { MAX_ENEMIES } from '../config/constants';
import { DIFFICULTY, type DifficultyMods } from '../data/difficulty';
import { ENEMY_LIST, type EnemyDef } from '../data/enemies';
import { Enemy } from '../entities/Enemy';
import { bossForRound } from '../logic/biome';
import { AI, stepAi } from '../logic/enemy-ai';
import type { Vec2 } from '../logic/iso';
import { type ObstacleField, pushOut } from '../logic/obstacles';
import type { Rng } from '../logic/rng';
import {
	bossHpMul,
	dmgMul,
	hpMul,
	isBossRound,
	rollElite,
	spawnRate,
	speedMul,
} from '../logic/round';
import { SpatialGrid } from '../logic/spatial-grid';
import { pickEnemy, spawnPosition } from '../logic/spawn';
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
	/** Difficulty multipliers on enemy HP, damage and speed (P-62). */
	mods: DifficultyMods = DIFFICULTY.normal;
	/** Solid decorations walkers slide around (flyers and bosses ignore them). */
	obstacles: ObstacleField | null = null;
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
			dmgMul(this.round) * m.damage,
			null,
			m.speed * speedMul(this.round),
		);
	}

	startRound(round: number, hero: Vec2, view: { width: number; height: number }): void {
		this.spawnBudget = 0;
		this.boss = null;
		if (isBossRound(round)) {
			const def = bossForRound(round);
			const p = spawnPosition(this.rng, hero, view.width * 0.6, view.height * 0.6);
			this.boss = this.take();
			const m = this.mods;
			this.boss.spawn(
				def,
				p.x,
				p.y,
				bossHpMul(round) * m.hp,
				dmgMul(round) * m.damage,
				null,
				m.speed * speedMul(round),
			);
		}
	}

	update(dt: number, round: number, hero: Vec2, view: { width: number; height: number }): void {
		this.round = round;
		this.spawnBudget += spawnRate(round) * dt;
		while (this.spawnBudget >= 1) {
			this.spawnBudget -= 1;
			if (this.active.length >= MAX_ENEMIES) break;
			const def = pickEnemy(this.rng, ENEMY_LIST, round);
			const p = spawnPosition(this.rng, hero, view.width, view.height);
			this.take().spawn(
				def,
				p.x,
				p.y,
				hpMul(round) * this.mods.hp,
				dmgMul(round) * this.mods.damage,
				rollElite(round, this.rng.next()),
				this.mods.speed * speedMul(round),
			);
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
			if (step.move === 'seek')
				v = seekWithSeparation(e, hero.x, hero.y, this.grid, this.scratch);
			else if (step.move === 'charge') {
				const mul = e.ai.chargeMul || AI.chargeSpeed;
				v = { vx: e.chargeX * e.speed * mul, vy: e.chargeY * e.speed * mul };
			}
			e.x += v.vx * slow * dt;
			e.y += v.vy * slow * dt;
			if (this.obstacles && e.def.behavior !== 'flyer' && e !== this.boss)
				pushOut(e, e.radius, this.obstacles.near(e.x, e.y, e.radius));
			// Screen-space x of the velocity decides the horizontal flip.
			e.sync(dt, v.vx - v.vy < 0);
		}
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
