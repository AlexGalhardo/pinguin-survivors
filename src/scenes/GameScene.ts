import Phaser from 'phaser';
import {
	ARENA_H,
	ARENA_W,
	CAMERA_DEADZONE_H,
	CAMERA_DEADZONE_W,
	MAX_PROJECTILES,
} from '../config/constants';
import { getParams } from '../core/context';
import { bus, type EventBus, GameEvent } from '../core/events';
import { createMoveKeys, type MoveKeys } from '../core/input';
import { getView } from '../core/viewport';
import { CHARACTERS } from '../data/characters';
import { CONTACT_COOLDOWN, type EnemyType, WAVE_FLOW } from '../data/enemies';
import { debugStats } from '../debug/debug-stats';
import type { DebugParams } from '../debug/params';
import { createArena, PLAY_AREA } from '../entities/Arena';
import type { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import type { Projectile } from '../entities/Projectile';
import { Rng, randomSeed } from '../logic/rng';
import { createRunState, type RunState, runStats } from '../logic/run-state';
import { finalMaxHp, finalMoveSpeed, type Stats } from '../logic/stats';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { FxSystem } from '../systems/FxSystem';
import { PickupSystem } from '../systems/PickupSystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { WeaponSystem } from '../systems/WeaponSystem';

/** Main gameplay scene: arena, player and every combat system. */
export class GameScene extends Phaser.Scene {
	params!: DebugParams;
	state!: RunState;
	stats!: Stats;
	rng!: Rng;
	events$!: EventBus;
	player!: Player;
	enemies!: EnemySystem;
	enemyShots!: ProjectileSystem;
	playerShots!: ProjectileSystem;
	spawner!: SpawnSystem;
	combat!: CombatSystem;
	fx!: FxSystem;
	pickups!: PickupSystem;
	weapons!: WeaponSystem;
	waves!: WaveSystem;
	/** True once the run ended (game over); gameplay updates stop. */
	runOver = false;
	private keys!: MoveKeys;

	constructor() {
		super('Game');
	}

	create(): void {
		this.params = getParams(this);
		this.events$ = bus(this.game);
		const seed = this.params.seed ?? randomSeed();
		this.rng = new Rng(seed);
		this.state = createRunState(this.params.char ?? 'warrior', seed, this.params.wave ?? 1);

		const walls = createArena(this, this.rng);
		this.physics.world.setBounds(PLAY_AREA.x, PLAY_AREA.y, PLAY_AREA.width, PLAY_AREA.height);
		const def = CHARACTERS[this.state.character];
		this.player = new Player(this, ARENA_W / 2, ARENA_H / 2, def);
		this.physics.add.collider(this.player, walls);
		this.keys = createMoveKeys(this);

		this.enemyShots = new ProjectileSystem(this, MAX_PROJECTILES, 9);
		this.playerShots = new ProjectileSystem(this, MAX_PROJECTILES, 8);
		this.enemies = new EnemySystem(this, this.player, this.enemyShots);
		this.spawner = new SpawnSystem(this, this.enemies, this.player, this.rng);
		this.spawner.setWave(this.state.wave);
		this.combat = new CombatSystem(this);
		this.fx = new FxSystem(this);
		this.pickups = new PickupSystem(this, this.player);
		this.pickups.onCollect = (kind, value) => this.onPickup(kind, value);
		this.runOver = false;

		this.physics.add.overlap(this.player, this.enemies.group, (_p, e) =>
			this.onEnemyContact(e as Enemy),
		);
		this.physics.add.overlap(this.player, this.enemyShots.group, (_p, s) =>
			this.onEnemyShot(s as Projectile),
		);

		this.physics.add.overlap(this.playerShots.group, this.enemies.group, (s, e) =>
			this.combat.projectileHit(s as Projectile, e as Enemy),
		);

		this.refreshStats();
		this.weapons = new WeaponSystem(this);
		this.waves = new WaveSystem(this);
		this.setupCamera();

		this.scene.launch('Hud');
		if (this.params.debug) this.scene.bringToTop('Debug');
		this.waves.start(this.state.wave);
	}

	/** Between waves: card pick (1.6) and shop (1.10); for now straight to the next wave. */
	onWaveEnded(wave: number): void {
		this.time.delayedCall(WAVE_FLOW.intermission * 1000, () => this.waves.start(wave + 1));
	}

	/** Plays a sound effect (wired to the AudioSystem in 1.9). */
	sfx(_key: string): void {}

	shake(durationMs: number, intensity: number): void {
		this.cameras.main.shake(durationMs, intensity);
	}

	onBossDamaged(boss: Enemy): void {
		this.events$.emit(GameEvent.BossHpChanged, { hp: Math.max(0, boss.hp), maxHp: boss.maxHp });
	}

	/** Rare medkit drop (1.10). */
	maybeDropMedkit(_x: number, _y: number): void {}

	private onPickup(kind: 'gold' | 'medkit', value: number): void {
		if (kind === 'gold') {
			this.state.gold += value;
			this.state.totals.goldEarned += value;
			this.events$.emit(GameEvent.GoldChanged, { gold: this.state.gold });
		}
	}

	/** Called when HP reaches 0: emits PLAYER_DIED; revive (1.6) or game over. */
	onPlayerDied(): void {
		const canRevive = this.state.revives > 0;
		this.events$.emit(GameEvent.PlayerDied, { canRevive });
		if (!canRevive) this.endRun();
	}

	/** Stops the run (the GameOverScene arrives in 1.11). */
	endRun(): void {
		this.runOver = true;
		this.physics.pause();
		this.player.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL).setAlpha(0.6);
		this.events$.emit(GameEvent.RunEnded, undefined);
	}

	/** Re-applies derived stats (speed, max HP…) after cards/items change the run. */
	refreshStats(): void {
		this.stats = runStats(this.state);
		this.player.speed = finalMoveSpeed(this.player.def.speed, this.stats);
		this.state.hp = Math.min(this.state.hp, this.maxHp);
		this.emitHp();
	}

	get maxHp(): number {
		return finalMaxHp(this.stats);
	}

	emitHp(): void {
		this.events$.emit(GameEvent.PlayerHpChanged, {
			hp: this.state.hp,
			maxHp: this.maxHp,
			revives: this.state.revives,
		});
	}

	private onEnemyContact(e: Enemy): void {
		if (!e.active || e.contactCooldown > 0) return;
		if (this.combat.hurtPlayer(e.damage)) e.contactCooldown = CONTACT_COOLDOWN;
	}

	private onEnemyShot(s: Projectile): void {
		if (!s.active) return;
		if (this.combat.hurtPlayer(s.damage)) s.release();
	}

	/** Debug helper: queues `n` enemies of a type (telegraphed). */
	debugSpawn(type: EnemyType, n = 1): void {
		for (let i = 0; i < n; i++) this.spawner.queueGroup(type, 1);
	}

	private setupCamera(): void {
		const cam = this.cameras.main;
		cam.setBounds(0, 0, ARENA_W, ARENA_H);
		cam.startFollow(this.player, true);
		cam.setDeadzone(CAMERA_DEADZONE_W, CAMERA_DEADZONE_H);
		const apply = () => {
			cam.setSize(this.scale.width, this.scale.height);
			cam.setZoom(getView(this).zoom);
		};
		apply();
		this.scale.on('resize', apply);
		this.events.once('shutdown', () => this.scale.off('resize', apply));
	}

	override update(time: number, deltaMs: number): void {
		const dt = Math.min(deltaMs, 50) / 1000;
		this.fx.update(dt);
		if (this.runOver) return;
		this.pickups.update(dt, this.stats.pickupRange);
		this.player.tick(dt);
		if (!this.waves.inCombat) {
			this.player.arcadeBody.setVelocity(0, 0);
		} else {
			this.state.totals.timeSec += dt;
			this.player.handleInput(this.keys);
			this.waves.update(dt);
			this.spawner.tick(dt, time);
			this.enemies.rebuildGrid();
			this.enemies.update(dt);
			this.weapons.update(dt);
			this.enemyShots.update(dt);
			this.playerShots.update(dt);
			this.combat.update(dt);
		}

		debugStats.enemies = this.enemies.aliveCount;
		debugStats.projectiles = this.playerShots.activeCount;
		debugStats.enemyProjectiles = this.enemyShots.activeCount;
		debugStats.bodies = this.physics.world.bodies.size + this.physics.world.staticBodies.size;
	}
}
