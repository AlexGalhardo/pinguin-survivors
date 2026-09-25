import { SFX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { STRINGS } from '../config/strings';
import { GameEvent } from '../core/events';
import { PLAYER_INVULN } from '../data/enemies';
import type { Enemy } from '../entities/Enemy';
import type { Projectile } from '../entities/Projectile';
import { damageTaken, dodgeChance, LifestealLimiter, RegenAccumulator } from '../logic/stats';
import type { GameScene } from '../scenes/GameScene';

export interface Knockback {
	dirX: number;
	dirY: number;
	force: number;
}

/**
 * Applies damage both ways: player -> enemy (flash, number, knockback, death, gold drop)
 * and enemy -> player (dodge, armor, i-frames, death event). Also runs regen.
 */
export class CombatSystem {
	private readonly regen = new RegenAccumulator();
	private readonly lifesteal = new LifestealLimiter();
	/** Hook for extra effects when an enemy dies (volatile elites, boss). */
	onEnemyDeath?: (e: Enemy) => void;

	constructor(private readonly game: GameScene) {}

	/** Player projectile hits an enemy (called from the Arcade overlap). */
	projectileHit(p: Projectile, e: Enemy): void {
		if (!p.active || !e.active || p.hitSet.has(e)) return;
		p.hitSet.add(e);
		const len = Math.hypot(p.arcadeBody.velocity.x, p.arcadeBody.velocity.y) || 1;
		this.damageEnemy(e, p.damage, p.crit, {
			dirX: p.arcadeBody.velocity.x / len,
			dirY: p.arcadeBody.velocity.y / len,
			force: 30,
		});
		if (p.pierceLeft <= 0) p.release();
		else p.pierceLeft--;
	}

	/**
	 * Deals damage to an enemy. Returns true if it died.
	 * `silent`: no hit sound; `'dot'`: damage over time (no sound, flash or number).
	 */
	damageEnemy(
		e: Enemy,
		amount: number,
		crit: boolean,
		kb?: Knockback,
		silent: boolean | 'dot' = false,
	): boolean {
		if (!e.active || e.hp <= 0) return false;
		const g = this.game;
		let dmg = amount;
		if (e.shield > 0) {
			const absorbed = Math.min(e.shield, dmg);
			e.shield -= absorbed;
			dmg -= absorbed;
		}
		e.hp -= dmg;
		g.state.totals.damageDealt += amount;
		if (silent !== 'dot') {
			g.enemies.flash(e);
			g.fx.damageNumber(e.x, e.y - e.radius, amount, crit);
		}
		if (kb && kb.force > 0) e.knockback(kb.dirX, kb.dirY, kb.force);
		if (!silent) g.sfx(SFX.enemyHit);
		this.tryLifesteal();
		if (e.def.type === 'boss') g.onBossDamaged(e);
		if (e.hp <= 0) {
			this.killEnemy(e);
			return true;
		}
		return false;
	}

	killEnemy(e: Enemy): void {
		const g = this.game;
		g.state.totals.kills++;
		g.fx.burst(e.x, e.y, e.elite ? PALETTE.amber : PALETTE.green, e.elite ? 12 : 6);
		g.pickups.dropGold(e.x, e.y, e.gold);
		g.maybeDropMedkit(e.x, e.y);
		g.sfx(SFX.enemyDie);
		g.events$.emit(GameEvent.EnemyKilled, { type: e.def.type, x: e.x, y: e.y });
		this.onEnemyDeath?.(e);
		e.release();
	}

	/** Enemy -> player damage (contact or projectile). Returns true if the hit landed. */
	hurtPlayer(raw: number): boolean {
		const g = this.game;
		if (g.params.god || g.player.invuln > 0 || g.state.hp <= 0 || g.runOver) return false;
		if (g.rng.chance(dodgeChance(g.stats))) {
			g.player.invuln = 0.15;
			g.fx.floatText(g.player.x, g.player.y - 12, STRINGS.dodge, PALETTE.cyan);
			return false;
		}
		const taken = damageTaken(raw, g.stats.armor);
		g.state.hp = Math.max(0, g.state.hp - taken);
		g.player.hurt(PLAYER_INVULN);
		g.shake(80, 0.004);
		g.sfx(SFX.playerHurt);
		g.emitHp();
		if (g.state.hp <= 0) g.onPlayerDied();
		return true;
	}

	heal(amount: number): void {
		const g = this.game;
		if (amount <= 0 || g.state.hp <= 0) return;
		const before = g.state.hp;
		g.state.hp = Math.min(g.maxHp, g.state.hp + amount);
		if (g.state.hp !== before) g.emitHp();
	}

	private tryLifesteal(): void {
		const g = this.game;
		const heal = this.lifesteal.onHit(g.stats.lifesteal, g.rng.next(), g.time.now / 1000);
		if (heal > 0) this.heal(heal);
	}

	update(dt: number): void {
		this.heal(this.regen.tick(this.game.stats.hpRegen, dt));
	}
}
