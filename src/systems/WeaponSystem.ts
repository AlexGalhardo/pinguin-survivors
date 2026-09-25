import { TEX } from '../art/manifest';
import { MELEE_REACH_BONUS, WEAPONS, type WeaponDef } from '../data/weapons';
import type { Enemy } from '../entities/Enemy';
import { inArc, spreadAngles } from '../logic/geometry';
import { rangeMul, weaponCooldown, weaponDamage } from '../logic/stats';
import type { GameScene } from '../scenes/GameScene';

const DEG = Math.PI / 180;

/** Fires the character's starting weapon automatically at the nearest enemy in range. */
export class WeaponSystem {
	readonly weapon: WeaponDef;
	private cooldown = 0.3;
	private readonly hitOnce = new Set<Enemy>();

	constructor(private readonly game: GameScene) {
		this.weapon = WEAPONS[game.player.def.weapon];
	}

	update(dt: number): void {
		this.cooldown -= dt;
		if (this.cooldown > 0) return;
		const g = this.game;
		const w = this.weapon;
		const range = w.range * rangeMul(g.stats);
		const reach = w.kind === 'melee' ? range + MELEE_REACH_BONUS : range;
		const target = g.enemies.nearest(g.player.x, g.player.y, reach);
		if (!target) return;
		this.cooldown = weaponCooldown(w.cooldown, g.stats);
		const angle = Math.atan2(target.y - g.player.y, target.x - g.player.x);
		const count = 1 + Math.max(0, Math.floor(g.stats.projectiles));
		const angles = spreadAngles(angle, count, (w.spread ?? 10) * DEG);
		if (w.kind === 'melee') this.swing(angles, range);
		else this.shoot(angles, range);
		g.sfx(w.sfx);
	}

	private swing(angles: number[], range: number): void {
		const g = this.game;
		const w = this.weapon;
		const arc = (w.arc ?? 120) * DEG;
		const px = g.player.x;
		const py = g.player.y;
		this.hitOnce.clear();
		for (const a of angles) {
			g.fx.flashSprite(TEX.fxBladeArc, px, py, 0.18, {
				rotation: a,
				scale: range / 45,
				depth: 12,
			});
			g.enemies.forEachInRadius(px, py, range + MELEE_REACH_BONUS + 16, (e) => {
				if (this.hitOnce.has(e)) return;
				if (!inArc(px, py, a, arc, range, e.x, e.y, e.radius)) return;
				this.hitOnce.add(e);
				const crit = g.rng.chance(g.stats.critChance);
				const dist = Math.hypot(e.x - px, e.y - py) || 1;
				g.combat.damageEnemy(e, weaponDamage(w.damage, g.stats, crit), crit, {
					dirX: (e.x - px) / dist,
					dirY: (e.y - py) / dist,
					force: w.knockback ?? 0,
				});
			});
		}
	}

	private shoot(angles: number[], range: number): void {
		const g = this.game;
		const w = this.weapon;
		for (const a of angles) {
			const crit = g.rng.chance(g.stats.critChance);
			g.playerShots.fire({
				texture: w.projectileTexture ?? TEX.projBlaster,
				x: g.player.x + Math.cos(a) * 8,
				y: g.player.y + Math.sin(a) * 8,
				dirX: Math.cos(a),
				dirY: Math.sin(a),
				speed: w.projectileSpeed ?? 300,
				damage: weaponDamage(w.damage, g.stats, crit),
				crit,
				range: range * 1.15,
				pierce: (w.pierce ?? 0) + Math.max(0, Math.floor(g.stats.pierce)),
				source: w.id,
				spin: w.id === 'psi_orb' ? 360 : 0,
			});
		}
	}
}
