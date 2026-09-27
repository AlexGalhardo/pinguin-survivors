import Phaser from 'phaser';
import type { GameSpeed, HeroId } from '../config/constants';
import { getParams } from '../core/context';
import { gamepadMove } from '../core/gamepad';
import { anyDown, createMoveKeys, type MoveKeys } from '../core/input';
import { trackZoom } from '../core/viewport';
import { COMBAT } from '../data/combat';
import { HEROES } from '../data/heroes';
import { SIGNATURE, type SignatureWeapon } from '../data/weapons';
import type { Enemy } from '../entities/Enemy';
import { Hero } from '../entities/Hero';
import { resolveIncoming } from '../logic/combat';
import { inputToWorld } from '../logic/iso';
import { Rng, randomSeed } from '../logic/rng';
import { isBossRound } from '../logic/round';
import {
	createRunState,
	damageHero,
	healHero,
	type RunState,
	startRound,
} from '../logic/run-state';
import { nextSpeed } from '../logic/speed';
import { EnemySystem } from '../systems/EnemySystem';
import { FxSystem } from '../systems/FxSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { ChunkManager } from '../world/ChunkManager';

/** Padding (screen px) around the camera view where chunks are already built. */
const VIEW_PAD = 96;
const HERO_RADIUS = 12;
const RESTART_DELAY = 1.5;

export class GameScene extends Phaser.Scene {
	hero!: Hero;
	chunks!: ChunkManager;
	run!: RunState;
	enemies!: EnemySystem;
	/** Multiplies simulation dt, scene timers and tweens (TAB toggles 1x/2x). */
	speed: GameSpeed = 1;
	private keys!: MoveKeys;
	private weapons!: WeaponSystem;
	private fx!: FxSystem;
	private rng!: Rng;
	private iFrames = 0;
	private deadFor = -1;
	private god = false;

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
		this.god = params.god;
		this.iFrames = 0;
		this.deadFor = -1;
		this.speed = 1;
		this.run = createRunState(heroDef, { seed, round: params.round, tier });
		this.keys = createMoveKeys(this);
		this.input.keyboard
			?.addKey(Phaser.Input.Keyboard.KeyCodes.TAB)
			.on('down', () => this.setSpeed(nextSpeed(this.speed)));

		this.chunks = new ChunkManager(this, seed, 'antarctica');
		this.fx = new FxSystem(this);
		this.hero = new Hero(this, heroId, tier, heroDef.moveSpeed);
		this.enemies = new EnemySystem(this, this.rng);
		this.weapons = new WeaponSystem(
			this,
			this.rng,
			heroDef,
			SIGNATURE[heroId][tier - 1] as SignatureWeapon,
			(e, amount, crit) => this.hitEnemy(e, amount, crit),
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
		healHero(run, HEROES[run.hero].regen * dt);

		const view = this.viewSize();
		this.enemies.update(dt, run.round, this.hero, view);
		this.weapons.update(dt, this.hero.x, this.hero.y, this.enemies.grid);
		this.contactDamage(dt);
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

	private hitEnemy(e: Enemy, amount: number, crit: boolean): void {
		if (!e.alive) return;
		e.hp -= amount;
		e.hitFlash = 0.08;
		this.run.damageDealt += amount;
		this.fx.damage(e.x, e.y, amount, crit);
		// Small knockback away from the hero (bosses shrug it off).
		if (e.def.behavior !== 'boss') {
			const dx = e.x - this.hero.x;
			const dy = e.y - this.hero.y;
			const d = Math.hypot(dx, dy) || 1;
			const push = (COMBAT.knockback * 0.05) / (e.elite ? 2 : 1);
			e.x += (dx / d) * push;
			e.y += (dy / d) * push;
		}
		if (e.hp <= 0) this.killEnemy(e);
	}

	private killEnemy(e: Enemy): void {
		const run = this.run;
		run.kills++;
		run.xp += e.def.xp;
		if (e.def.behavior !== 'boss') run.superCharge += e.elite ? 3 : 1;
		const size = e.radius / 10;
		this.fx.bloodAt(e.x, e.y, size);
		for (let i = 0; i < 2; i++)
			this.fx.bloodAt(
				e.x + this.rng.range(-14, 14),
				e.y + this.rng.range(-14, 14),
				size * 0.5,
			);
		this.enemies.kill(e);
	}

	private contactDamage(dt: number): void {
		this.iFrames -= dt;
		if (this.iFrames > 0 || this.god) return;
		const heroDef = HEROES[this.run.hero];
		const near = this.enemies.grid.queryRadius(this.hero.x, this.hero.y, 64);
		for (const e of near) {
			const dx = e.x - this.hero.x;
			const dy = e.y - this.hero.y;
			if (dx * dx + dy * dy > (e.radius + HERO_RADIUS) ** 2) continue;
			const result = resolveIncoming(
				e.damage,
				heroDef,
				{ contact: true },
				{ dodge: this.rng.next(), parry: this.rng.next() },
			);
			this.iFrames = COMBAT.heroIFrames;
			if (result.kind === 'hit') {
				this.hero.flash();
				if (damageHero(this.run, result.amount)) this.deadFor = 0;
			} else if (result.kind === 'parried') {
				this.hitEnemy(e, result.reflected, false);
			}
			return;
		}
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
