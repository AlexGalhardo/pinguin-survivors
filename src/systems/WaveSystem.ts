import type Phaser from 'phaser';
import { SFX, TEX } from '../art/manifest';
import { PALETTE } from '../config/palette';
import { GameEvent } from '../core/events';
import { BOSS, BOSS_ROTATION, BOSS2, BOSS3, ELITE, ENEMIES, WAVE_FLOW } from '../data/enemies';
import { WAVE, type WaveModifier } from '../data/waves';
import type { EliteMod, Enemy } from '../entities/Enemy';
import { dmgMul } from '../logic/scaling';
import { unlockedTypes } from '../logic/spawn';
import {
	isWaveComplete,
	modifierMul,
	rollWaveModifier,
	type WaveSchedule,
	waveSchedule,
} from '../logic/wave';
import type { GameScene } from '../scenes/GameScene';
import { SpecialAi } from './SpecialAi';

export type WavePhase = 'intro' | 'combat' | 'ending' | 'intermission';

const ELITE_MODS: readonly EliteMod[] = ['fast', 'shielded', 'volatile'];
const ELITE_TINT: Record<EliteMod, number> = {
	fast: PALETTE.yellow,
	shielded: PALETTE.cyan,
	volatile: PALETTE.salmon,
};

/**
 * Wave flow: banner (physics paused) -> timed combat (elites/boss on schedule)
 * -> purge + gold collection -> WAVE_ENDED -> intermission (cards/shop) -> next wave.
 */
export class WaveSystem {
	phase: WavePhase = 'intermission';
	schedule!: WaveSchedule;
	elapsed = 0;
	private lastSecond = -1;
	private elitesSpawned = 0;
	private bossQueued = false;
	boss: Enemy | null = null;
	private bossLine: Phaser.GameObjects.Image;
	private readonly special: SpecialAi;
	/** Pending telegraphed slams of the third boss. */
	private readonly slams: { x: number; y: number; t: number }[] = [];
	modifier: WaveModifier = null;

	constructor(private readonly game: GameScene) {
		this.bossLine = game.add
			.image(0, 0, TEX.fxPixel)
			.setOrigin(0, 0.5)
			.setTint(PALETTE.red)
			.setAlpha(0.5)
			.setDepth(4)
			.setVisible(false);
		this.special = new SpecialAi(game);
		game.enemies.customAi = (e, dt) => {
			if (!e.def.isBoss) return this.special.handle(e, dt);
			if (e.def.type === 'boss2') return this.wardenAi(e, dt);
			if (e.def.type === 'boss3') return this.titanAi(e, dt);
			return this.bossAi(e, dt);
		};
		game.combat.onEnemyDeath = (e) => this.onEnemyDeath(e);
	}

	get inCombat(): boolean {
		return this.phase === 'combat';
	}

	get remaining(): number {
		return Math.max(0, this.schedule.duration - this.elapsed);
	}

	/** Starts wave N: banner with the physics paused, then combat. */
	start(wave: number): void {
		const g = this.game;
		g.state.wave = wave;
		this.schedule = waveSchedule(wave);
		this.elapsed = 0;
		this.lastSecond = -1;
		this.elitesSpawned = 0;
		this.bossQueued = false;
		this.boss = null;
		g.spawner.setWave(wave);
		this.modifier = rollWaveModifier(wave, g.rng);
		g.spawner.mods = modifierMul(this.modifier);
		this.slams.length = 0;
		g.spawner.enabled = false;
		this.phase = 'intro';
		g.physics.pause();
		g.events$.emit(GameEvent.WaveStarted, {
			wave,
			duration: this.schedule.duration,
			modifier: this.modifier,
		});
		g.sfx(SFX.waveStart);
		g.onWaveStart(wave);
		g.time.delayedCall(WAVE_FLOW.bannerTime * 1000, () => {
			if (g.runOver) return;
			g.physics.resume();
			g.spawner.enabled = true;
			this.phase = 'combat';
		});
	}

	update(dt: number): void {
		if (this.phase !== 'combat') return;
		const g = this.game;
		this.elapsed += dt;
		this.updateSlams(dt);
		const s = this.schedule;
		while (
			this.elitesSpawned < s.eliteTimes.length &&
			this.elapsed >= (s.eliteTimes[this.elitesSpawned] ?? Infinity)
		) {
			this.elitesSpawned++;
			this.spawnElite();
		}
		if (s.bossTime !== null && !this.bossQueued && this.elapsed >= s.bossTime) {
			this.bossQueued = true;
			this.spawnBoss();
		}
		const second = Math.ceil(this.remaining);
		if (second !== this.lastSecond) {
			this.lastSecond = second;
			g.events$.emit(GameEvent.WaveTimer, { wave: s.wave, remaining: second });
		}
		const bossPending = s.bossTime !== null && (!this.bossQueued || this.boss !== null);
		if (isWaveComplete(this.remaining, bossPending)) this.end();
	}

	private spawnElite(): void {
		const g = this.game;
		const type = g.rng.pick(unlockedTypes(g.state.wave));
		const mod = g.rng.pick(ELITE_MODS);
		g.spawner.queueGroup(type, 1, (e) => e.makeElite(mod, ELITE_TINT[mod]));
	}

	private spawnBoss(): void {
		const g = this.game;
		g.sfx(SFX.bossWarn);
		g.shake(300, 0.006);
		const index =
			Math.max(0, Math.floor(g.state.wave / WAVE.bossEvery) - 1) % BOSS_ROTATION.length;
		g.spawner.queueGroup(BOSS_ROTATION[index] ?? 'boss', 1, (e) => {
			this.boss = e;
			e.aiTimer = BOSS.burstEvery * 0.5;
			g.events$.emit(GameEvent.BossSpawned, { maxHp: e.maxHp });
		});
	}

	/** Timer over: purge the remaining enemies and pull the gold to the player. */
	private end(): void {
		const g = this.game;
		this.phase = 'ending';
		g.spawner.enabled = false;
		g.spawner.clearPending();
		g.enemies.forEachActive((e) => {
			g.fx.burst(e.x, e.y, PALETTE.cyan, 4);
			e.release();
		});
		g.enemyShots.clear();
		this.bossLine.setVisible(false);
		g.pickups.attractAll('gold');
		g.sfx(SFX.waveEnd);
		g.time.delayedCall(WAVE_FLOW.purgeCollectTime * 1000, () => {
			if (g.runOver) return;
			g.pickups.collectAll();
			g.playerShots.clear();
			this.phase = 'intermission';
			g.events$.emit(GameEvent.WaveEnded, { wave: this.schedule.wave });
			g.onWaveEnded(this.schedule.wave);
		});
	}

	private onEnemyDeath(e: Enemy): void {
		const g = this.game;
		if (e === this.boss) {
			this.boss = null;
			g.shake(400, 0.01);
			this.bossLine.setVisible(false);
			g.events$.emit(GameEvent.BossDied, undefined);
			g.onBossKilled();
		}
		if (e.elite === 'volatile') this.explode(e.x, e.y, e.damage);
		this.special.onDeath(e);
	}

	/** Volatile elite: telegraphed explosion that hurts the player if close. */
	private explode(x: number, y: number, enemyDamage: number): void {
		const g = this.game;
		const radius = ELITE.volatileRadius;
		g.fx.flashSprite(TEX.fxShockwave, x, y, ELITE.volatileDelay, {
			scale: (radius * 2) / 64,
			tint: PALETTE.red,
			depth: 4,
		});
		const damage = (ELITE.volatileDamage * enemyDamage) / ENEMIES.chaser.damage;
		g.time.delayedCall(ELITE.volatileDelay * 1000, () => {
			if (g.runOver || this.phase !== 'combat') return;
			g.fx.flashSprite(TEX.fxNova, x, y, 0.25, {
				scale: (radius * 2) / 64,
				tint: PALETTE.orange,
			});
			g.shake(120, 0.006);
			if (Math.hypot(g.player.x - x, g.player.y - y) <= radius) g.combat.hurtPlayer(damage);
		});
	}

	/** Warden (boss 2): rotating spiral stream every 6 s and chaser summons every 8 s. */
	private wardenAi(e: Enemy, dt: number): boolean {
		const g = this.game;
		const b = BOSS2;
		const dx = g.player.x - e.x;
		const dy = g.player.y - e.y;
		const dist = Math.hypot(dx, dy) || 1;
		e.aiTimer += dt;
		e.aiTimer2 += dt;
		const spiraling = e.aiTimer >= b.spiralEvery;
		if (spiraling) {
			e.arcadeBody.setVelocity(0, 0);
			e.fireCooldown -= dt;
			if (e.fireCooldown <= 0) {
				e.fireCooldown = b.spiralShotEvery;
				e.chargeX += b.spiralTurn;
				for (let k = 0; k < 2; k++) {
					const a = e.chargeX + k * Math.PI;
					g.enemyShots.fire({
						texture: TEX.projEnemy,
						x: e.x,
						y: e.y,
						dirX: Math.cos(a),
						dirY: Math.sin(a),
						speed: b.shotSpeed,
						damage: b.shotDamage * dmgMul(g.state.wave),
						range: 700,
						radius: 3,
					});
				}
			}
			if (e.aiTimer >= b.spiralEvery + b.spiralDuration) e.aiTimer = 0;
		} else {
			e.arcadeBody.setVelocity((dx / dist) * e.speed, (dy / dist) * e.speed);
		}
		if (e.aiTimer2 >= b.summonEvery) {
			e.aiTimer2 = 0;
			for (let i = 0; i < b.summonCount; i++) g.spawner.queueGroup('chaser', 1, () => {});
		}
		if (Math.abs(dx) > 2) e.setFlipX(dx < 0);
		return true;
	}

	/** Void Titan (boss 3): telegraphed slams at the player and a shotgun blast. */
	private titanAi(e: Enemy, dt: number): boolean {
		const g = this.game;
		const b = BOSS3;
		const dx = g.player.x - e.x;
		const dy = g.player.y - e.y;
		const dist = Math.hypot(dx, dy) || 1;
		e.arcadeBody.setVelocity((dx / dist) * e.speed, (dy / dist) * e.speed);
		e.aiTimer += dt;
		e.aiTimer2 += dt;
		if (e.aiTimer >= b.slamEvery) {
			e.aiTimer = 0;
			for (let i = 0; i < b.slamCount; i++) {
				const x = g.player.x + (i === 0 ? 0 : g.rng.range(-50, 50));
				const y = g.player.y + (i === 0 ? 0 : g.rng.range(-50, 50));
				this.slams.push({ x, y, t: b.slamWarn });
				g.fx.flashSprite(TEX.fxShockwave, x, y, b.slamWarn, {
					scale: (b.slamRadius * 2) / 64,
					tint: PALETTE.red,
					depth: 3,
				});
			}
			g.sfx(SFX.bossWarn);
		}
		if (e.aiTimer2 >= b.shotgunEvery) {
			e.aiTimer2 = 0;
			const base = Math.atan2(dy, dx);
			for (let i = 0; i < b.shotgunPellets; i++) {
				const a =
					base +
					(i - (b.shotgunPellets - 1) / 2) * (b.shotgunSpread / (b.shotgunPellets - 1));
				g.enemyShots.fire({
					texture: TEX.projEnemy,
					x: e.x,
					y: e.y,
					dirX: Math.cos(a),
					dirY: Math.sin(a),
					speed: b.shotSpeed,
					damage: b.shotDamage * dmgMul(g.state.wave),
					range: 600,
					radius: 3,
				});
			}
		}
		if (Math.abs(dx) > 2) e.setFlipX(dx < 0);
		return true;
	}

	/** Resolves the third boss's slams when their warning ends. */
	private updateSlams(dt: number): void {
		const g = this.game;
		for (let i = this.slams.length - 1; i >= 0; i--) {
			const s = this.slams[i];
			if (!s) continue;
			s.t -= dt;
			if (s.t > 0) continue;
			this.slams.splice(i, 1);
			g.fx.flashSprite(TEX.fxNova, s.x, s.y, 0.25, {
				scale: (BOSS3.slamRadius * 2) / 64,
				tint: PALETTE.orange,
			});
			g.shake(100, 0.006);
			if (Math.hypot(g.player.x - s.x, g.player.y - s.y) <= BOSS3.slamRadius) {
				g.combat.hurtPlayer(BOSS3.slamDamage * dmgMul(g.state.wave));
			}
		}
	}

	/** Boss AI: slow chase, radial burst every 4 s, telegraphed charge every 7 s. */
	private bossAi(e: Enemy, dt: number): boolean {
		const g = this.game;
		const body = e.arcadeBody;
		e.aiTimer += dt;
		if (e.aiTimer >= BOSS.burstEvery && e.aiState !== 2) {
			e.aiTimer = 0;
			const offset = g.rng.range(0, Math.PI * 2);
			for (let i = 0; i < BOSS.burstShots; i++) {
				const a = offset + (i / BOSS.burstShots) * Math.PI * 2;
				g.enemyShots.fire({
					texture: TEX.projEnemy,
					x: e.x,
					y: e.y,
					dirX: Math.cos(a),
					dirY: Math.sin(a),
					speed: BOSS.burstSpeed,
					damage: BOSS.burstDamage * dmgMul(g.state.wave),
					range: 700,
					radius: 3,
				});
			}
		}
		const dx = g.player.x - e.x;
		const dy = g.player.y - e.y;
		const dist = Math.hypot(dx, dy) || 1;
		if (e.aiState === 0) {
			e.aiTimer2 += dt;
			body.setVelocity((dx / dist) * e.speed, (dy / dist) * e.speed);
			if (e.aiTimer2 >= BOSS.chargeEvery) {
				e.aiState = 1;
				e.aiTimer2 = 0;
				e.chargeX = dx / dist;
				e.chargeY = dy / dist;
				g.sfx(SFX.bossWarn);
			}
		} else if (e.aiState === 1) {
			e.aiTimer2 += dt;
			body.setVelocity(0, 0);
			const blink = Math.floor(e.aiTimer2 * 10) % 2 === 0;
			e.setTint(blink ? PALETTE.red : 0xffffff);
			this.bossLine
				.setVisible(true)
				.setPosition(e.x, e.y)
				.setRotation(Math.atan2(e.chargeY, e.chargeX))
				.setScale(BOSS.chargeSpeed * BOSS.chargeDuration * 0.5, e.radius);
			if (e.aiTimer2 >= BOSS.chargeWarn) {
				e.aiState = 2;
				e.aiTimer2 = 0;
				e.restoreTint();
				this.bossLine.setVisible(false);
			}
		} else {
			e.aiTimer2 += dt;
			body.setVelocity(e.chargeX * BOSS.chargeSpeed, e.chargeY * BOSS.chargeSpeed);
			if (e.aiTimer2 >= BOSS.chargeDuration) {
				e.aiState = 0;
				e.aiTimer2 = 0;
			}
		}
		if (Math.abs(dx) > 2) e.setFlipX(dx < 0);
		return true;
	}
}
