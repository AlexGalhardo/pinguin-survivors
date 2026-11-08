import Phaser from 'phaser';
import { KEYS } from '../art/manifest';
import type { GameSpeed, HeroId } from '../config/constants';
import { PALETTE } from '../config/palette';
import {
	getParams,
	getRunDanger,
	getRunHero,
	getRunWeapon,
	getSave,
	persist,
} from '../core/context';
import { GameEvents } from '../core/events';
import { applyBloom, shake, zoomPunch } from '../core/feel';
import { GameInput } from '../core/input';
import { musicForRound, playMusic } from '../core/music';
import { trackZoom } from '../core/viewport';
import { MAGIC_FIRE_SPLASH } from '../data/combat';
import { DANGER, type DangerMods } from '../data/difficulty';
import { ECONOMY } from '../data/economy';
import { BOSS_POOL, BOSS_VOLLEY, ENEMIES, type EnemyId } from '../data/enemies';
import { GEAR_SLOTS } from '../data/equipment';
import { HEROES } from '../data/heroes';
import { CROWD_RADIUS, GAMBIT_INTERVAL, POTION_EFFECTS, type PotionType } from '../data/potions';
import { ROUNDS } from '../data/rounds';
import { levelScale, PERKS, SECONDARIES, type SecondaryId } from '../data/secondaries';
import type { SetModifier } from '../data/sets';
import { SUPER } from '../data/superpowers';
import {
	MAX_WEAPON_SLOTS,
	WEAPON_LINE_BY_ID,
	type WeaponId,
	type WeaponTier,
} from '../data/weapons';
import { Enemy } from '../entities/Enemy';
import { Hero } from '../entities/Hero';
import { WeaponRing } from '../entities/WeaponRing';
import { type I18nKey, t } from '../i18n';
import { applyExtras, evaluateAchievements } from '../logic/achievements';
import { type Bounds, clampCameraCenter, clampToArena } from '../logic/arena';
import { biomeForRound, isBiomeStart } from '../logic/biome';
import {
	addWeapon,
	applyCard,
	type Build,
	canFuse,
	emptyBuild,
	fuse,
	setBonuses,
	setCounts,
	type WeaponInstance,
} from '../logic/build';
import { type CardOffer, drawCards } from '../logic/cards';
import type { Element } from '../logic/combat';
import {
	type ExtraWave,
	extraWaves,
	recordBestRound,
	scaleDrops,
	unlockDanger,
} from '../logic/difficulty';
import { emptyGear, pickUpGear, rollGearDrop, rollHealDrop } from '../logic/equipment';
import { inArc } from '../logic/geometry';
import { ObstacleField, pushOut } from '../logic/obstacles';
import { type GambitSlot, loadGambits, pickGambit, returnUnused } from '../logic/potions';
import { addXp, type LevelState, orbXp } from '../logic/progression';
import { depthOf, inputToWorld, worldToScreen } from '../logic/projection';
import { Rng, randomSeed } from '../logic/rng';
import { isBossRound } from '../logic/round';
import {
	countRun,
	createRunState,
	damageHero,
	endRound,
	finishRun,
	healHero,
	leaveShop,
	queueLevelUps,
	type RunState,
	resolveLevelUp,
	type ShopRoll,
	startRound,
	weaponCandidates,
} from '../logic/run-state';
import {
	addFeat,
	liveProgress,
	type RunOutcome,
	type RunRecord,
	recordRunEnd,
} from '../logic/save';
import {
	buy as buyOffer,
	lock as lockOffer,
	offerPrice,
	rerollPrice,
	reroll as rerollShop,
	sellValue,
} from '../logic/shop';
import { nextSpeed } from '../logic/speed';
import { heroStats, type PlayerStats, replaceModifiers } from '../logic/stats';
import { addCharge, chargeFor, superCost, superReady, superUnlocked } from '../logic/superpower';
import { applyUpgrades } from '../logic/upgrades';
import { leadWeapon, resolveWeapon } from '../logic/weapons';
import { AreaSystem, type WorldLight } from '../systems/AreaSystem';
import { CombatSystem, HERO_RADIUS } from '../systems/CombatSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { FxSystem } from '../systems/FxSystem';
import { HostileSystem } from '../systems/HostileSystem';
import { type PickupKind, PickupSystem } from '../systems/PickupSystem';
import { ProjectilePool } from '../systems/ProjectilePool';
import { SecondarySystem } from '../systems/SecondarySystem';
import { SuperpowerSystem } from '../systems/SuperpowerSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { bindCommands } from '../ui/commands';
import { publishShop, type ShopView } from '../ui/shop-bridge';
import { Arena } from '../world/Arena';
import type { CardPickData } from './CardPickScene';
import type { UnlockData } from './UnlockScene';

/** What a saved run snapshot holds (save.activeRun.state). */
export interface RunResume {
	run: RunState;
	build: Build;
	stats: PlayerStats;
	potions: GambitSlot[];
}

const RESUME_KEY = 'resumeRun';

/** Menu → Continue puts the snapshot in the registry; the game consumes it once. */
export function queueResume(game: Phaser.Game, state: RunResume): void {
	game.registry.set(RESUME_KEY, state);
}

function takeResume(scene: Phaser.Scene): RunResume | undefined {
	const state = scene.registry.get(RESUME_KEY) as RunResume | undefined;
	scene.registry.remove(RESUME_KEY);
	return state;
}

const DEATH_DELAY = 1.2;
/** Seconds between live achievement checks. */
const ACHIEVEMENT_CHECK = 1;
const ATTUNEMENT_WINDOW = 4;
const REFLEX_WINDOW = 2;
const BLOODLUST_RADIUS = 150;

export class GameScene extends Phaser.Scene {
	hero!: Hero;
	arena!: Arena;
	run!: RunState;
	stats!: PlayerStats;
	build!: Build;
	enemies!: EnemySystem;
	superpower!: SuperpowerSystem;
	/** Persistent hero level/XP, updated live as orbs are collected. */
	level!: LevelState;
	/** Multiplies simulation dt, scene timers and tweens (TAB toggles 1x/2x). */
	speed: GameSpeed = 1;
	private controls!: GameInput;
	private obstacles!: ObstacleField;
	private mods: DangerMods = DANGER[1];
	private waves: ExtraWave[] = [];
	private readonly collideHero = (hero: Hero): void => {
		pushOut(hero, HERO_RADIUS, this.obstacles.near(hero.x, hero.y, HERO_RADIUS));
		clampToArena(hero, HERO_RADIUS, this.arena.bounds);
	};
	private weapons!: WeaponSystem;
	private weaponRing!: WeaponRing;
	private secondaries!: SecondarySystem;
	private pool!: ProjectilePool;
	private area!: AreaSystem;
	private combat!: CombatSystem;
	private fx!: FxSystem;
	private pickups!: PickupSystem;
	private hostile!: HostileSystem;
	private rng!: Rng;
	private deadFor = -1;
	/** Simulation freeze left (hit-stop); rendering keeps going. */
	private hitStop = 0;
	/** Crit hit-stops are throttled so hordes do not stutter. */
	private hitStopCooldown = 0;
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
	/** Gambit slots loaded from the save for this run (P-28). */
	potions: GambitSlot[] = [];
	private gambitTimer = 0;
	private potionsThisRound = 0;
	private shieldHp = 0;
	private shieldTime = 0;
	private rageTime = 0;
	private hasteTime = 0;
	private immuneTime = 0;
	/** Hero poison from scientist spit (world damage per second). */
	private heroPoisonDps = 0;
	private heroPoisonTime = 0;
	/** Heroes unlocked during this run, shown on the unlock screen after it (PLAN 3.3). */
	private unlockedNow: HeroId[] = [];

	/** Starts the round's enemies and announces this round's extra wave, if any (SDD-005 RF-02). */
	private startEnemyRound(): void {
		this.enemies.wave = this.waves.find((w) => w.round === this.run.round)?.kind ?? null;
		this.enemies.startRound(this.run.round, this.viewBounds());
		if (this.enemies.wave)
			this.fx.banner(this.hero.x, this.hero.y, `fx.wave.${this.enemies.wave}` as I18nKey);
	}

	constructor() {
		super('Game');
	}

	/** Kills needed for the next superpower (grows by 5 per cast this run). */
	get superCost(): number {
		return superCost(this.run.counters.superUses ?? 0);
	}

	get superIsUnlocked(): boolean {
		return superUnlocked(this.level.level);
	}

	create(): void {
		const params = getParams(this);
		const save = getSave(this);
		const resume = takeResume(this);
		const heroId: HeroId = resume?.run.hero ?? params.hero ?? getRunHero(this) ?? 'jack';
		const heroDef = HEROES[heroId];
		const heroSave = save.heroes[heroId];
		const seed = resume?.run.seed ?? params.seed ?? randomSeed();
		const tier = resume?.run.tier ?? params.tier ?? 1;
		// A resumed run reseeds per round so it stays reproducible without storing RNG state.
		this.rng = new Rng(resume ? seed + resume.run.round : seed);
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
		this.unlockedNow = [];
		this.level = { level: heroSave.level, xp: heroSave.xp };
		if (!resume && save.activeRun) {
			// Starting over abandons the saved run: its loaded potions go back to the stock.
			const old = save.activeRun.state as unknown as RunResume;
			if (Array.isArray(old.potions)) returnUnused(old.potions, save.potions);
			save.activeRun = null;
		}
		this.potions = resume ? resume.potions : loadGambits(save.gambits, save.potions);
		this.gambitTimer = 0;
		this.potionsThisRound = 0;
		this.shieldHp = 0;
		this.shieldTime = 0;
		this.rageTime = 0;
		this.hasteTime = 0;
		this.immuneTime = 0;
		this.heroPoisonDps = 0;
		this.heroPoisonTime = 0;
		if (resume) {
			this.stats = resume.stats;
			this.build = resume.build;
			this.run = resume.run;
			startRound(this.run, this.run.round);
		} else {
			this.stats = applyExtras(
				applyUpgrades(heroStats(heroDef, heroSave.level, heroSave.points), save.upgrades),
				save.achievements,
			);
			this.build = emptyBuild(tier);
			this.run = createRunState(heroDef, {
				seed,
				round: params.round,
				tier,
				danger: params.danger ?? getRunDanger(this) ?? 1,
				cardRerolls: this.stats.cardRerolls,
			});
			this.run.maxHp = this.stats.maxHp;
			this.run.hp = this.stats.maxHp;
		}
		const picked = getRunWeapon(this);
		this.initWeapons(
			params.weapon ??
				(picked && heroDef.startingWeapons.includes(picked)
					? picked
					: heroDef.startingWeapons[0]),
			params.weapons,
			Boolean(resume),
		);
		this.quickReloadTime = 0;

		this.controls = new GameInput(this, save.settings.keys);
		this.controls.on('speed', () => this.setSpeed(nextSpeed(this.speed)));
		this.controls.on('super', () => this.castSuper());
		this.controls.on('pause', () => this.pause());
		// Esc always pauses, whatever the binds are.
		this.input.keyboard?.on('keydown-ESC', () => this.pause());

		const biome = biomeForRound(this.run.round);
		this.arena = new Arena(this, seed, biome, this.run.round, params.arena);
		this.obstacles = new ObstacleField(this.arena.props);
		this.fx = new FxSystem(this, save.settings, this.arena);
		this.pickups = new PickupSystem(this, (kind, value, gearId) =>
			this.collect(kind, value, gearId),
		);
		this.run.gear ??= emptyGear();
		this.hero = new Hero(this, heroId, tier, this.stats);
		this.barrier = this.add.image(0, 0, KEYS.barrier).setVisible(false);
		this.hostile = new HostileSystem(this, (damage, kind) => {
			if (kind === 'acid') {
				this.hazardDamage(damage);
				return;
			}
			this.combat.heroHit(damage, false);
			if (kind === 'spit') this.poisonHero(damage);
		});
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
			volley: (e) => this.volley(e),
			pool: (e) => this.acidPools(e),
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
				shield: (amount) => this.soakShield(amount),
				hitStop: (seconds) => this.requestHitStop(seconds),
			},
		);
		this.combat.god = params.god;
		this.pool = new ProjectilePool(this, (e, p) => {
			const x = e.x;
			const y = e.y;
			this.combat.weaponHit(e, p.damage, p.crit, {
				element: p.element,
				bleedChance: p.bleedChance,
			});
			if (p.element === 'fire') this.fireSplash(x, y, p.damage);
		});
		this.area = new AreaSystem(this, (e, amount, element, poison) =>
			this.combat.weaponHit(e, amount, false, { element, poison, noChain: true }),
		);
		this.weapons = new WeaponSystem(
			this.rng,
			this.stats,
			this.build,
			this.pool,
			(e, amount, crit, bleedChance) =>
				this.combat.weaponHit(e, amount, crit, { bleedChance }),
			(x, y, a, r) => this.fx.slash(x, y, a, r),
			(element) => this.elementUsedAt.set(element, this.run.elapsed),
			(slot, angle, cooldown) => {
				// Only the first weapon drives the hero's attack animation.
				if (slot === 0) this.hero.attack(angle, cooldown);
				this.weaponRing.fire(slot, angle, cooldown);
				const tag = resolveWeapon(this.build.weapons[slot] as WeaponInstance).tag;
				this.fx.play(
					tag === 'melee' ? 'sfx.swing' : tag === 'firearm' ? 'sfx.shotgun' : 'sfx.cast',
				);
			},
		);
		this.weaponRing = new WeaponRing(this);
		this.secondaries = new SecondarySystem(
			this,
			this.rng,
			this.stats,
			this.build,
			this.pool,
			this.area,
			(e, amount, crit, element) => this.combat.weaponHit(e, amount, crit, { element }),
			this.weapons.bonus,
			(slot, angle, cooldown) => this.weaponRing.fire(slot, angle, cooldown),
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
		if (save.settings.bloomOptIn) applyBloom(cam);
		Enemy.reducedFlashes = save.settings.reducedFlashes;
		this.snapCamera();
		this.enemies.obstacles = this.obstacles;
		this.enemies.onTelegraph = (x, y) => this.fx.spawnMark(x, y);
		this.syncArena();
		this.run.danger ??= 1;
		this.mods = DANGER[this.run.danger];
		this.waves = extraWaves(this.run.seed, this.run.danger);
		this.enemies.mods = this.mods;
		this.startEnemyRound();
		playMusic(this, musicForRound(this.run.round, isBossRound(this.run.round)));

		this.scene.launch('Hud');
		this.run.phase ??= 'round';
		this.run.pendingLevelUps ??= 0;
		bindCommands({
			buy: (i) => this.shopBuy(i),
			reroll: () => this.shopReroll(),
			lock: (i) => this.shopLock(i),
			sell: (slot) => this.shopSell(slot),
			fuse: (a, b) => this.shopFuse(a, b),
			closeShop: () => this.closeShop(),
		});
		this.events.once('shutdown', () => {
			bindCommands({});
			publishShop(null);
			this.arena.destroy();
		});
	}

	override update(_time: number, deltaMs: number): void {
		const dt = (Math.min(deltaMs, 50) / 1000) * this.speed;
		this.hitStopCooldown -= deltaMs / 1000;
		if (this.hitStop > 0) {
			this.hitStop -= deltaMs / 1000;
			return;
		}
		if (this.deadFor >= 0) {
			this.deadFor += dt;
			this.fx.update(dt);
			if (this.deadFor >= DEATH_DELAY) this.endRun();
			return;
		}
		if (this.run.phase !== 'round') {
			// Level-up cards or the shop: the world is frozen, only effects keep playing.
			this.fx.update(dt);
			this.arena.update();
			return;
		}
		const run = this.run;
		run.elapsed += dt;
		run.timeLeft -= dt;

		const intent = this.controls.move();
		this.moving = intent.x !== 0 || intent.y !== 0;
		const move = inputToWorld(intent.x, intent.y);
		this.hero.update(dt, move, this.collideHero);
		this.weaponRing.update(dt, this.build.weapons, this.hero.x, this.hero.y, this.enemies.grid);
		healHero(run, this.stats.regen * dt);
		this.updatePotions(dt);

		const grid = this.enemies.grid;
		this.followCamera(dt);
		const view = this.viewSize();
		this.enemies.update(dt, run.round, this.hero, this.viewBounds());
		this.updatePerks(dt);
		this.weapons.update(dt, this.hero.x, this.hero.y, grid);
		this.secondaries.update(dt, this.hero.x, this.hero.y, grid);
		this.superpower.update(
			dt,
			this.hero.x,
			this.hero.y,
			grid,
			leadWeapon(this.build.weapons),
			view,
		);
		this.pool.update(dt, grid);
		this.hostile.update(dt, this.hero.x, this.hero.y, HERO_RADIUS);
		this.area.update(dt, grid);
		this.combat.contact(dt);
		this.pickups.update(dt, this.hero.x, this.hero.y, this.stats.pickupRange);
		this.fx.update(dt);
		this.checkAchievements(dt);
		this.checkRoundEnd();

		this.arena.update();
	}

	/** Set bonuses currently added to `stats`, so a build change can swap them (not idempotent). */
	private appliedSet: SetModifier[] = [];
	private quickReloadTime = 0;

	/**
	 * Run start: `startingWeapons[0]` (the picker comes with the React hero select), or the
	 * `?weapons=` debug list. A resumed run keeps its build; its stats already hold the bonuses.
	 */
	private initWeapons(
		first: WeaponId,
		forced: readonly WeaponInstance[] | undefined,
		resumed: boolean,
	): void {
		const b = this.build;
		b.weapons ??= [];
		for (const id of Object.keys(b.secondaries))
			if (!(id in SECONDARIES)) delete b.secondaries[id as SecondaryId];
		if (!resumed) {
			for (const w of (forced ?? [{ id: first, tier: 1 }]).slice(0, MAX_WEAPON_SLOTS))
				addWeapon(b, w.id, w.tier);
		} else if (b.weapons.length === 0) addWeapon(b, first);
		if (resumed) this.appliedSet = setBonuses(b);
		else this.refreshSetBonuses();
	}

	/** Call whenever `build.weapons` changes (shop buy/sell/fuse): swaps the set bonuses. */
	refreshSetBonuses(): void {
		const next = setBonuses(this.build);
		replaceModifiers(this.stats, this.appliedSet, next);
		this.appliedSet = next;
	}

	/** Shop fusion result (tier II-IV): feeds the weapon achievements. */
	recordFusion(tier: number): void {
		countRun(this.run, 'fusions');
		if (tier >= 4) {
			countRun(this.run, 'tierIVWeapons');
			this.run.counters.fusedT4 = true;
		}
	}

	private readonly worldLights: WorldLight[] = [];

	/** Light sources in world space for the darkness layer (read by the HUD every frame). */
	collectLights(): readonly WorldLight[] {
		const out = this.worldLights;
		out.length = 0;
		if (!this.hero) return out;
		out.push({ x: this.hero.x, y: this.hero.y, radius: 240, strength: 1 });
		if (this.superpower?.active)
			out.push({ x: this.hero.x, y: this.hero.y, radius: 360, strength: 1 });
		this.area?.collectLights(out);
		this.pool?.collectLights(out);
		for (const e of this.enemies?.active ?? []) {
			if (e.elite || e.def.behavior === 'boss')
				out.push({ x: e.x, y: e.y, radius: e.radius * 3, strength: 0.55 });
		}
		return out;
	}

	private requestHitStop(seconds: number): void {
		if (seconds < 0.1 && this.hitStopCooldown > 0) return;
		this.hitStop = Math.max(this.hitStop, seconds);
		this.hitStopCooldown = 0.3;
	}

	setSpeed(speed: GameSpeed): void {
		this.speed = speed;
		this.time.timeScale = speed;
		this.tweens.timeScale = speed;
	}

	/** Camera center, tracked here so the view is exact in the same frame the hero moves. */
	private camX = 0;
	private camY = 0;

	private cameraGoal(): { x: number; y: number } {
		const cam = this.cameras.main;
		return clampCameraCenter(this.hero, cam.displayWidth, cam.displayHeight, this.arena.bounds);
	}

	private snapCamera(): void {
		const g = this.cameraGoal();
		this.camX = g.x;
		this.camY = g.y;
		this.cameras.main.centerOn(Math.round(g.x), Math.round(g.y));
	}

	/** Follows the hero with the old per-frame lerp 0.12 (made frame-rate independent), RF-05. */
	private followCamera(dt: number): void {
		const g = this.cameraGoal();
		const k = 1 - 0.88 ** (dt * 60);
		this.camX += (g.x - this.camX) * k;
		this.camY += (g.y - this.camY) * k;
		this.cameras.main.centerOn(Math.round(this.camX), Math.round(this.camY));
	}

	/** World rectangle the camera shows right now. */
	private viewBounds(): Bounds {
		const cam = this.cameras.main;
		const hw = cam.displayWidth / 2;
		const hh = cam.displayHeight / 2;
		return {
			minX: this.camX - hw,
			minY: this.camY - hh,
			maxX: this.camX + hw,
			maxY: this.camY + hh,
		};
	}

	private viewSize(): { width: number; height: number } {
		const v = this.cameras.main.worldView;
		return { width: v.width, height: v.height };
	}

	// --- Perks (docs/gdd.md §5.1) -------------------------------------------------

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
		if (p.quickReload && this.quickReloadTime > 0) {
			this.quickReloadTime -= dt;
			rate += PERKS.quickReload.value * levelScale(p.quickReload);
		}
		if (p.ironBreath) {
			this.scratch.length = 0;
			this.enemies.grid.queryRadius(
				this.hero.x,
				this.hero.y,
				PERKS.ironBreath.radius,
				this.scratch,
			);
			const near = this.scratch.filter((e) => e.alive).length;
			const s = levelScale(p.ironBreath);
			healHero(
				this.run,
				Math.min(PERKS.ironBreath.cap * s, PERKS.ironBreath.value * s * near) * dt,
			);
		}
		bonus.rate = rate * (this.hasteTime > 0 ? 1 + POTION_EFFECTS.haste.attackSpeed : 1);
		bonus.bounces = p.ricochet ?? 0;
		bonus.echoEvery = p.arcaneEcho
			? Math.max(2, Math.round(PERKS.arcaneEcho.value / levelScale(p.arcaneEcho)))
			: 0;
		this.combat.hooks.critBleed = Boolean(p.hollowPoints);
		if (p.elementalAttunement) {
			let distinct = 0;
			for (const at of this.elementUsedAt.values())
				if (this.run.elapsed - at <= ATTUNEMENT_WINDOW) distinct++;
			const s = levelScale(p.elementalAttunement);
			const perk = PERKS.elementalAttunement;
			bonus.damage = 1 + Math.min(perk.cap * s, perk.value * s * distinct);
		} else bonus.damage = 1;
		if (this.rageTime > 0) bonus.damage *= 1 + POTION_EFFECTS.rage.damage;
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
			this.barrier.setPosition(s.x, s.y - 26).setDepth(depthOf(this.hero.x, this.hero.y) + 1);
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
		const w = leadWeapon(this.build.weapons);
		if (!w) return;
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

	// --- Potions and gambits (P-28) --------------------------------------------------------

	private updatePotions(dt: number): void {
		const run = this.run;
		this.shieldTime -= dt;
		if (this.shieldTime <= 0) this.shieldHp = 0;
		this.rageTime -= dt;
		this.hasteTime -= dt;
		this.immuneTime -= dt;
		if (this.heroPoisonTime > 0) {
			this.heroPoisonTime -= dt;
			if (this.immuneTime > 0) this.heroPoisonTime = 0;
			else if (!this.combat.god && damageHero(run, this.heroPoisonDps * dt))
				this.die('death');
		}
		this.gambitTimer -= dt;
		if (this.gambitTimer > 0) return;
		this.gambitTimer = GAMBIT_INTERVAL;
		this.scratch.length = 0;
		this.enemies.grid.queryRadius(this.hero.x, this.hero.y, CROWD_RADIUS, this.scratch);
		const i = pickGambit(this.potions, {
			hpRatio: run.hp / run.maxHp,
			poisoned: this.heroPoisonTime > 0,
			bleeding: false,
			bossVisible: this.enemies.boss !== null,
			enemiesNear: this.scratch.length,
			roundStart: run.elapsed - this.roundStartedAt < 1,
		});
		if (i < 0) return;
		const slot = this.potions[i] as GambitSlot;
		slot.used = true;
		this.drink(slot.potion as PotionType);
	}

	private roundStartedAt = 0;

	private drink(potion: PotionType): void {
		const run = this.run;
		countRun(run, 'potionsUsed');
		this.fx.play('sfx.potion');
		this.potionsThisRound++;
		if (this.potionsThisRound >= 3) addFeat(getSave(this), 'gambitTriple');
		const e = POTION_EFFECTS;
		switch (potion) {
			case 'heal':
				healHero(run, run.maxHp * e.heal.heal);
				break;
			case 'megaHeal':
				healHero(run, run.maxHp * e.megaHeal.heal);
				break;
			case 'shield':
				this.shieldHp = run.maxHp * e.shield.shield;
				this.shieldTime = e.shield.duration;
				break;
			case 'rage':
				this.rageTime = e.rage.duration;
				break;
			case 'haste':
				this.hasteTime = e.haste.duration;
				break;
			case 'antidote':
				this.heroPoisonTime = 0;
				this.immuneTime = e.antidote.immune;
				break;
		}
		this.fx.banner(this.hero.x, this.hero.y, `potion.${potion}` as 'potion.heal');
		this.area.flash(this.hero.x, this.hero.y, 40, PALETTE.dotPoison, 0.3);
	}

	private soakShield(amount: number): number {
		if (this.shieldHp <= 0) return amount;
		const soaked = Math.min(this.shieldHp, amount);
		this.shieldHp -= soaked;
		return amount - soaked;
	}

	/** Scientist spit poisons the hero: 10% of the hit per second for 4 s (antidote immune). */
	private poisonHero(hit: number): void {
		if (this.immuneTime > 0 || this.combat.god) return;
		this.heroPoisonDps = Math.max(
			this.heroPoisonDps * (this.heroPoisonTime > 0 ? 1 : 0),
			hit * 0.1,
		);
		this.heroPoisonTime = 4;
	}

	// --- Enemy special attacks (docs/gdd.md §11) -----------------------------------

	/** Bloater: poison burst on the spot, hurting the hero if close; the bloater dies. */
	private explode(e: Enemy): void {
		const radius = 60;
		this.area.flash(e.x, e.y, radius, PALETTE.dotPoison, 0.4);
		this.area.zone(e.x, e.y, radius, 2, 0, { tint: PALETTE.dotPoison });
		const d = Math.hypot(this.hero.x - e.x, this.hero.y - e.y);
		if (d <= radius + HERO_RADIUS) this.combat.heroHit(e.damage, false, 'earth');
		this.combat.damage(e, e.hp + 1, false, undefined, false);
	}

	/** Boss swipe (bear paw, kraken tentacle, abomination claws): a wide arc toward the hero. */
	private swipe(e: Enemy): void {
		const reach = (e.def.range ?? 90) * (e.def.boss?.swipeReach ?? 1.3);
		const angle = Math.atan2(this.hero.y - e.y, this.hero.x - e.x);
		this.fx.slash(e.x, e.y, angle, reach * 1.4);
		shake(this, 120, 0.004);
		if (inArc(e.x, e.y, angle, Math.PI * 0.8, reach, this.hero.x, this.hero.y, HERO_RADIUS))
			this.combat.heroHit(e.damage * 1.5, true, undefined, e);
		zoomPunch(this, 0.05, 180);
	}

	/** Lucia's fire bolt bursts on impact: real area damage around the target (PLAN 1.5). */
	private fireSplash(x: number, y: number, damage: number): void {
		const s = MAGIC_FIRE_SPLASH;
		const r = s.radius * this.stats.area;
		this.area.burst(this.enemies.grid, x, y, r, damage * s.share, 'fire');
		this.area.flash(x, y, r, PALETTE.elFire, 0.18);
	}

	/** Boss roar: minions of the biome burst out around the boss. */
	private summon(e: Enemy): void {
		this.fx.play('sfx.bossRoar');
		this.area.flash(e.x, e.y, 140, PALETTE.textLight, 0.5);
		shake(this, 300, 0.005);
		const b = e.def.boss;
		const def = ENEMIES[(b?.summon ?? 'zombiePenguin') as EnemyId];
		const count = b?.summonCount ?? 6;
		for (let i = 0; i < count; i++) {
			const a = (i / count) * Math.PI * 2;
			this.enemies.spawnAt(def, e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70);
		}
	}

	/** Kraken ink: a fan of slow blobs aimed at the hero. */
	private volley(e: Enemy): void {
		const count = e.def.boss?.volleyCount ?? 5;
		const aim = Math.atan2(this.hero.y - e.y, this.hero.x - e.x);
		const spread = BOSS_VOLLEY.spread;
		for (let i = 0; i < count; i++) {
			const a = aim + (count > 1 ? (i / (count - 1) - 0.5) * spread : 0);
			this.hostile.spawnAngle(
				e.x,
				e.y,
				a,
				BOSS_VOLLEY.speed,
				BOSS_VOLLEY.range,
				e.damage * BOSS_VOLLEY.damage,
				'ink',
			);
		}
		this.area.flash(e.x, e.y, 60, PALETTE.lucia, 0.25);
	}

	/** Abomination acid: telegraphed pools around (and under) the hero. */
	private acidPools(e: Enemy): void {
		const count = e.def.boss?.poolCount ?? 3;
		const p = BOSS_POOL;
		for (let i = 0; i < count; i++) {
			const a = this.rng.next() * Math.PI * 2;
			const d = i === 0 ? 0 : p.scatter * (0.4 + this.rng.next() * 0.6);
			this.hostile.pool(
				this.hero.x + Math.cos(a) * d,
				this.hero.y + Math.sin(a) * d,
				p.radius,
				p.duration,
				e.damage * p.dps,
				PALETTE.goo,
			);
		}
	}

	/** Damage over time from ground hazards: bypasses i-frames, respects god mode and shields. */
	private hazardDamage(amount: number): void {
		if (this.combat.god || this.deadFor >= 0) return;
		if (damageHero(this.run, this.soakShield(amount))) this.die('death');
	}

	// --- Kills, pickups, superpower -------------------------------------------------------

	private onKill(e: Enemy): void {
		const run = this.run;
		const kind = e.def.behavior === 'boss' ? 'boss' : e.elite ? 'elite' : 'common';
		run.superCharge = addCharge(run.superCharge, chargeFor(kind), this.superCost);
		if (this.superpower.active) this.superpower.killsThisCast++;
		if (this.build.perks.quickReload) this.quickReloadTime = PERKS.quickReload.duration;
		this.pickups.drop('xp', orbXp(e.def.xp, run.round) * this.mods.drops, e.x, e.y);
		const f = ECONOMY.fish;
		let fish = 0;
		// Boss Fish are paid at the end of the round (`endRound`), not dropped.
		if (e.elite === 'orange') fish = f.eliteOrange;
		else if (e.elite === 'purple') fish = f.elitePurple;
		else if (this.rng.next() < f.commonChance) fish = 1;
		// D1 skips the extra roll so seeded runs keep the same RNG sequence.
		if (fish > 0 && this.mods.drops !== 1)
			fish = scaleDrops(fish, this.mods.drops, this.rng.next());
		if (fish > 0) this.pickups.drop('fish', fish, e.x + 6, e.y + 6);
		const heal = rollHealDrop(this.rng, kind);
		if (heal > 0) this.pickups.drop('heal', heal, e.x - 8, e.y + 4);
		const gear = rollGearDrop(this.rng, kind);
		if (gear) this.pickups.drop('gear', 0, e.x + 4, e.y - 8, gear.id);
		const p = this.build.perks;
		if (
			p.butcher &&
			this.build.weapons.some((s) => resolveWeapon(s).tag === 'melee') &&
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
		if (kind === 'boss') {
			zoomPunch(this, 0.1, 500);
			this.onBossKilled();
		}
	}

	private collect(kind: PickupKind, value: number, gearId: string | null): void {
		if (kind === 'heal') {
			healHero(this.run, this.run.maxHp * value);
			this.fx.play('sfx.potion');
			this.fx.banner(this.hero.x, this.hero.y, 'fx.heal', { n: Math.round(value * 100) });
			return;
		}
		if (kind === 'gear') {
			if (gearId) this.pickUpGear(gearId);
			return;
		}
		if (kind === 'fish') {
			this.run.fish += value;
			this.fx.play('sfx.pickupFish');
			return;
		}
		if (kind === 'meat') {
			healHero(this.run, value);
			return;
		}
		this.fx.play('sfx.pickupXp');
		const xp = value * this.stats.xpGain;
		this.run.xp += xp;
		const wasUnlocked = this.superIsUnlocked;
		const gained = addXp(this.level, xp);
		if (gained > 0) {
			this.levelsGained += gained;
			queueLevelUps(this.run, gained);
			this.fx.banner(this.hero.x, this.hero.y, 'fx.levelUp');
			this.fx.play('sfx.levelUp');
			if (!wasUnlocked && this.superIsUnlocked)
				this.fx.banner(this.hero.x, this.hero.y, 'fx.superUnlocked');
		}
	}

	/** Stepped on a gear drop: into the bag, worn at once when its slot is free. */
	private pickUpGear(id: string): void {
		const gear = this.run.gear ?? emptyGear();
		this.run.gear = gear;
		const result = pickUpGear(gear, this.stats, id);
		this.syncMaxHp();
		this.fx.play('sfx.card');
		this.fx.banner(
			this.hero.x,
			this.hero.y,
			result === 'equipped' ? 'fx.gearEquipped' : 'fx.gearBag',
			{
				name: t(`gear.${id}` as I18nKey),
			},
		);
	}

	/** Max HP follows the stats (gear, cards); current HP is kept within it. */
	syncMaxHp(): void {
		const before = this.run.maxHp;
		this.run.maxHp = this.stats.maxHp;
		if (this.run.maxHp > before) healHero(this.run, this.run.maxHp - before);
		this.run.hp = Math.min(this.run.hp, this.run.maxHp);
	}

	private castSuper(): void {
		if (this.deadFor >= 0 || this.superpower.active) return;
		if (!superReady(this.run.superCharge, this.level.level, this.superCost)) return;
		this.run.superCharge = 0;
		countRun(this.run, 'superUses');
		this.combat.iFrames = Math.max(this.combat.iFrames, SUPER.invulnerable);
		this.superpower.cast(this.run.hero, this.hero.x, this.hero.y, this);
		this.fx.play('sfx.super');
		this.hero.super();
	}

	/** Bob unlocks on the first round-10 boss kill, Lucia on round 20 (P-17). */
	private onBossKilled(): void {
		const save = getSave(this);
		const biome = biomeForRound(this.run.round);
		addFeat(
			save,
			biome === 'station' ? 'bossBiome2' : biome === 'ruins' ? 'bossBiome3' : 'bossBear',
		);
		if (this.run.timeLeft > 120) addFeat(save, 'bossUnder60s');
		if (this.run.timeLeft < 5) addFeat(save, 'bossLastSecond');
		if (this.speed > 1) addFeat(save, 'bossAt2x');
		if (this.run.round >= 10 && !save.heroes.bob.unlocked) {
			save.heroes.bob.unlocked = true;
			addFeat(save, 'unlockBob');
			this.unlockedNow.push('bob');
			this.fx.banner(this.hero.x, this.hero.y, 'unlock.bob');
		}
		if (this.run.round === 20) unlockDanger(save, this.run.hero, this.run.danger);
		if (this.run.round >= 20 && !save.heroes.lucia.unlocked) {
			save.heroes.lucia.unlocked = true;
			addFeat(save, 'unlockLucia');
			this.unlockedNow.push('lucia');
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

	/** Clears the arena, banks the round (Fish, Pearls) and goes to the level-up cards or the shop. */
	private finishRound(): void {
		for (const e of [...this.enemies.active]) this.fx.bloodAt(e.x, e.y, e.radius / 10);
		this.enemies.clear();
		this.pool.clear();
		this.area.clear();
		this.hostile.clear();
		this.secondaries.clear();
		healHero(this.run, this.run.maxHp * ROUNDS.roundEndHeal);
		// Collecting the last orbs can still level up: it must be queued before `endRound`.
		this.pickups.collectAll();
		const before = this.run.fish;
		endRound(this.run, this.shopRoll(), this.stats.harvesting);
		this.run.fish = before + Math.round((this.run.fish - before) * this.mods.drops);
		this.advanceRoundPhase();
	}

	private poolCache: { hero: HeroId; pool: ReturnType<typeof weaponCandidates> } | null = null;

	private shopRoll(): ShopRoll {
		const hero = this.run.hero;
		if (this.poolCache?.hero !== hero) this.poolCache = { hero, pool: weaponCandidates(hero) };
		return {
			rng: this.rng,
			pool: this.poolCache.pool,
			ctx: {
				hero,
				buildSets: Object.keys(setCounts(this.build)),
				luck: this.stats.luck,
			},
		};
	}

	/** Pending level-ups come first (one card pick each), then the shop (SDD-003 RF-01, RF-05). */
	private advanceRoundPhase(): void {
		if (this.run.phase === 'cards') {
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
			return;
		}
		if (this.run.phase === 'shop') {
			if (this.scene.isPaused()) this.scene.resume();
			this.publishShopView();
		}
	}

	private pickCard(offer: CardOffer | undefined): void {
		if (offer) {
			const result = applyCard(this.build, this.stats, offer.card, offer.rarity);
			countRun(this.run, 'cardsPicked');
			if (offer.rarity === 'legendary') countRun(this.run, 'legendaryCards');
			if (result.exclusive) countRun(this.run, 'exclusiveCards');
			if (result.maxHpDelta > 0) {
				this.run.maxHp = this.stats.maxHp;
				healHero(this.run, result.maxHpDelta);
			}
		}
		resolveLevelUp(this.run, this.shopRoll());
		// CardPick stops itself right after this callback: open the next scene a tick later.
		setTimeout(() => this.advanceRoundPhase(), 0);
	}

	// --- Shop (SDD-003): commands come from the React UI through `bindCommands` -----------------

	private mergeSlot(id: string, tier: number): number {
		return this.build.weapons.findIndex((w) => w.id === id && w.tier === tier && w.tier < 4);
	}

	private publishShopView(): void {
		const run = this.run;
		const shop = run.shop;
		if (!shop) {
			publishShop(null);
			return;
		}
		const full = this.build.weapons.length >= MAX_WEAPON_SLOTS;
		const fusions: ShopView['fusions'] = [];
		const w = this.build.weapons;
		for (let a = 0; a < w.length; a++)
			for (let b = a + 1; b < w.length; b++)
				if (canFuse(this.build, a, b))
					fusions.push({
						a,
						b,
						id: (w[a] as WeaponInstance).id,
						toTier: ((w[a] as WeaponInstance).tier + 1) as 2 | 3 | 4,
					});
		const price = rerollPrice(run.round, shop.rerolls);
		// From D2 the shop warns about the extra wave of the round that is about to start.
		const wave =
			run.danger >= 2 ? this.waves.find((x) => x.round === run.round + 1) : undefined;
		publishShop({
			round: run.round,
			nextWaves: wave ? [wave.kind] : [],
			fish: run.fish,
			offers: shop.offers.map((o, index) =>
				o
					? {
							index,
							kind: o.kind,
							id: o.id,
							tier: o.tier,
							price: o.price,
							sets:
								o.kind === 'weapon'
									? [...WEAPON_LINE_BY_ID[o.id as WeaponId].sets]
									: [],
							locked: shop.locks[index] ?? false,
							affordable:
								run.fish >= o.price &&
								o.kind === 'weapon' &&
								(!full || this.mergeSlot(o.id, o.tier) >= 0),
						}
					: null,
			),
			rerollPrice: price,
			canReroll: run.fish >= price,
			weapons: w.map((x, slot) => ({
				slot,
				id: x.id,
				tier: x.tier,
				sellValue: sellValue(offerPrice('weapon', x.tier, run.round)),
			})),
			maxWeapons: MAX_WEAPON_SLOTS,
			fusions,
			gear: GEAR_SLOTS.map((slot) => run.gear?.equipped[slot] ?? null),
		});
	}

	private shopBuy(index: number): void {
		const run = this.run;
		const shop = run.shop;
		const offer = shop?.offers[index];
		if (!shop || !offer || run.phase !== 'shop' || offer.kind !== 'weapon') return;
		const merge = this.mergeSlot(offer.id, offer.tier);
		if (this.build.weapons.length >= MAX_WEAPON_SLOTS && merge < 0) return;
		const bought = buyOffer(shop, run.fish, index);
		if (!bought) return;
		run.shop = bought.state;
		run.fish = bought.fish;
		const id = offer.id as WeaponId;
		const tier = offer.tier as WeaponTier;
		// With the bar full, the copy is merged straight into the one already owned.
		if (!addWeapon(this.build, id, tier)) {
			this.build.weapons[merge] = { id, tier: (tier + 1) as WeaponTier };
			this.recordFusion(tier + 1);
		}
		this.refreshSetBonuses();
		this.publishShopView();
	}

	private shopReroll(): void {
		const run = this.run;
		if (!run.shop || run.phase !== 'shop') return;
		const roll = this.shopRoll();
		const r = rerollShop(run.shop, run.fish, roll.rng, run.round, roll.ctx, roll.pool);
		if (!r) return;
		run.shop = r.state;
		run.fish = r.fish;
		this.publishShopView();
	}

	private shopLock(index: number): void {
		if (!this.run.shop || this.run.phase !== 'shop') return;
		this.run.shop = lockOffer(this.run.shop, index);
		this.publishShopView();
	}

	private shopSell(slot: number): void {
		const w = this.build.weapons[slot];
		if (!w || this.run.phase !== 'shop') return;
		this.run.fish += sellValue(offerPrice('weapon', w.tier, this.run.round));
		this.build.weapons.splice(slot, 1);
		this.refreshSetBonuses();
		this.publishShopView();
	}

	private shopFuse(a: number, b: number): void {
		if (this.run.phase !== 'shop' || !fuse(this.build, a, b)) return;
		const merged = this.build.weapons[Math.min(a, b)] as WeaponInstance;
		this.recordFusion(merged.tier);
		this.refreshSetBonuses();
		this.publishShopView();
	}

	/** "Next round": leaves the shop, grows the arena and starts round N+1 (autosaved). */
	private closeShop(): void {
		if (this.run.phase !== 'shop') return;
		leaveShop(this.run);
		publishShop(null);
		this.arena.grow(this.run.round);
		if (isBiomeStart(this.run.round)) this.enterBiome();
		this.syncArena();
		this.startEnemyRound();
		if (this.enemies.boss) {
			this.fx.play('sfx.bossRoar');
			zoomPunch(this, 0.08, 400);
		}
		playMusic(this, musicForRound(this.run.round, isBossRound(this.run.round)));
		this.roundStartedAt = this.run.elapsed;
		this.potionsThisRound = 0;
		this.saveSnapshot();
	}

	/**
	 * Autosave at the start of every round (P-43): "Continue" resumes here. The hero level is
	 * persisted too, since XP is kept no matter how the run ends.
	 */
	private saveSnapshot(): void {
		const save = getSave(this);
		save.heroes[this.run.hero].level = this.level.level;
		save.heroes[this.run.hero].xp = this.level.xp;
		const state: RunResume = {
			run: this.run,
			build: this.build,
			stats: this.stats,
			potions: this.potions,
		};
		save.activeRun = {
			savedAt: Date.now(),
			seed: this.run.seed,
			hero: this.run.hero,
			nextRound: this.run.round,
			state: structuredClone(state) as unknown as Record<string, unknown>,
		};
		persist(this);
	}

	/** Hands the current walls and props to every system that collides with them. */
	private syncArena(): void {
		const bounds = this.arena.bounds;
		this.obstacles.setProps(this.arena.props);
		this.enemies.bounds = bounds;
		this.pool.bounds = bounds;
		this.hostile.bounds = bounds;
	}

	/** New biome every 10 rounds: rebuild the ground and announce it (P-18). */
	private enterBiome(): void {
		const biome = biomeForRound(this.run.round);
		this.arena.setBiome(biome);
		this.fx.banner(this.hero.x, this.hero.y, `biome.${biome}` as I18nKey);
	}

	private pause(): void {
		if (this.deadFor >= 0) return;
		this.scene.pause();
		this.scene.launch('Pause');
	}

	/** Quit from the pause menu: the run ends normally and rewards are kept (P-26). */
	quitRun(): void {
		this.die('quit');
		this.deadFor = DEATH_DELAY;
	}

	private die(outcome: RunOutcome): void {
		if (this.deadFor >= 0) return;
		this.outcome = outcome;
		this.deadFor = 0;
		this.hero.die();
		this.fx.bloodAt(this.hero.x, this.hero.y, 2);
	}

	/** Banks XP/Fish, records history and achievements, then shows the game over screen. */
	private endRun(): void {
		const save = getSave(this);
		const run = this.run;
		const heroSave = save.heroes[run.hero];
		heroSave.level = this.level.level;
		heroSave.xp = this.level.xp;
		const fishEarned = run.fish;
		// Fish never leave the run: they convert to Pearls here (SDD-003 RF-06, RF-07).
		finishRun(run, save);
		publishShop(null);
		returnUnused(this.potions, save.potions);
		run.counters.fishEarned = fishEarned;
		run.counters.damageDealt = run.damageDealt;
		run.counters.secondsPlayed = run.elapsed;
		run.counters.gibs = this.fx.gibCount;
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
			fishEarned,
			xpEarned: Math.round(run.xp),
			levelsGained: this.levelsGained,
			secondaries: Object.entries(this.build.secondaries).map(([id, level]) => ({
				id,
				level: level as number,
			})),
			cards: [...this.build.cards],
			seed: run.seed,
		};
		recordBestRound(save, run.hero, run.danger, run.round);
		const previousBest = save.progress.hero[run.hero].bestRound;
		const fresh = recordRunEnd(save, record, run.counters, Date.now());
		persist(this);
		if (fresh.length > 0) this.game.events.emit(GameEvents.AchievementsUnlocked, fresh);
		this.scene.stop('Hud');
		const summary = { key: 'GameOver', data: { record, newBest: run.round > previousBest } };
		if (this.unlockedNow.length > 0)
			this.scene.start('Unlock', {
				heroes: this.unlockedNow,
				next: summary,
			} satisfies UnlockData);
		else this.scene.start(summary.key, summary.data);
	}
}
