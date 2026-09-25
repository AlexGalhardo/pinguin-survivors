import Phaser from 'phaser';
import { SFX, TEX } from '../art/manifest';
import {
	ARENA_H,
	ARENA_W,
	CAMERA_DEADZONE_H,
	CAMERA_DEADZONE_W,
	MAX_PROJECTILES,
} from '../config/constants';
import { PALETTE } from '../config/palette';
import { EVOLVED_NAMES, STAT_SHORT, STRINGS } from '../config/strings';
import { getParams } from '../core/context';
import { bus, type EventBus, GameEvent } from '../core/events';
import { createMoveKeys, type MoveKeys } from '../core/input';
import { settings } from '../core/settings';
import { getView } from '../core/viewport';
import { type Card, REVIVE } from '../data/cards';
import { CHARACTERS, type CharacterId } from '../data/characters';
import { CONTACT_BOUNCE, CONTACT_COOLDOWN, type EnemyType, WAVE_FLOW } from '../data/enemies';
import { MEDKIT } from '../data/items';
import { HIT_STOP, SHAKE, type ShakePreset } from '../data/juice';
import { TAGS } from '../data/synergies';
import { PASSIVES } from '../data/unlocks';
import { debugStats } from '../debug/debug-stats';
import type { DebugParams } from '../debug/params';
import { createArena, PLAY_AREA } from '../entities/Arena';
import type { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import type { Projectile } from '../entities/Projectile';
import { applyEvolutions, buildStats, synergyTiers, tagCounts } from '../logic/build';
import { applyCard, cardRerollCost, generateCards } from '../logic/cards';
import { statChanges } from '../logic/compare';
import { medkitChance, shopRerollCost } from '../logic/economy';
import { formatStatValue } from '../logic/format';
import { metaBonus } from '../logic/meta-upgrades';
import { Rng, randomSeed } from '../logic/rng';
import { createRunState, type RunState } from '../logic/run-state';
import { isBossWave } from '../logic/scaling';
import { buyOffer, generateShop, lockedIds, sellItem, sellValue } from '../logic/shop';
import {
	computeStats,
	finalMaxHp,
	finalMoveSpeed,
	type StatMods,
	type Stats,
} from '../logic/stats';
import { waveStartHp } from '../logic/wave';
import { AbilitySystem } from '../systems/AbilitySystem';
import { playSfx } from '../systems/AudioSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { FxSystem } from '../systems/FxSystem';
import { MusicSystem } from '../systems/MusicSystem';
import { PickupSystem } from '../systems/PickupSystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import type { CardPickData } from './CardPickScene';
import type { GameOverData } from './GameOverScene';
import type { ShopData } from './ShopScene';
import type { UnlockData } from './UnlockScene';

/** Delay between the death and the game over screen. */
const GAME_OVER_DELAY_MS = 1200;

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
	abilities!: AbilitySystem;
	/** True once the run ended (game over); gameplay updates stop. */
	runOver = false;
	private keys!: MoveKeys;

	private startCharacter: CharacterId | undefined;

	constructor() {
		super('Game');
	}

	init(data: { character?: CharacterId }): void {
		this.startCharacter = data?.character;
	}

	create(): void {
		this.runBossKills = 0;
		this.params = getParams(this);
		this.events$ = bus(this.game);
		const seed = this.params.seed ?? randomSeed();
		this.rng = new Rng(seed);
		const character = this.startCharacter ?? this.params.char ?? 'warrior';
		this.state = createRunState(character, seed, this.params.wave ?? 1);
		this.physics.resume();
		// Permanent upgrades (1.0).
		const meta = metaBonus(SaveSystem.get());
		this.state.metaMods = meta.mods;
		this.state.gold += meta.startGold;
		if (meta.startRevive) this.state.revives = 1;
		this.state.hp = finalMaxHp(buildStats(this.state));
		this.applySpeed();
		this.events$.onScene(this, GameEvent.SettingsChanged, () => this.applySpeed());

		const walls = createArena(this, this.rng);
		this.physics.world.setBounds(PLAY_AREA.x, PLAY_AREA.y, PLAY_AREA.width, PLAY_AREA.height);
		const def = CHARACTERS[this.state.character];
		this.player = new Player(this, ARENA_W / 2, ARENA_H / 2, def);
		this.physics.add.collider(this.player, walls);
		this.keys = createMoveKeys(this);
		this.input.keyboard?.on('keydown-ESC', () => this.openPause());
		// Auto-pause when the tab is hidden (always) or the window loses focus (setting).
		const onHidden = () => {
			if (document.hidden) this.openPause();
		};
		const onBlur = () => {
			if (settings.pauseOnBlur) this.openPause();
		};
		document.addEventListener('visibilitychange', onHidden);
		window.addEventListener('blur', onBlur);
		this.events.once('shutdown', () => {
			document.removeEventListener('visibilitychange', onHidden);
			window.removeEventListener('blur', onBlur);
		});

		this.enemyShots = new ProjectileSystem(this, MAX_PROJECTILES, 9);
		this.playerShots = new ProjectileSystem(this, MAX_PROJECTILES, 8);
		this.enemies = new EnemySystem(this, this.player, this.enemyShots);
		this.spawner = new SpawnSystem(this, this.enemies, this.player, this.rng);
		this.spawner.setWave(this.state.wave);
		this.combat = new CombatSystem(this);
		this.fx = new FxSystem(this);
		this.fx.showNumbers = settings.damageNumbers;
		this.pickups = new PickupSystem(this, this.player);
		this.pickups.onCollect = (kind, value) => this.onPickup(kind, value);
		this.runOver = false;

		this.physics.add.overlap(this.player, this.enemies.group, (_p, e) =>
			this.onEnemyContact(e as Enemy),
		);
		this.physics.add.overlap(this.player, this.enemyShots.group, (_p, s) =>
			this.onEnemyShot(s as Projectile),
		);

		this.refreshStats();
		this.weapons = new WeaponSystem(this);
		this.waves = new WaveSystem(this);
		this.abilities = new AbilitySystem(this);
		this.syncAbilities();
		this.setupCamera();

		this.events$.onScene(this, GameEvent.EnemyKilled, () => {
			this.waveKills++;
		});
		this.scene.launch('Hud');
		if (this.params.debug) this.scene.bringToTop('Debug');
		this.waves.start(this.state.wave);
	}

	/** Between waves: card pick, then (1.10) the shop, then the next wave. */
	onWaveEnded(wave: number): void {
		this.time.delayedCall(WAVE_FLOW.intermission * 1000, () => this.openCardPick(wave));
	}

	private openCardPick(wave: number): void {
		const cards = generateCards(
			{
				wave,
				luck: this.stats.luck,
				abilities: this.state.abilities,
				revives: this.state.revives,
			},
			this.rng,
		);
		this.scene.pause();
		this.music?.duck(true);
		let rerolls = 0;
		const cost = () => cardRerollCost(wave, rerolls);
		const data: CardPickData = {
			wave,
			cards,
			sfx: (key) => this.sfx(key),
			gold: () => this.state.gold,
			preview: (card) => this.previewCard(card),
			tutorial: !SaveSystem.get().tutorialDone,
			rerollCost: cost,
			reroll: () => {
				if (this.state.gold < cost()) return null;
				this.setGold(this.state.gold - cost());
				rerolls++;
				const next = generateCards(
					{
						wave,
						luck: this.stats.luck,
						abilities: this.state.abilities,
						revives: this.state.revives,
					},
					this.rng,
				);
				cards.splice(0, cards.length, ...next);
				return next;
			},
			onPick: (index) => {
				const card = cards[index];
				if (card) this.applyPickedCard(card);
				this.scene.resume();
				this.afterCardPick();
			},
		};
		this.scene.launch('CardPick', data);
	}

	applyPickedCard(card: Card): void {
		applyCard(this.state, card, (s) => finalMaxHp(buildStats(s)));
		this.events$.emit(GameEvent.CardPicked, { cardId: card.id, index: 0 });
		this.refreshStats();
		this.checkEvolutions();
		this.syncAbilities();
	}

	/** "STAT a > b" for the stats a change would modify (max 2 shown). */
	private compareText(change: (s: RunState) => void): string {
		const copy = structuredClone(this.state);
		change(copy);
		const lines = statChanges(this.baseStats, buildStats(copy))
			.filter((c) => c.stat !== 'maxHpPct')
			.slice(0, 2)
			.map(
				(c) =>
					`${STAT_SHORT[c.stat]} ${formatStatValue(c.stat, c.before)}>${formatStatValue(c.stat, c.after)}`,
			);
		return lines.join('  ');
	}

	private previewCard(card: Card): string {
		if (card.kind === 'ability') return '';
		return this.compareText((s) => applyCard(s, card, (x) => finalMaxHp(buildStats(x))));
	}

	/** Evolves abilities at level 5 whose evolution item is owned. */
	checkEvolutions(): void {
		const evolved = applyEvolutions(this.state);
		if (evolved.length === 0) return;
		for (const id of evolved) {
			this.fx.floatText(
				this.player.x,
				this.player.y - 20,
				`${STRINGS.evolved}: ${EVOLVED_NAMES[id]}`,
				PALETTE.amber,
			);
		}
		this.sfx(SFX.cardPick);
		this.syncAbilities();
	}

	syncAbilities(): void {
		this.abilities.sync(this.state.abilities);
		this.events$.emit(GameEvent.AbilitiesChanged, { slots: this.abilities.slots() });
	}

	/** Debug helper: learns or sets an ability level. */
	debugAbility(id: string, level = 1): void {
		const a = this.state.abilities.find((x) => x.id === id);
		if (a) a.level = level;
		else this.state.abilities.push({ id, level });
		this.syncAbilities();
	}

	/** After the card: the shop, then the next wave. */
	private afterCardPick(): void {
		const wave = this.state.wave;
		let rerolls = 0;
		const cost = () => shopRerollCost(wave, rerolls);
		const shop: ShopData = {
			wave,
			offers: generateShop(this.rng, wave, this.stats.luck, undefined, this.state.shopLocks),
			gold: () => this.state.gold,
			buy: (i) => {
				const offer = shop.offers[i];
				if (!offer || !buyOffer(this.state, offer)) return false;
				this.setGold(this.state.gold);
				this.refreshStats();
				this.checkEvolutions();
				return true;
			},
			toggleLock: (i) => {
				const offer = shop.offers[i];
				if (offer) offer.locked = !offer.locked;
			},
			sell: (id) => {
				const refund = sellItem(this.state, id);
				this.setGold(this.state.gold);
				this.refreshStats();
				return refund;
			},
			sellValue: (id) => sellValue(id, wave),
			compare: (id) => this.compareText((s) => s.items.push(id)),
			tutorial: !SaveSystem.get().tutorialDone,
			synergies: () => {
				const counts = tagCounts(this.state);
				const tiers = synergyTiers(counts);
				return TAGS.map((tag) => ({ tag, count: counts[tag], tier: tiers[tag] }));
			},
			rerollCost: cost,
			reroll: () => {
				if (this.state.gold < cost()) return null;
				this.setGold(this.state.gold - cost());
				rerolls++;
				shop.offers = generateShop(
					this.rng,
					wave,
					this.stats.luck,
					undefined,
					lockedIds(shop.offers),
				);
				return shop.offers;
			},
			stats: () => this.stats,
			maxHp: () => this.maxHp,
			items: () => this.state.items,
			onContinue: () => {
				if (!SaveSystem.get().tutorialDone) {
					SaveSystem.get().tutorialDone = true;
					SaveSystem.persist();
				}
				this.state.shopLocks = lockedIds(shop.offers);
				this.scene.resume();
				this.waves.start(wave + 1);
			},
		};
		this.scene.pause();
		this.scene.launch('Shop', shop);
	}

	setGold(gold: number): void {
		this.state.gold = gold;
		this.events$.emit(GameEvent.GoldChanged, { gold });
	}

	/** Class passive: recomputed a few times per second. */
	private updatePassive(dt: number): void {
		this.passiveTimer -= dt;
		if (this.passiveTimer > 0) return;
		this.passiveTimer = 0.25;
		const c = this.state.character;
		let next: StatMods = {};
		if (c === 'warrior') {
			let n = 0;
			this.enemies.forEachInRadius(
				this.player.x,
				this.player.y,
				PASSIVES.warrior.radius,
				() => {
					n++;
				},
			);
			next = { armor: Math.min(PASSIVES.warrior.max, n * PASSIVES.warrior.armorPerEnemy) };
		} else if (c === 'ranger') {
			const moving = this.player.arcadeBody.velocity.lengthSq() > 1;
			next = { attackSpeed: moving ? PASSIVES.ranger.attackSpeedMoving : 0 };
		} else {
			next = {
				abilityPower: Math.min(
					PASSIVES.mage.max,
					this.waveKills * PASSIVES.mage.abilityPowerPerKill,
				),
			};
		}
		const changed = Object.entries(next).some(
			([k, v]) => (this.passive[k as keyof StatMods] ?? 0) !== v,
		);
		if (!changed) return;
		this.passive = next;
		this.stats = computeStats(this.baseStats, this.passive);
	}

	/** Wave start hook: unlocks by wave, resets the Mage passive. */
	onWaveStart(wave: number): void {
		this.waveKills = 0;
		this.state.hp = waveStartHp(this.state.hp, this.maxHp);
		this.emitHp();
		this.music?.duck(false);
		this.music?.play(isBossWave(wave) ? 'boss' : 'combat');
		this.handleUnlocks(
			SaveSystem.unlock({ kind: 'wave', character: this.state.character, wave }),
		);
	}

	onBossKilled(): void {
		this.runBossKills++;
		SaveSystem.bossKilled();
		this.handleUnlocks(SaveSystem.unlock({ kind: 'bossKilled' }));
	}

	/** Shows the unlock screen for each new character (the game waits). */
	private handleUnlocks(chars: CharacterId[]): void {
		const next = chars.shift();
		if (!next) return;
		this.time.delayedCall(300, () => {
			if (this.runOver) return;
			this.scene.pause();
			const data: UnlockData = {
				character: next,
				onClose: () => {
					this.scene.resume();
					this.handleUnlocks(chars);
				},
			};
			this.scene.launch('Unlock', data);
		});
	}

	/** Current game speed: ?speed=N (playtests) or the Game speed setting (1x/2x). */
	speed = 1;

	private applySpeed(): void {
		this.speed = this.params.speed > 1 ? this.params.speed : settings.gameSpeed >= 2 ? 2 : 1;
		this.time.timeScale = this.speed;
		this.tweens.timeScale = this.speed;
		this.physics.world.timeScale = 1 / this.speed;
	}

	/** Chiptune music (null before boot). */
	get music(): MusicSystem | null {
		return MusicSystem.get();
	}

	/** Remaining hit-stop (ms of real time). */
	private hitStopMs = 0;
	private lastCritStop = 0;

	/** Freezes the action for a few ms (big hits). */
	hitStop(ms: number): void {
		if (ms <= 0) return;
		if (this.hitStopMs <= 0) this.physics.world.pause();
		this.hitStopMs = Math.max(this.hitStopMs, ms);
	}

	/** Crit hit-stop with a cooldown so fast weapons do not stutter. */
	critHitStop(): void {
		if (this.time.now - this.lastCritStop < HIT_STOP.critCooldown) return;
		this.lastCritStop = this.time.now;
		this.hitStop(HIT_STOP.crit);
	}

	/** Plays a sound effect (jsfxr, pre-rendered). */
	sfx(key: string): void {
		playSfx(key);
	}

	shake(preset: ShakePreset): void {
		if (settings.screenShake) this.cameras.main.shake(preset.ms, preset.intensity);
	}

	onBossDamaged(boss: Enemy): void {
		this.events$.emit(GameEvent.BossHpChanged, { hp: Math.max(0, boss.hp), maxHp: boss.maxHp });
	}

	/** Rare medkit drop: 0.5% · (1 + Luck/100) per kill. */
	maybeDropMedkit(x: number, y: number): void {
		if (this.rng.chance(medkitChance(this.stats.luck))) this.pickups.spawn('medkit', x, y, 0);
	}

	private onPickup(kind: 'gold' | 'medkit', value: number): void {
		if (kind === 'gold') {
			this.sfx(SFX.gold);
			this.fx.burst(this.player.x, this.player.y - 4, PALETTE.amber, 2);
			this.state.totals.goldEarned += value;
			this.setGold(this.state.gold + value);
		} else {
			this.sfx(SFX.heal);
			this.combat.heal(Math.max(1, Math.round(this.maxHp * MEDKIT.healPct)));
		}
	}

	/** Called when HP reaches 0: emits PLAYER_DIED, then revives or ends the run. */
	onPlayerDied(): void {
		const canRevive = this.state.revives > 0;
		this.events$.emit(GameEvent.PlayerDied, { canRevive });
		if (canRevive) this.revive();
		else this.endRun();
	}

	/** Revive: 50% HP, 2 s of invulnerability and a shockwave that pushes enemies away. */
	revive(): void {
		const p = this.player;
		this.state.revives = Math.max(0, this.state.revives - 1);
		this.state.hp = Math.max(1, Math.ceil(this.maxHp * REVIVE.hpPct));
		p.hurt(REVIVE.invuln);
		this.fx.flashSprite(TEX.fxShockwave, p.x, p.y, 0.45, {
			scale: 0.4,
			grow: (REVIVE.shockRadius * 2) / 64 / 0.4,
			depth: 13,
		});
		this.enemies.forEachInRadius(p.x, p.y, REVIVE.shockRadius, (e) => {
			const d = Math.hypot(e.x - p.x, e.y - p.y) || 1;
			e.knockback((e.x - p.x) / d, (e.y - p.y) / d, REVIVE.shockForce);
		});
		this.enemyShots.clear();
		this.fx.floatText(p.x, p.y - 16, STRINGS.revived, PALETTE.amber, 2);
		this.shake(SHAKE.revive);
		this.sfx(SFX.revive);
		this.emitHp();
		this.events$.emit(GameEvent.PlayerRevived, undefined);
	}

	/** ESC during combat: pause the game and show the pause menu. */
	private openPause(): void {
		if (this.runOver || !this.waves.inCombat || this.scene.isPaused()) return;
		this.sfx(SFX.uiClick);
		this.music?.duck(true);
		this.scene.pause();
		this.scene.launch('Pause');
	}

	/** Game over (death or boss time limit): record the run and show the summary. */
	endRun(reason: 'died' | 'timeUp' = 'died'): void {
		if (this.runOver) return;
		this.runOver = true;
		this.music?.stop();
		this.sfx(SFX.gameOver);
		this.physics.pause();
		this.player.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL).setAlpha(0.6);
		this.events$.emit(GameEvent.RunEnded, undefined);
		const s = this.state;
		const reward = SaveSystem.finishRun({
			character: s.character,
			wave: s.wave,
			kills: s.totals.kills,
			goldEarned: s.totals.goldEarned,
			bossKills: this.runBossKills,
			evolved: s.abilities.filter((a) => a.evolved).length,
			abilities: s.abilities.length,
		});
		const newBest = SaveSystem.recordRun({
			character: s.character,
			wave: s.wave,
			kills: s.totals.kills,
			goldEarned: s.totals.goldEarned,
			damageDealt: s.totals.damageDealt,
			timeSec: s.totals.timeSec,
			at: Date.now(),
		});
		const data: GameOverData = {
			character: s.character,
			wave: s.wave,
			totals: { ...s.totals },
			abilities: s.abilities.map((a) => ({ ...a })),
			items: [...s.items],
			newBest,
			bestWave: SaveSystem.get().best[s.character].wave,
			cores: reward.cores,
			achievements: reward.achievements,
			reason,
		};
		if (reason === 'timeUp') {
			this.fx.floatText(this.player.x, this.player.y - 16, STRINGS.timeUp, PALETTE.red, 2);
		}
		this.time.delayedCall(GAME_OVER_DELAY_MS, () => this.scene.launch('GameOver', data));
	}

	/** Stats before the class passive (cards + items + synergies). */
	private baseStats!: Stats;
	private passive: StatMods = {};
	private passiveTimer = 0;
	/** Bosses killed in this run (Cores, achievements). */
	private runBossKills = 0;
	/** Kills in the current wave (Mage passive). */
	private waveKills = 0;

	/** Re-applies derived stats (speed, max HP…) after cards/items change the run. */
	refreshStats(): void {
		this.baseStats = buildStats(this.state);
		this.stats = computeStats(this.baseStats, this.passive);
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
		if (!e.active || e.contactCooldown > 0 || e.burrowed || e.damage <= 0) return;
		if (!this.combat.hurtPlayer(e.damage)) return;
		e.contactCooldown = CONTACT_COOLDOWN;
		const d = Math.hypot(e.x - this.player.x, e.y - this.player.y) || 1;
		e.knockback((e.x - this.player.x) / d, (e.y - this.player.y) / d, CONTACT_BOUNCE);
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
		cam.startFollow(this.player, true);
		cam.setDeadzone(CAMERA_DEADZONE_W, CAMERA_DEADZONE_H);
		const apply = () => {
			const view = getView(this);
			cam.setSize(this.scale.width, this.scale.height);
			cam.setZoom(view.zoom);
			// When the view is larger than the arena, grow the bounds so the arena is centered.
			const bw = Math.max(ARENA_W, view.width);
			const bh = Math.max(ARENA_H, view.height);
			cam.setBounds(-Math.floor((bw - ARENA_W) / 2), -Math.floor((bh - ARENA_H) / 2), bw, bh);
		};
		apply();
		this.scale.on('resize', apply);
		this.events.once('shutdown', () => this.scale.off('resize', apply));
	}

	override update(time: number, deltaMs: number): void {
		if (this.hitStopMs > 0) {
			this.hitStopMs -= deltaMs;
			if (this.hitStopMs > 0) return;
			if (this.waves.inCombat || this.waves.phase === 'ending') this.physics.world.resume();
		}
		const dt = (Math.min(deltaMs, 50) / 1000) * this.speed;
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
			this.abilities.update(dt);
			this.enemies.update(dt);
			this.weapons.update(dt);
			this.enemyShots.update(dt);
			this.playerShots.update(dt);
			this.combat.resolveProjectileHits();
			this.combat.update(dt);
			this.updatePassive(dt);
		}

		debugStats.enemies = this.enemies.aliveCount;
		debugStats.projectiles = this.playerShots.activeCount;
		debugStats.enemyProjectiles = this.enemyShots.activeCount;
		debugStats.bodies = this.physics.world.bodies.size + this.physics.world.staticBodies.size;
	}
}
