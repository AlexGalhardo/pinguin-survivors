import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import type { GameSpeed, HeroId } from '../config/constants';
import { PALETTE } from '../config/palette';
import { getParams, getSave, persist } from '../core/context';
import { GameEvents } from '../core/events';
import { gamepadMove } from '../core/gamepad';
import { anyDown, createMoveKeys, type MoveKeys } from '../core/input';
import { trackZoom } from '../core/viewport';
import { ECONOMY } from '../data/economy';
import { ENEMIES } from '../data/enemies';
import { HEROES } from '../data/heroes';
import { levelScale, PERKS } from '../data/secondaries';
import { SUPER } from '../data/superpowers';
import { SIGNATURE, type SignatureWeapon } from '../data/weapons';
import type { Enemy } from '../entities/Enemy';
import { Hero } from '../entities/Hero';
import { evaluateAchievements } from '../logic/achievements';
import { applyCard, type Build, emptyBuild } from '../logic/build';
import { type CardOffer, drawCards } from '../logic/cards';
import type { Element } from '../logic/combat';
import { inArc } from '../logic/geometry';
import { inputToWorld, isoDepth, worldToScreen } from '../logic/iso';
import { addXp, type LevelState, orbXp, roundEndFish } from '../logic/progression';
import { Rng, randomSeed } from '../logic/rng';
import { cycle, isBossRound } from '../logic/round';
import { countRun, createRunState, healHero, type RunState, startRound } from '../logic/run-state';
import {
	addFeat,
	liveProgress,
	type RunOutcome,
	type RunRecord,
	recordRunEnd,
} from '../logic/save';
import { nextSpeed } from '../logic/speed';
import { heroStats, type PlayerStats } from '../logic/stats';
import { addCharge, chargeFor, superReady, superUnlocked } from '../logic/superpower';
import { AreaSystem } from '../systems/AreaSystem';
import { CombatSystem, HERO_RADIUS } from '../systems/CombatSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { FxSystem } from '../systems/FxSystem';
import { HostileSystem } from '../systems/HostileSystem';
import { type PickupKind, PickupSystem } from '../systems/PickupSystem';
import { ProjectilePool } from '../systems/ProjectilePool';
import { SecondarySystem } from '../systems/SecondarySystem';
import { SuperpowerSystem } from '../systems/SuperpowerSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { ChunkManager } from '../world/ChunkManager';
import type { CardPickData } from './CardPickScene';

/** Padding (screen px) around the camera view where chunks are already built. */
const VIEW_PAD = 96;
const DEATH_DELAY = 1.2;
/** Seconds between live achievement checks. */
const ACHIEVEMENT_CHECK = 1;
const ATTUNEMENT_WINDOW = 4;
const REFLEX_WINDOW = 2;
const BLOODLUST_RADIUS = 150;

export class GameScene extends Phaser.Scene {
	hero!: Hero;
	chunks!: ChunkManager;
	run!: RunState;
	stats!: PlayerStats;
	build!: Build;
	enemies!: EnemySystem;
	superpower!: SuperpowerSystem;
	/** Persistent hero level/XP, updated live as orbs are collected. */
	level!: LevelState;
	/** Multiplies simulation dt, scene timers and tweens (TAB toggles 1x/2x). */
	speed: GameSpeed = 1;
	private keys!: MoveKeys;
	private weapons!: WeaponSystem;
	private secondaries!: SecondarySystem;
	private pool!: ProjectilePool;
	private area!: AreaSystem;
	private combat!: CombatSystem;
	private fx!: FxSystem;
	private pickups!: PickupSystem;
	private hostile!: HostileSystem;
	private rng!: Rng;
	private deadFor = -1;
	private outcome: RunOutcome = 'death';
	private levelsGained = 0;
	private startedAt = 0;
	private achievementTimer = 0;
	private moving = false;
	private reflexTime = 0;
	private barrierReady = false;
	private barrierTimer = 0;
	private barrier!: Phaser.GameObjects.Image;
	private readonly elementUsedAt = new Map<Element, number>();
	private readonly scratch: Enemy[] = [];

	constructor() {
		super('Game');
	}

	get superIsUnlocked(): boolean {
		return superUnlocked(this.level.level);
	}

	create(): void {
		const params = getParams(this);
		const save = getSave(this);
		const heroId: HeroId = params.hero ?? 'jack';
		const heroDef = HEROES[heroId];
		const heroSave = save.heroes[heroId];
		const seed = params.seed ?? randomSeed();
		const tier = params.tier ?? 1;
		this.rng = new Rng(seed);
		this.deadFor = -1;
		this.outcome = 'death';
		this.speed = 1;
		this.levelsGained = 0;
		this.startedAt = Date.now();
		this.achievementTimer = 0;
		this.reflexTime = 0;
		this.barrierReady = false;
		this.barrierTimer = 0;
		this.elementUsedAt.clear();
		this.level = { level: heroSave.level, xp: heroSave.xp };
		this.stats = heroStats(heroDef, heroSave.level, heroSave.points);
		this.build = emptyBuild(tier);
		this.run = createRunState(heroDef, { seed, round: params.round, tier });
		this.run.maxHp = this.stats.maxHp;
		this.run.hp = this.stats.maxHp;

		this.keys = createMoveKeys(this);
		const kb = this.input.keyboard;
		kb?.addKey(Phaser.Input.Keyboard.KeyCodes.TAB).on('down', () =>
			this.setSpeed(nextSpeed(this.speed)),
		);
		kb?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', () => this.castSuper());

		this.chunks = new ChunkManager(this, seed, 'antarctica');
		this.fx = new FxSystem(this);
		this.pickups = new PickupSystem(this, (kind, value) => this.collect(kind, value));
		this.hero = new Hero(this, heroId, tier, this.stats);
		this.barrier = this.add.image(0, 0, KEYS.barrier).setVisible(false);
		this.hostile = new HostileSystem(this, (damage) => this.combat.heroHit(damage, false));
		this.enemies = new EnemySystem(this, this.rng, (e, t) => this.combat.dot(e, t), {
			shoot: (e) =>
				this.hostile.spawn(
					e.x,
					e.y,
					this.hero.x,
					this.hero.y,
					220,
					(e.def.range ?? 200) * 1.4,
					e.damage,
				),
			explode: (e) => this.explode(e),
			swipe: (e) => this.swipe(e),
			summon: (e) => this.summon(e),
		});
		this.combat = new CombatSystem(
			this.rng,
			this.run,
			this.stats,
			this.hero,
			this.enemies,
			this.fx,
			(e) => this.onKill(e),
			() => this.die('death'),
			{
				critBleed: false,
				absorb: () => this.absorbWithBarrier(),
				onDodge: () => this.onDodge(),
				onParry: () => this.onParry(),
				onHurt: (source) => this.onHurt(source),
			},
		);
		this.combat.god = params.god;
		this.pool = new ProjectilePool(this, (e, p) =>
			this.combat.weaponHit(e, p.damage, p.crit, {
				element: p.element,
				bleedChance: p.bleedChance,
			}),
		);
		this.area = new AreaSystem(this, (e, amount, element, poison) =>
			this.combat.weaponHit(e, amount, false, { element, poison, noChain: true }),
		);
		this.weapons = new WeaponSystem(
			this.rng,
			this.stats,
			SIGNATURE[heroId][tier - 1] as SignatureWeapon,
			this.pool,
			(e, amount, crit, bleedChance) =>
				this.combat.weaponHit(e, amount, crit, { bleedChance }),
			(x, y, a, r) => this.fx.slash(x, y, a, r),
			(element) => this.elementUsedAt.set(element, this.run.elapsed),
		);
		this.secondaries = new SecondarySystem(
			this,
			this.rng,
			this.stats,
			this.build,
			this.pool,
			this.area,
			(e, amount, crit, element) => this.combat.weaponHit(e, amount, crit, { element }),
		);
		this.superpower = new SuperpowerSystem(
			this.rng,
			this.stats,
			this.area,
			(e, amount, element) =>
				this.combat.weaponHit(e, amount, false, { element, noChain: true }),
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
		this.moving = ix !== 0 || iy !== 0;
		this.hero.update(dt, inputToWorld(ix, iy));
		healHero(run, this.stats.regen * dt);

		const grid = this.enemies.grid;
		const view = this.viewSize();
		this.enemies.update(dt, run.round, this.hero, view);
		this.updatePerks(dt);
		this.weapons.update(dt, this.hero.x, this.hero.y, grid);
		this.secondaries.update(dt, this.hero.x, this.hero.y, grid);
		this.superpower.update(dt, this.hero.x, this.hero.y, grid, this.weapons.weapon, view);
		this.pool.update(dt, grid);
		this.hostile.update(dt, this.hero.x, this.hero.y, HERO_RADIUS);
		this.area.update(dt, grid);
		this.combat.contact(dt);
		this.pickups.update(dt, this.hero.x, this.hero.y, this.stats.pickupRange);
		this.fx.update(dt);
		this.checkAchievements(dt);
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

	// --- Perks (docs/game-design.md §5.1) -------------------------------------------------

	private updatePerks(dt: number): void {
		const p = this.build.perks;
		const bonus = this.weapons.bonus;
		let rate = 1;
		if (p.bloodlust) {
			this.scratch.length = 0;
			this.enemies.grid.queryRadius(this.hero.x, this.hero.y, BLOODLUST_RADIUS, this.scratch);
			const bleeding = this.scratch.filter((e) => e.alive && e.status.bleedStacks > 0).length;
			const s = levelScale(p.bloodlust);
			rate += Math.min(PERKS.bloodlust.cap * s, PERKS.bloodlust.value * s * bleeding);
		}
		if (p.runAndGun && this.moving) rate += PERKS.runAndGun.value * levelScale(p.runAndGun);
		bonus.rate = rate;
		bonus.bounces = p.ricochet ?? 0;
		if (p.elementalAttunement) {
			let distinct = 0;
			for (const at of this.elementUsedAt.values())
				if (this.run.elapsed - at <= ATTUNEMENT_WINDOW) distinct++;
			const s = levelScale(p.elementalAttunement);
			const perk = PERKS.elementalAttunement;
			bonus.damage = 1 + Math.min(perk.cap * s, perk.value * s * distinct);
		}
		if (this.reflexTime > 0) {
			this.reflexTime -= dt;
			if (this.reflexTime <= 0) bonus.forceCrit = false;
		}
		if (p.arcaneBarrier && !this.barrierReady) {
			this.barrierTimer -= dt;
			if (this.barrierTimer <= 0) this.barrierReady = true;
		}
		this.barrier.setVisible(this.barrierReady);
		if (this.barrierReady) {
			const s = worldToScreen(this.hero.x, this.hero.y);
			this.barrier
				.setPosition(s.x, s.y - 26)
				.setDepth(isoDepth(this.hero.x, this.hero.y) + 1);
		}
	}

	private absorbWithBarrier(): boolean {
		const level = this.build.perks.arcaneBarrier;
		if (!level || !this.barrierReady) return false;
		this.barrierReady = false;
		this.barrierTimer = PERKS.arcaneBarrier.value / levelScale(level);
		return true;
	}

	private onDodge(): void {
		if (!this.build.perks.reflex) return;
		this.weapons.bonus.forceCrit = true;
		this.reflexTime = REFLEX_WINDOW;
	}

	private onParry(): void {
		const level = this.build.perks.counterAttack;
		if (!level) return;
		const w = this.weapons.weapon;
		const damage =
			w.damage *
			this.stats.tagMul[w.tag] *
			this.stats.damage *
			PERKS.counterAttack.value *
			levelScale(level);
		const r = PERKS.counterAttack.radius;
		this.area.burst(this.enemies.grid, this.hero.x, this.hero.y, r, damage, undefined);
		this.area.flash(this.hero.x, this.hero.y, r, PALETTE.textLight, 0.2);
	}

	private onHurt(source: Enemy | undefined): void {
		const iron = this.build.perks.ironSkin;
		if (iron && source?.alive) {
			const thorns = this.stats.armor * PERKS.ironSkin.thorns * levelScale(iron);
			this.combat.damage(source, thorns, false, undefined, false);
		}
		this.secondaries.onHeroHit(this.hero.x, this.hero.y, this.enemies.grid);
	}

	// --- Enemy special attacks (docs/game-design.md §11) -----------------------------------

	/** Bloater: poison burst on the spot, hurting the hero if close; the bloater dies. */
	private explode(e: Enemy): void {
		const radius = 60;
		this.area.flash(e.x, e.y, radius, PALETTE.dotPoison, 0.4);
		this.area.zone(e.x, e.y, radius, 2, 0, { tint: PALETTE.dotPoison });
		const d = Math.hypot(this.hero.x - e.x, this.hero.y - e.y);
		if (d <= radius + HERO_RADIUS) this.combat.heroHit(e.damage, false, 'earth');
		this.combat.damage(e, e.hp + 1, false, undefined, false);
	}

	/** Boss swipe: a wide arc in front of the bear. */
	private swipe(e: Enemy): void {
		const reach = (e.def.range ?? 90) * 1.3;
		const angle = Math.atan2(this.hero.y - e.y, this.hero.x - e.x);
		const c = Math.cos(angle);
		const s = Math.sin(angle);
		this.fx.slash(e.x, e.y, Math.atan2((c + s) / 2, c - s), reach * 1.4);
		this.cameras.main.shake(120, 0.004);
		if (inArc(e.x, e.y, angle, Math.PI * 0.8, reach, this.hero.x, this.hero.y, HERO_RADIUS))
			this.combat.heroHit(e.damage * 1.5, true, undefined, e);
	}

	/** Boss roar: zombie penguins burst out around the bear. */
	private summon(e: Enemy): void {
		this.area.flash(e.x, e.y, 140, PALETTE.textLight, 0.5);
		this.cameras.main.shake(300, 0.005);
		for (let i = 0; i < 6; i++) {
			const a = (i / 6) * Math.PI * 2;
			this.enemies.spawnAt(
				ENEMIES.zombiePenguin,
				e.x + Math.cos(a) * 70,
				e.y + Math.sin(a) * 70,
			);
		}
	}

	// --- Kills, pickups, superpower -------------------------------------------------------

	private onKill(e: Enemy): void {
		const run = this.run;
		const kind = e.def.behavior === 'boss' ? 'boss' : e.elite ? 'elite' : 'common';
		run.superCharge = addCharge(run.superCharge, chargeFor(kind));
		if (this.superpower.active) this.superpower.killsThisCast++;
		this.pickups.drop('xp', orbXp(e.def.xp, run.round), e.x, e.y);
		const f = ECONOMY.fish;
		let fish = 0;
		if (kind === 'boss') fish = f.bossPerCycle * (1 + cycle(run.round));
		else if (e.elite === 'orange') fish = f.eliteOrange;
		else if (e.elite === 'purple') fish = f.elitePurple;
		else if (this.rng.next() < f.commonChance) fish = 1;
		if (fish > 0) this.pickups.drop('fish', fish, e.x + 6, e.y + 6);
		const p = this.build.perks;
		if (
			p.butcher &&
			this.weapons.weapon.tag === 'melee' &&
			this.rng.next() < PERKS.butcher.value * levelScale(p.butcher)
		)
			this.pickups.drop('meat', this.stats.maxHp * PERKS.butcher.heal, e.x - 6, e.y);
		if (p.toxicBloom && e.status.poisonStacks > 0) {
			const dps = PERKS.toxicBloom.value * levelScale(p.toxicBloom);
			this.area.zone(e.x, e.y, PERKS.toxicBloom.radius, 3, dps / 2, {
				poison: true,
				tint: PALETTE.dotPoison,
			});
		}
		if (kind === 'boss') this.onBossKilled();
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
		const wasUnlocked = this.superIsUnlocked;
		const gained = addXp(this.level, xp);
		if (gained > 0) {
			this.levelsGained += gained;
			this.fx.banner(this.hero.x, this.hero.y, 'fx.levelUp');
			if (!wasUnlocked && this.superIsUnlocked)
				this.fx.banner(this.hero.x, this.hero.y, 'fx.superUnlocked');
		}
	}

	private castSuper(): void {
		if (this.deadFor >= 0 || this.superpower.active) return;
		if (!superReady(this.run.superCharge, this.level.level)) return;
		this.run.superCharge = 0;
		countRun(this.run, 'superUses');
		this.combat.iFrames = Math.max(this.combat.iFrames, SUPER.invulnerable);
		this.superpower.cast(this.run.hero, this.hero.x, this.hero.y, this);
	}

	/** Bob unlocks on the first round-10 boss kill, Lucia on round 20 (P-17). */
	private onBossKilled(): void {
		const save = getSave(this);
		addFeat(save, 'bossBear');
		if (this.run.timeLeft > 120) addFeat(save, 'bossUnder60s');
		if (this.run.timeLeft < 5) addFeat(save, 'bossLastSecond');
		if (this.speed > 1) addFeat(save, 'bossAt2x');
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
		if (!this.superpower.active && this.superpower.killsThisCast > 0) {
			const best = this.run.counters.superKillsOneCast ?? 0;
			this.run.counters.superKillsOneCast = Math.max(best, this.superpower.killsThisCast);
			this.superpower.killsThisCast = 0;
		}
		const save = getSave(this);
		const progress = liveProgress(save, this.run, this.run.counters, this.level.level);
		const fresh = evaluateAchievements(progress, save.achievements, Date.now());
		if (fresh.length > 0) {
			persist(this);
			this.game.events.emit(GameEvents.AchievementsUnlocked, fresh);
		}
	}

	// --- Rounds and run end ---------------------------------------------------------------

	private checkRoundEnd(): void {
		const run = this.run;
		if (isBossRound(run.round)) {
			if (!this.enemies.boss) this.finishRound();
			else if (run.timeLeft <= 0) this.die('bossTimeout');
			return;
		}
		if (run.timeLeft <= 0) this.finishRound();
	}

	/** Clears the arena, banks the round, then pauses for the 3 cards (P-23). */
	private finishRound(): void {
		for (const e of [...this.enemies.active]) this.fx.bloodAt(e.x, e.y, e.radius / 10);
		this.enemies.clear();
		this.pool.clear();
		this.area.clear();
		this.hostile.clear();
		this.run.fish += roundEndFish(this.run.round);
		this.pickups.collectAll();
		const offers = drawCards(this.rng, {
			hero: this.run.hero,
			round: this.run.round + 1,
			luck: this.stats.luck,
			build: this.build,
		});
		const data: CardPickData = {
			round: this.run.round,
			offers,
			build: this.build,
			onPick: (i) => this.pickCard(offers[i]),
		};
		this.scene.pause();
		this.scene.launch('CardPick', data);
	}

	private pickCard(offer: CardOffer | undefined): void {
		if (offer) {
			const result = applyCard(this.build, this.stats, offer.card, offer.rarity);
			countRun(this.run, 'cardsPicked');
			if (offer.rarity === 'legendary' && offer.card.effect.type !== 'evolve')
				countRun(this.run, 'legendaryCards');
			if (result.exclusive) countRun(this.run, 'exclusiveCards');
			if (result.maxHpDelta > 0) {
				this.run.maxHp = this.stats.maxHp;
				healHero(this.run, result.maxHpDelta);
			}
			if (result.evolvedTo) this.evolve(result.evolvedTo);
		}
		startRound(this.run, this.run.round + 1);
		this.enemies.startRound(this.run.round, this.hero, this.viewSize());
		this.scene.resume();
	}

	private evolve(tier: 2 | 3): void {
		this.run.tier = tier;
		this.hero.setTier(tier);
		this.weapons.weapon = SIGNATURE[this.run.hero][tier - 1] as SignatureWeapon;
		countRun(this.run, tier === 2 ? 'evolutionsT2' : 'evolutionsT3');
		if (tier === 3) this.run.counters.evolvedT3 = true;
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
			secondaries: Object.entries(this.build.secondaries).map(([id, level]) => ({
				id,
				level: level as number,
			})),
			cards: [...this.build.cards],
			seed: run.seed,
		};
		const previousBest = save.progress.hero[run.hero].bestRound;
		const fresh = recordRunEnd(save, record, run.counters, Date.now());
		persist(this);
		if (fresh.length > 0) this.game.events.emit(GameEvents.AchievementsUnlocked, fresh);
		this.scene.stop('Hud');
		this.scene.start('GameOver', { record, newBest: run.round > previousBest });
	}
}
