import Phaser from 'phaser';
import type { GameSpeed, HeroId } from '../config/constants';
import { getParams } from '../core/context';
import { gamepadMove } from '../core/gamepad';
import { anyDown, createMoveKeys, type MoveKeys } from '../core/input';
import { trackZoom } from '../core/viewport';
import { HEROES } from '../data/heroes';
import { SIGNATURE, type SignatureWeapon } from '../data/weapons';
import type { Enemy } from '../entities/Enemy';
import { Hero } from '../entities/Hero';
import { inputToWorld } from '../logic/iso';
import { Rng, randomSeed } from '../logic/rng';
import { isBossRound } from '../logic/round';
import { createRunState, healHero, type RunState, startRound } from '../logic/run-state';
import { nextSpeed } from '../logic/speed';
import { heroStats, type PlayerStats } from '../logic/stats';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { FxSystem } from '../systems/FxSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { ChunkManager } from '../world/ChunkManager';

/** Padding (screen px) around the camera view where chunks are already built. */
const VIEW_PAD = 96;
const RESTART_DELAY = 1.5;

export class GameScene extends Phaser.Scene {
	hero!: Hero;
	chunks!: ChunkManager;
	run!: RunState;
	stats!: PlayerStats;
	enemies!: EnemySystem;
	/** Multiplies simulation dt, scene timers and tweens (TAB toggles 1x/2x). */
	speed: GameSpeed = 1;
	private keys!: MoveKeys;
	private weapons!: WeaponSystem;
	private combat!: CombatSystem;
	private fx!: FxSystem;
	private rng!: Rng;
	private deadFor = -1;

	constructor() {
		super('Game');
	}

	create(): void {
		const params = getParams(this);
		const heroId: HeroId = params.hero ?? 'jack';
		const heroDef = HEROES[heroId];
		const seed = params.seed ?? randomSeed();
		const tier = params.tier ?? 1;
		this.rng = new Rng(seed);
		this.deadFor = -1;
		this.speed = 1;
		this.stats = heroStats(heroDef, 1, {});
		this.run = createRunState(heroDef, { seed, round: params.round, tier });
		this.run.maxHp = this.stats.maxHp;
		this.run.hp = this.stats.maxHp;
		this.keys = createMoveKeys(this);
		this.input.keyboard
			?.addKey(Phaser.Input.Keyboard.KeyCodes.TAB)
			.on('down', () => this.setSpeed(nextSpeed(this.speed)));

		this.chunks = new ChunkManager(this, seed, 'antarctica');
		this.fx = new FxSystem(this);
		this.hero = new Hero(this, heroId, tier, this.stats);
		this.enemies = new EnemySystem(this, this.rng, (e, t) => this.combat.dot(e, t));
		this.combat = new CombatSystem(
			this.rng,
			this.run,
			this.stats,
			this.hero,
			this.enemies,
			this.fx,
			(e) => this.onKill(e),
			() => {
				this.deadFor = 0;
			},
		);
		this.combat.god = params.god;
		this.weapons = new WeaponSystem(
			this,
			this.rng,
			this.stats,
			SIGNATURE[heroId][tier - 1] as SignatureWeapon,
			(e, amount, crit, element, bleedChance) =>
				this.combat.weaponHit(e, amount, crit, { element, bleedChance }),
			(x, y, a, r) => this.fx.slash(x, y, a, r),
		);

		const cam = this.cameras.main;
		trackZoom(this, cam);
		cam.startFollow(this.hero.sprite, true, 0.12, 0.12);
		cam.centerOn(this.hero.sprite.x, this.hero.sprite.y);
		this.enemies.startRound(this.run.round, this.hero, this.viewSize());

		this.scene.launch('Hud');
		this.events.once('shutdown', () => this.chunks.destroy());
	}

	override update(_time: number, deltaMs: number): void {
		const dt = (Math.min(deltaMs, 50) / 1000) * this.speed;
		if (this.deadFor >= 0) {
			this.deadFor += dt;
			if (this.deadFor >= RESTART_DELAY) this.scene.restart();
			return;
		}
		const run = this.run;
		run.elapsed += dt;
		run.timeLeft -= dt;

		const k = this.keys;
		let ix = (anyDown(k.right) ? 1 : 0) - (anyDown(k.left) ? 1 : 0);
		let iy = (anyDown(k.down) ? 1 : 0) - (anyDown(k.up) ? 1 : 0);
		if (ix === 0 && iy === 0 && gamepadMove.connected) {
			ix = gamepadMove.x;
			iy = gamepadMove.y;
		}
		this.hero.update(dt, inputToWorld(ix, iy));
		healHero(run, this.stats.regen * dt);

		this.enemies.update(dt, run.round, this.hero, this.viewSize());
		this.weapons.update(dt, this.hero.x, this.hero.y, this.enemies.grid);
		this.combat.contact(dt);
		this.fx.update(dt);
		this.checkRoundEnd();

		const v = this.cameras.main.worldView;
		this.chunks.update({
			x: v.x - VIEW_PAD,
			y: v.y - VIEW_PAD,
			width: v.width + VIEW_PAD * 2,
			height: v.height + VIEW_PAD * 2,
		});
	}

	setSpeed(speed: GameSpeed): void {
		this.speed = speed;
		this.time.timeScale = speed;
		this.tweens.timeScale = speed;
	}

	private viewSize(): { width: number; height: number } {
		const v = this.cameras.main.worldView;
		return { width: v.width, height: v.height };
	}

	private onKill(e: Enemy): void {
		const run = this.run;
		run.xp += e.def.xp;
		if (e.def.behavior !== 'boss') run.superCharge += e.elite ? 3 : 1;
	}

	private checkRoundEnd(): void {
		const run = this.run;
		if (isBossRound(run.round)) {
			if (!this.enemies.boss) this.nextRound();
			else if (run.timeLeft <= 0) this.deadFor = 0;
			return;
		}
		if (run.timeLeft <= 0) this.nextRound();
	}

	private nextRound(): void {
		for (const e of [...this.enemies.active]) this.fx.bloodAt(e.x, e.y, e.radius / 10);
		this.enemies.clear();
		this.weapons.clear();
		startRound(this.run, this.run.round + 1);
		this.enemies.startRound(this.run.round, this.hero, this.viewSize());
	}
}
