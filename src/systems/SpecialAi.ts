import { TEX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { ENEMIES, SPECIAL } from '../data/enemies';
import { SHAKE } from '../data/juice';
import { PLAY_AREA } from '../entities/Arena';
import type { Enemy } from '../entities/Enemy';
import type { GameScene } from '../scenes/GameScene';

/**
 * Behaviors of the Beta enemies: Bomber (fuse + explosion), Burrower (dig and resurface
 * near the player), Healer (heal pulse) and Splitter (splits on death).
 * `handle` returns true when it fully controls the enemy's movement this frame.
 */
export class SpecialAi {
	constructor(private readonly g: GameScene) {}

	handle(e: Enemy, dt: number): boolean {
		if (e.def.heals) this.healer(e, dt);
		if (e.def.ai === 'bomber') return this.bomber(e, dt);
		if (e.def.ai === 'burrower') return this.burrower(e, dt);
		return false;
	}

	private healer(e: Enemy, dt: number): void {
		e.aiTimer += dt;
		if (e.aiTimer < SPECIAL.healEvery) return;
		e.aiTimer = 0;
		let healed = false;
		this.g.enemies.forEachInRadius(e.x, e.y, SPECIAL.healRadius, (ally) => {
			if (ally === e || ally.hp >= ally.maxHp) return;
			ally.hp = Math.min(ally.maxHp, ally.hp + ally.maxHp * SPECIAL.healPct);
			healed = true;
		});
		if (healed) {
			this.g.fx.flashSprite(TEX.fxShockwave, e.x, e.y, 0.35, {
				scale: 0.3,
				grow: (SPECIAL.healRadius * 2) / 64 / 0.3,
				tint: PALETTE.green,
				depth: 3,
			});
		}
	}

	private bomber(e: Enemy, dt: number): boolean {
		const p = this.g.player;
		const dist = Math.hypot(p.x - e.x, p.y - e.y);
		if (e.aiState === 0) {
			if (dist > SPECIAL.bomberTrigger) return false;
			e.aiState = 1;
			e.aiTimer = 0;
		}
		// Fuse: stop, blink and explode.
		e.aiTimer += dt;
		e.arcadeBody.setVelocity(0, 0);
		e.setTint(Math.floor(e.aiTimer * 16) % 2 === 0 ? PALETTE.red : 0xffffff);
		if (e.aiTimer >= SPECIAL.bomberFuse) {
			const damage = SPECIAL.bomberDamage * this.g.spawner.scaling().dmg;
			this.g.fx.flashSprite(TEX.fxNova, e.x, e.y, 0.3, {
				scale: (SPECIAL.bomberRadius * 2) / 64,
				tint: PALETTE.orange,
			});
			this.g.shake(SHAKE.explosion);
			if (dist <= SPECIAL.bomberRadius) this.g.combat.hurtPlayer(damage);
			// A self-destruct gives no gold.
			e.release();
		}
		return true;
	}

	private burrower(e: Enemy, dt: number): boolean {
		e.aiTimer += dt;
		if (!e.burrowed) {
			if (e.aiTimer < SPECIAL.burrowEvery) return false;
			// Dig in: pick the resurface point near the player and telegraph it.
			e.aiTimer = 0;
			e.burrowed = true;
			e.setAlpha(0.25);
			const a = this.g.rng.range(0, Math.PI * 2);
			const r = this.g.rng.range(SPECIAL.burrowMin, SPECIAL.burrowMax);
			e.chargeX = Math.min(
				PLAY_AREA.right - 12,
				Math.max(PLAY_AREA.left + 12, this.g.player.x + Math.cos(a) * r),
			);
			e.chargeY = Math.min(
				PLAY_AREA.bottom - 12,
				Math.max(PLAY_AREA.top + 12, this.g.player.y + Math.sin(a) * r),
			);
			this.g.fx.flashSprite(TEX.fxTelegraph, e.chargeX, e.chargeY, SPECIAL.burrowTime, {
				depth: 2,
			});
		}
		e.arcadeBody.setVelocity(0, 0);
		if (e.aiTimer >= SPECIAL.burrowTime) {
			e.aiTimer = 0;
			e.burrowed = false;
			e.setAlpha(1);
			e.setPosition(e.chargeX, e.chargeY);
			e.arcadeBody.reset(e.chargeX, e.chargeY);
		}
		return true;
	}

	/** Splitter: spawns its children where it died. */
	onDeath(e: Enemy): void {
		const child = e.def.splitInto;
		if (!child) return;
		const def = ENEMIES[child];
		const mul = this.g.spawner.scaling();
		for (let i = 0; i < SPECIAL.splitCount; i++) {
			const a = (i / SPECIAL.splitCount) * Math.PI * 2;
			const c = this.g.enemies.spawn(def, e.x + Math.cos(a) * 8, e.y + Math.sin(a) * 8, mul);
			c?.knockback(Math.cos(a), Math.sin(a), 120);
		}
	}
}
