import Phaser from 'phaser';
import type { GameSpeed, HeroId } from '../config/constants';
import { getParams, getSave, persist } from '../core/context';
import { GameEvents } from '../core/events';
import { gamepadMove } from '../core/gamepad';
import { anyDown, createMoveKeys, type MoveKeys } from '../core/input';
import { trackZoom } from '../core/viewport';
import { ECONOMY } from '../data/economy';
import { HEROES } from '../data/heroes';
import { SIGNATURE, type SignatureWeapon } from '../data/weapons';
import type { Enemy } from '../entities/Enemy';
import { Hero } from '../entities/Hero';
import { evaluateAchievements } from '../logic/achievements';
import { inputToWorld } from '../logic/iso';
import { addXp, type LevelState, orbXp, roundEndFish } from '../logic/progression';
import { Rng, randomSeed } from '../logic/rng';
import { cycle, isBossRound } from '../logic/round';
import { createRunState, healHero, type RunState, startRound } from '../logic/run-state';
import {
	addFeat,
	liveProgress,
	type RunOutcome,
	type RunRecord,
	recordRunEnd,
} from '../logic/save';
import { nextSpeed } from '../logic/speed';
import { heroStats, type PlayerStats } from '../logic/stats';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { FxSystem } from '../systems/FxSystem';
import { type PickupKind, PickupSystem } from '../systems/PickupSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { ChunkManager } from '../world/ChunkManager';

/** Padding (screen px) around the camera view where chunks are already built. */
const VIEW_PAD = 96;
const DEATH_DELAY = 1.2;
/** Seconds between live achievement checks. */
const ACHIEVEMENT_CHECK = 1;

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
	private outcome: RunOutcome = 'death';
	private pickups!: PickupSystem;
	/** Persistent hero level/XP, updated live as orbs are collected. */
	level!: LevelState;
	private levelsGained = 0;
	private startedAt = 0;
	private achievementTimer = 0;

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
		const save = getSave(this);
		const heroSave = save.heroes[heroId];
		this.level = { level: heroSave.level, xp: heroSave.xp };
		this.levelsGained = 0;
		this.startedAt = Date.now();
		this.achievementTimer = 0;
		this.outcome = 'death';
		this.stats = heroStats(heroDef, heroSave.level, heroSave.points);
		this.run = createRunState(heroDef, { seed, round: params.round, tier });
		this.run.maxHp = this.stats.maxHp;
		this.run.hp = this.stats.maxHp;
		this.keys = createMoveKeys(this);
		this.input.keyboard
			?.addKey(Phaser.Input.Keyboard.KeyCodes.TAB)
			.on('down', () => this.setSpeed(nextSpeed(this.speed)));

		this.chunks = new ChunkManager(this, seed, 'antarctica');
		this.fx = new FxSystem(this);
		this.pickups = new PickupSystem(this, (kind, value) => this.collect(kind, value));
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
			() => this.die('death'),
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
			this.fx.update(dt);
			if (this.deadFor >= DEATH_DELAY) this.endRun();
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
		this.pickups.update(dt, this.hero.x, this.hero.y, this.stats.pickupRange);
		this.checkAchievements(dt);
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
		if (e.def.behavior !== 'boss') run.superCharge += e.elite ? 3 : 1;
		this.pickups.drop('xp', orbXp(e.def.xp, run.round), e.x, e.y);
		const f = ECONOMY.fish;
		const fish =
			e.def.behavior === 'boss'
				? f.bossPerCycle * (1 + cycle(run.round))
				: e.elite === 'orange'
					? f.eliteOrange
					: e.elite === 'purple'
						? f.elitePurple
						: this.rng.next() < f.commonChance
							? 1
							: 0;
		if (fish > 0) this.pickups.drop('fish', fish, e.x + 6, e.y + 6);
		if (e.def.behavior === 'boss') this.onBossKilled();
	}

	private collect(kind: PickupKind, value: number): void {
		if (kind === 'fish') {
			this.run.fish += value;
			return;
		}
		if (kind === 'meat') {
			healHero(this.run, value);
			return;
		}
		const xp = value * this.stats.xpGain;
		this.run.xp += xp;
		const gained = addXp(this.level, xp);
		if (gained > 0) {
			this.levelsGained += gained;
			this.fx.banner(this.hero.x, this.hero.y, 'fx.levelUp');
		}
	}

	/** Bob unlocks on the first round-10 boss kill, Lucia on round 20 (P-17). */
	private onBossKilled(): void {
		const save = getSave(this);
		addFeat(save, 'bossBear');
		if (this.run.round >= 10 && !save.heroes.bob.unlocked) {
			save.heroes.bob.unlocked = true;
			addFeat(save, 'unlockBob');
			this.fx.banner(this.hero.x, this.hero.y, 'unlock.bob');
		}
		if (this.run.round >= 20 && !save.heroes.lucia.unlocked) {
			save.heroes.lucia.unlocked = true;
			addFeat(save, 'unlockLucia');
			this.fx.banner(this.hero.x, this.hero.y, 'unlock.lucia');
		}
		persist(this);
	}

	private checkAchievements(dt: number): void {
		this.achievementTimer -= dt;
		if (this.achievementTimer > 0) return;
		this.achievementTimer = ACHIEVEMENT_CHECK;
		const save = getSave(this);
		const progress = liveProgress(save, this.run, this.run.counters, this.level.level);
		const fresh = evaluateAchievements(progress, save.achievements, Date.now());
		if (fresh.length > 0) {
			persist(this);
			this.game.events.emit(GameEvents.AchievementsUnlocked, fresh);
		}
	}

	private die(outcome: RunOutcome): void {
		if (this.deadFor >= 0) return;
		this.outcome = outcome;
		this.deadFor = 0;
		this.fx.bloodAt(this.hero.x, this.hero.y, 2);
	}

	/** Banks XP/Fish, records history and achievements, then shows the game over screen. */
	private endRun(): void {
		const save = getSave(this);
		const run = this.run;
		const heroSave = save.heroes[run.hero];
		heroSave.level = this.level.level;
		heroSave.xp = this.level.xp;
		save.fish += run.fish;
		run.counters.fishEarned = run.fish;
		run.counters.damageDealt = run.damageDealt;
		run.counters.secondsPlayed = run.elapsed;
		const record: RunRecord = {
			id: `${this.startedAt}-${run.seed}`,
			startedAt: this.startedAt,
			endedAt: Date.now(),
			hero: run.hero,
			heroLevel: this.level.level,
			tier: run.tier,
			round: run.round,
			outcome: this.outcome,
			durationSec: Math.round(run.elapsed),
			kills: run.kills,
			damageDealt: Math.round(run.damageDealt),
			fishEarned: run.fish,
			xpEarned: Math.round(run.xp),
			levelsGained: this.levelsGained,
			secondaries: [],
			cards: [],
			seed: run.seed,
		};
		const previousBest = save.progress.hero[run.hero].bestRound;
		const fresh = recordRunEnd(save, record, run.counters, Date.now());
		persist(this);
		if (fresh.length > 0) this.game.events.emit(GameEvents.AchievementsUnlocked, fresh);
		this.scene.stop('Hud');
		this.scene.start('GameOver', { record, newBest: run.round > previousBest });
	}

	private checkRoundEnd(): void {
		const run = this.run;
		if (isBossRound(run.round)) {
			if (!this.enemies.boss) this.nextRound();
			else if (run.timeLeft <= 0) this.die('bossTimeout');
			return;
		}
		if (run.timeLeft <= 0) this.nextRound();
	}

	private nextRound(): void {
		for (const e of [...this.enemies.active]) this.fx.bloodAt(e.x, e.y, e.radius / 10);
		this.enemies.clear();
		this.weapons.clear();
		this.run.fish += roundEndFish(this.run.round);
		this.pickups.collectAll();
		startRound(this.run, this.run.round + 1);
		this.enemies.startRound(this.run.round, this.hero, this.viewSize());
	}
}
