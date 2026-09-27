import type Phaser from 'phaser';
import { MAX_ENEMIES } from '../config/constants';
import { BOSS_BY_BIOME, ENEMIES, ENEMY_LIST } from '../data/enemies';
import { Enemy } from '../entities/Enemy';
import type { Vec2 } from '../logic/iso';
import type { Rng } from '../logic/rng';
import { bossHpMul, dmgMul, hpMul, isBossRound, rollElite, spawnRate } from '../logic/round';
import { SpatialGrid } from '../logic/spatial-grid';
import { pickEnemy, spawnPosition } from '../logic/spawn';
import { speedFactor, type Tick, tickStatus } from '../logic/status';
import { seekWithSeparation } from '../logic/steering';

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
	private readonly tick: Tick = { bleed: 0, poison: 0, burn: 0 };

	constructor(
		private readonly scene: Phaser.Scene,
		private readonly rng: Rng,
		private readonly onDot: (enemy: Enemy, tick: Tick) => void,
	) {}

	startRound(round: number, hero: Vec2, view: { width: number; height: number }): void {
		this.spawnBudget = 0;
		this.boss = null;
		if (isBossRound(round)) {
			const def = ENEMIES[BOSS_BY_BIOME.antarctica];
			const p = spawnPosition(this.rng, hero, view.width * 0.6, view.height * 0.6);
			this.boss = this.take();
			this.boss.spawn(def, p.x, p.y, bossHpMul(round), dmgMul(round), null);
		}
	}

	update(dt: number, round: number, hero: Vec2, view: { width: number; height: number }): void {
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
				hpMul(round),
				dmgMul(round),
				rollElite(round, this.rng.next()),
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
			const v = seekWithSeparation(e, hero.x, hero.y, this.grid, this.scratch);
			const slow = speedFactor(e.status);
			e.x += v.vx * slow * dt;
			e.y += v.vy * slow * dt;
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
