import type { GameSpeed, HeroId } from '../../config/constants';
import { ALL_CARDS } from '../../data/cards';
import { COMBAT } from '../../data/combat';
import { DIFFICULTY, type Difficulty, EXTRA_WAVES } from '../../data/difficulty';
import { ECONOMY } from '../../data/economy';
import { ELITE_HAZARD } from '../../data/elite-hazard';
import { BOSS_HAZARD, BOSS_POOL, BOSS_VOLLEY, type EnemyDef } from '../../data/enemies';
import { HEROES } from '../../data/heroes';
import { ROUNDS } from '../../data/rounds';
import { SIM_BRANCH_ORDER } from '../../data/skill-tree';
import { SUPER, SUPERPOWERS } from '../../data/superpowers';
import { STARTING_WEAPONS } from '../../data/unlocks';
import { WEAPON_LINE_BY_ID, weaponTierStats } from '../../data/weapons';
import { bossForRound, enemyPoolForRound } from '../biome';
import {
	addWeapon,
	applyCard,
	type Build,
	emptyBuild,
	setBonuses,
	setCounts,
	type WeaponInstance,
} from '../build';
import { drawCards } from '../cards';
import { armorReduction } from '../combat';
import { extraWaves } from '../difficulty';
import { emptyGear, rollItemDrops } from '../equipment';
import { orbXp } from '../progression';
import { Rng } from '../rng';
import {
	bossHpMul,
	dmgMul,
	eliteTiers,
	hpMul,
	isBossRound,
	isEliteRound,
	roundDuration,
	spawnRate,
} from '../round';
import {
	createRunState,
	endRound,
	finishRun,
	isUpgrade,
	leaveShop,
	weaponCandidates,
} from '../run-state';
import { defaultSave } from '../save';
import { autoAllocate, heroTree } from '../skill-tree';
import { speedFactors } from '../speed';
import { addStat, heroStats, type PlayerStats } from '../stats';
import { pickBest } from './card-policy';
import { makeTaste, playShop, takeDrop } from './shop-policy';

/**
 * Headless balance model (PLAN 3.2): a per-step approximation of a run using the real data,
 * formulas and card draws. It has no positions, so crowd behaviour is folded into the named
 * constants below, calibrated against the real-game playtest bot (docs/balancing-and-simulation.md §10).
 *
 * Two clocks (SDD-018): a step is `SIM.step` seconds of the round clock. Terms that follow `motion`
 * (weapons, contact and boss swings, regen) are multiplied by `motion / clock` (= 2 at every speed);
 * `clock` terms (spawn budget, boss time limit, red-mark hazards) are not. The speed only changes the
 * wall seconds reported (`seconds = clock seconds / clock`).
 */
/** Mutable so calibration scripts can fit it; gameplay never reads it. */
export const SIM = {
	/** Seconds of the round clock simulated per step. */
	step: 0.25,
	/** Campaign is 50 rounds (ADR-023); the rest is endless, cut here so a run always ends. */
	maxRound: 70,
	/** Enemies alive that a kiting hero keeps at bay with no hits (scaled by mobility). */
	safeCrowd: 100,
	/** Contact hits per motion-second per enemy above the safe crowd. */
	hitPerExtra: 0.001,
	/**
	 * Contact hits per motion-second per enemy alive, on top of the crowd term above. Premise: even a kiting
	 * hero gets touched at a rate that follows how many enemies share the screen, so the damage is not 0
	 * below `safeCrowd`. The medium bot (rounds 1-2) fits ~0.003; kept at ~1/3 of that because the bot also
	 * loses HP to slow tanks it should outwalk, and the full value drops the L1 median below goal #1.
	 */
	touchPerEnemy: 0.001,
	/**
	 * Share of ranged-enemy shots (`def.range`, one per `cooldown` of motion time) that land on a hero who
	 * dodges by habit. The bot's round 4 (first shooters) fits ~0.07; kept at ~0.02 for the same reason.
	 */
	shotLand: 0.02,
	/** Hero speed / average enemy speed at which the safe crowd is exactly `safeCrowd`. */
	mobilityRef: 1.35,
	/** Average enemies hit per weapon attack by kind, in a full crowd. */
	hits: { arc: 3.2, spread: 2.6, bolt: 1.6 },
	/** Alive enemies at which the hero reaches half of that crowd factor (kiting = fewer targets). */
	engageHalf: { arc: 75, spread: 30, bolt: 25 },
	/** Share of the damage aimed at the boss (weapons target it first when in range). */
	bossFocus: 0.8,
	/**
	 * Share of the boss attacks that land on a hero who dodges by habit. Swipes (1 per `cooldown`) and
	 * charges (1 per `chargeEvery`) are telegraphed; a volley projectile and a red-mark cast use their own.
	 */
	bossLand: 0.1,
	projectileLand: 0.1,
	/** Boss red-mark cast (BOSS_HAZARD, 1 per `hazardEvery` of the round clock): chance that it lands at all. */
	hazardHit: 0.1,
	/** Seconds the hero stands in the acid pool that spawns on him before leaving it (the others scatter away). */
	poolExposure: 1,
	/** Elite red-mark cast (1 per `ELITE_HAZARD.every` of the round clock): chance it lands, and damage fraction. */
	eliteHit: ELITE_HAZARD.simHitChance,
	eliteDamage: ELITE_HAZARD.simDamage,
	/** Superpower: share of the crowd it clears. */
	superClear: 0.7,
	/**
	 * Superpower: share of its `burst` (every tick or bomb) that reaches the boss. The game applies the full
	 * weapon hit to every enemy in radius, boss included (SuperpowerSystem, no boss resistance). Jack (180) and
	 * Lucia (260) tick on anything whose center is in radius and the hero fights the boss inside that, so all
	 * ticks land. Bob's 16 bombs (radius 80, rings at 100 and 200) cover a boss (radius ~42) standing
	 * 150-200 away only when they fall within 122 of its center: ~4 of 16 by geometry.
	 */
	superBossShare: { jack: 1, bob: 0.25, lucia: 1 } satisfies Record<HeroId, number>,
};

export interface SimConfig {
	hero: HeroId;
	level: number;
	seed: number;
	/** Allocated tree nodes (default: `autoAllocate` in `SIM_BRANCH_ORDER`). */
	tree?: readonly string[];
	/** Difficulty 0–2 (default 1, the baseline). */
	difficulty?: Difficulty;
	/** Tier of the starting weapon (debug). */
	tier?: 1 | 2 | 3;
	/** Game speed (default 1, the standard 1x): only the wall seconds change, see `SIM`. */
	speed?: GameSpeed;
}

/** How the run ended: killed in a normal round, killed by a boss, boss time limit, or lived through `SIM.maxRound`. */
export type SimCause = 'death' | 'bossDeath' | 'bossTimeout' | 'survived';

export interface SimResult {
	hero: HeroId;
	level: number;
	/** Round the hero died on (or SIM.maxRound + 1 if he survived them all). */
	round: number;
	kills: number;
	/** Wall-clock seconds of play (round clock divided by the speed's `clock`). */
	seconds: number;
	damageTaken: number;
	xp: number;
	/** Fish earned over the run (spent or not). */
	fish: number;
	fishSpent: number;
	/** Part of `fishSpent` paid for rerolls. */
	fishRerolled: number;
	/** Pearls paid at the end of the run (rounds + fish / 10). */
	pearls: number;
	/** Final weapon slots as `id:tier`. */
	weapons: string[];
	cause: SimCause;
	cards: string[];
	/** Damage taken per round (index = round − 1), for calibration against the bot. */
	perRound: number[];
}

/** Tree the sim and the playtest bot use for a hero at `level` (greedy, `SIM_BRANCH_ORDER`). */
export function simTree(hero: HeroId, level: number): string[] {
	return autoAllocate(heroTree(hero), level, SIM_BRANCH_ORDER[hero]);
}

const critAvg = (s: PlayerStats) => 1 + Math.min(1, s.crit) * (s.critDamage - 1);

/** Crowd factor of an attack that can hit `full` enemies once the screen is packed. */
function engaged(full: number, half: number, alive: number): number {
	return (full * alive) / (alive + half);
}

/**
 * Damage per second of one weapon slot (crit averaged). `single` = all hits on one target (boss);
 * otherwise a crowd factor by behavior, as in the pre-1.0 model.
 */
export function weaponDps(
	stats: PlayerStats,
	w: WeaponInstance,
	alive = 300,
	single = false,
): number {
	const def = WEAPON_LINE_BY_ID[w.id];
	const t = weaponTierStats(def, w.tier);
	const x = t.extra;
	const hit = t.damage * stats.tagMul[def.classTag] * stats.damage * critAvg(stats);
	const rate = stats.attackSpeed / t.cooldown;
	const count = x.count ?? 1;
	const crowd = (full: number, half: number) => (single ? 1 : engaged(full, half, alive));
	switch (def.behavior) {
		case 'arc':
			return hit * crowd(SIM.hits.arc * stats.area, SIM.engageHalf.arc) * rate;
		case 'spread':
			// Pellets: about half land; piercing adds a second target in a crowd.
			return (
				hit *
				count *
				0.5 *
				(single ? 1.4 : crowd(1, SIM.engageHalf.spread) * (1 + (x.pierce ?? 0) * 0.3)) *
				rate
			);
		case 'bolt':
			return (
				hit * crowd(SIM.hits.bolt * (1 + (x.pierce ?? 0) * 0.5), SIM.engageHalf.bolt) * rate
			);
		case 'thrown':
			return hit * count * rate;
		case 'shooter':
		case 'follower':
			return hit * count * rate;
		case 'lob':
			// Molotov burns 6 ticks; grenades explode once.
			return hit * (w.id === 'molotov' ? 6 : 1) * crowd(2.5 * stats.area, 6) * rate;
		case 'orbit':
			// Per-enemy hit cooldown: each blade touches ~1.2 enemies per cooldown in a crowd.
			return hit * count * crowd(1.2, 6) * (0.4 / t.cooldown) * stats.attackSpeed;
		case 'boomerang':
			return hit * Math.floor(count) * crowd(2, 6) * rate;
		case 'mine':
			return hit * crowd(2 * stats.area, 6) * rate;
		case 'aura':
			return hit * crowd(3 * stats.area, 6) * rate;
		case 'totem':
			return hit * (x.duration ?? 6) * rate;
		case 'cloud':
			return hit * (x.duration ?? 4) * crowd(2.5 * stats.area, 6) * rate;
	}
}

/** Total damage per second of the six slots. */
export function buildDps(stats: PlayerStats, build: Build, alive = 300, single = false): number {
	let total = 0;
	for (const w of build.weapons) total += weaponDps(stats, w, alive, single);
	return total;
}

/** Stats with the build's set bonuses on top (cards already live in `stats`). */
export function effectiveStats(stats: PlayerStats, build: Build): PlayerStats {
	const eff = structuredClone(stats);
	for (const m of setBonuses(build)) addStat(eff, m.stat, m.value);
	return eff;
}

interface AverageEnemy {
	hp: number;
	damage: number;
	xp: number;
	speed: number;
	/** Share of the spawns that are elites, and the mean damage of one (before the Difficulty multiplier). */
	eliteShare: number;
	eliteDamage: number;
	/** Share of the spawns that shoot, the mean (damage / cooldown) of one and the mean damage of the average enemy. */
	rangedShare: number;
	rangedPerSecond: number;
}

/** Average enemy of the pool available in `round`, elites included. */
function averageEnemy(round: number, eliteMul = 1): AverageEnemy {
	const pool = enemyPoolForRound(round);
	const total = pool.reduce((a, e) => a + e.weight, 0);
	const out = {
		hp: 0,
		damage: 0,
		xp: 0,
		speed: 0,
		eliteShare: 0,
		eliteDamage: 0,
		rangedShare: 0,
		rangedPerSecond: 0,
	};
	for (const e of pool) {
		const w = e.weight / total;
		out.hp += e.hp * w;
		out.damage += e.damage * w;
		out.xp += e.xp * w;
		out.speed += e.speed * w;
		if (e.behavior === 'ranged') {
			out.rangedShare += w;
			out.rangedPerSecond += (w * e.damage) / (e.cooldown ?? 3);
		}
	}
	const tiers = eliteTiers(round);
	let eliteHp = 1;
	let eliteDmg = 1;
	let eliteDamageSum = 0;
	if (tiers.includes('purple')) {
		const t = ROUNDS.elite.purple;
		eliteHp += ROUNDS.purpleShare * eliteMul * (t.hp - 1);
		eliteDmg += ROUNDS.purpleShare * eliteMul * (t.damage - 1);
		out.eliteShare += ROUNDS.purpleShare * eliteMul;
		eliteDamageSum += ROUNDS.purpleShare * eliteMul * t.damage;
	}
	if (tiers.includes('orange')) {
		const t = ROUNDS.elite.orange;
		eliteHp += ROUNDS.orangeShare * eliteMul * (t.hp - 1);
		eliteDmg += ROUNDS.orangeShare * eliteMul * (t.damage - 1);
		out.eliteShare += ROUNDS.orangeShare * eliteMul;
		eliteDamageSum += ROUNDS.orangeShare * eliteMul * t.damage;
	}
	// Elite hazards are cast separately (`eliteHazardLoad`), so contact damage keeps only the multiplier.
	out.eliteDamage =
		out.eliteShare > 0 ? (out.damage * dmgMul(round) * eliteDamageSum) / out.eliteShare : 0;
	out.rangedPerSecond *= dmgMul(round);
	out.hp *= hpMul(round) * eliteHp;
	out.damage *= dmgMul(round) * eliteDmg;
	return out;
}

/**
 * Elite red-mark attacks (ELITE_HAZARD) as damage per round-clock second. Premise: elites alive follow
 * their spawn share, at most `maxActive` cast at once, each once per `every` s, and `SIM.eliteHit` of the
 * casts land for `SIM.eliteDamage` of the elite damage (a hero who dodges by habit).
 */
export function eliteHazardLoad(alive: number, eliteShare: number, eliteDamage: number): number {
	const casters = Math.min(alive * eliteShare, ELITE_HAZARD.maxActive);
	return (casters * SIM.eliteHit * SIM.eliteDamage * eliteDamage) / ELITE_HAZARD.every;
}

/** Mean `damage` fraction of the marks of the boss' red-mark rotation (BOSS_HAZARD). */
function hazardDamage(kinds: readonly (keyof typeof BOSS_HAZARD)[]): number {
	if (kinds.length === 0) return 0;
	return kinds.reduce((a, k) => a + BOSS_HAZARD[k].damage, 0) / kinds.length;
}

/**
 * Damage per round-clock second of the boss on the hero before mitigation. `motion` attacks (swipes,
 * charges, volleys, pools: cooldowns follow the movement clock) are scaled by `m = motion / clock`;
 * red-mark casts follow the round clock. Chances to land are `SIM.bossLand`, `projectileLand`, `hazardHit`.
 */
export function bossDps(boss: EnemyDef, bossDmg: number, m: number): number {
	const b = boss.boss;
	const swipes = 1 / (boss.cooldown ?? 3);
	if (!b) return m * swipes * SIM.bossLand * bossDmg;
	const charges = b.chargeEvery > 0 ? 1 / b.chargeEvery : 0;
	const melee = (swipes + charges) * SIM.bossLand * bossDmg;
	const volley =
		b.volleyEvery > 0
			? (b.volleyCount * SIM.projectileLand * BOSS_VOLLEY.damage * bossDmg) / b.volleyEvery
			: 0;
	const pool = b.poolEvery > 0 ? (BOSS_POOL.dps * SIM.poolExposure * bossDmg) / b.poolEvery : 0;
	const marks =
		b.hazardEvery > 0 ? (SIM.hazardHit * hazardDamage(b.hazards) * bossDmg) / b.hazardEvery : 0;
	return m * (melee + volley + pool) + marks;
}

/** Contact hits per second for this many enemies alive around a kiting hero. */
export function contactRate(alive: number, heroSpeed: number, enemySpeed: number): number {
	const mobility = heroSpeed / Math.max(1, enemySpeed) / SIM.mobilityRef;
	const extra = Math.max(0, alive - SIM.safeCrowd * mobility);
	return Math.min(1 / COMBAT.heroIFrames, extra * SIM.hitPerExtra);
}

export function simulateRun(config: SimConfig): SimResult {
	const rng = new Rng(config.seed);
	const hero = HEROES[config.hero];
	const stats = heroStats(hero, config.level, config.tree ?? simTree(config.hero, config.level));
	const build = emptyBuild();
	addWeapon(build, STARTING_WEAPONS[config.hero][0], config.tier ?? 1);
	let eff = effectiveStats(stats, build);
	const superDef = SUPERPOWERS[config.hero];
	const superOn = config.level >= SUPER.unlockLevel;
	const difficulty = config.difficulty ?? 1;
	const mods = DIFFICULTY[difficulty];
	const waves = extraWaves(config.seed, difficulty);
	const gear = emptyGear();
	// Drops use their own stream so adding or tuning them never reshuffles the shop and card draws.
	const dropRng = new Rng((config.seed ^ 0x7f4a7c15) >>> 0);
	const run = createRunState(hero, { seed: config.seed });
	// A shopper with favourites and a noisy pick, not a pure DPS maximizer (docs A3/A4).
	const preference = {
		taste: makeTaste(config.seed),
		rng: new Rng((config.seed ^ 0x9e3779b9) >>> 0),
	};
	const save = defaultSave();
	const cardPool = ALL_CARDS.filter((c) => c.effect.type === 'stat' || c.effect.type === 'perk');
	const weaponPool = weaponCandidates(config.hero);
	let hp = stats.maxHp;
	let kills = 0;
	let seconds = 0;
	let damageTaken = 0;
	let xp = 0;
	let fishEarned = 0;
	let fishCarry = 0;
	let fishSpent = 0;
	let fishRerolled = 0;
	let charge = 0;
	const perRound: number[] = [];
	const { motion, clock } = speedFactors(config.speed ?? 1);
	const m = motion / clock;
	const result = (round: number, cause: SimCause): SimResult => {
		const pearls = finishRun(run, save);
		return {
			hero: config.hero,
			level: config.level,
			round,
			kills,
			seconds,
			damageTaken,
			xp,
			fish: fishEarned,
			fishSpent,
			fishRerolled,
			pearls,
			weapons: build.weapons.map((w) => `${w.id}:${w.tier}`),
			cause,
			cards: [...build.cards],
			perRound,
		};
	};

	for (let round = 1; round <= SIM.maxRound; round++) {
		const duration = roundDuration(round);
		const wave = waves.find((w) => w.round === round)?.kind;
		const enemy = averageEnemy(round, wave === 'elite' ? EXTRA_WAVES.eliteMul : 1);
		enemy.hp *= mods.hp;
		enemy.damage *= mods.dmg;
		enemy.rangedPerSecond *= mods.dmg;
		enemy.speed *= mods.speed;
		const spawnMul = wave === 'horde' ? EXTRA_WAVES.hordeMul : 1;
		const boss = bossForRound(round, config.seed);
		let bossHp = isBossRound(round) ? boss.hp * bossHpMul(round) * mods.hp : 0;
		const bossDmg = boss.damage * dmgMul(round) * mods.dmg;
		const bossPerSecond = bossDps(boss, bossDmg, m);
		const summonPerSecond =
			boss.boss && boss.boss.roarEvery > 0
				? (m * boss.boss.summonCount) / boss.boss.roarEvery
				: 0;
		const eliteDamage = enemy.eliteDamage * mods.dmg;
		let alive = 0;
		let spawnBudget = 0;
		let summonBudget = 0;
		let roundKills = 0;
		let overflow = 0;
		let taken = 0;
		for (let t = 0; t < duration; t += SIM.step) {
			seconds += SIM.step / clock;
			spawnBudget += spawnRate(round) * spawnMul * SIM.step;
			const spawned = Math.floor(spawnBudget);
			spawnBudget -= spawned;
			alive = Math.min(300, alive + spawned);
			if (bossHp > 0) {
				summonBudget += summonPerSecond * SIM.step;
				const summoned = Math.floor(summonBudget);
				summonBudget -= summoned;
				alive = Math.min(300, alive + summoned);
			}
			// Weapons and cooldowns run on the movement clock: `m` times more attacks per round second.
			let dmg = buildDps(eff, build, alive) * SIM.step * m;
			if (bossHp > 0) {
				// Single-target damage on the boss: the crowd factor does not apply.
				const single = buildDps(eff, build, alive, true) * SIM.step * m;
				bossHp -= single * SIM.bossFocus;
				dmg *= 1 - SIM.bossFocus;
			}
			overflow += dmg;
			const killed = Math.min(alive, Math.floor(overflow / Math.max(1, enemy.hp)));
			overflow = alive > killed ? overflow - killed * enemy.hp : 0;
			alive -= killed;
			kills += killed;
			roundKills += killed;
			charge += killed;
			xp += killed * orbXp(enemy.xp, round) * mods.drops;
			if (superOn && charge >= SUPER.charge && (bossHp > 0 || alive >= 25)) {
				charge = 0;
				const cleared = Math.floor(alive * SIM.superClear);
				alive -= cleared;
				kills += cleared;
				roundKills += cleared;
				const main = build.weapons[0] as WeaponInstance;
				const mainDef = WEAPON_LINE_BY_ID[main.id];
				const mainTier = weaponTierStats(mainDef, main.tier);
				const burst =
					mainTier.damage *
					(mainTier.extra.count ?? 1) *
					eff.tagMul[mainDef.classTag] *
					eff.damage *
					superDef.damageMul *
					(superDef.explosions ?? superDef.duration / SUPER.tick);
				if (bossHp > 0) bossHp -= burst * SIM.superBossShare[config.hero];
			}
			const avoid =
				(1 - Math.min(COMBAT.dodgeCap, eff.dodge)) *
				(1 - Math.min(COMBAT.parryCap, eff.parry));
			const armor = 1 - armorReduction(eff.armor);
			// Per alive enemy, `rangedPerSecond` is damage over cooldown of the shooters in the pool: motion clock.
			const touches = Math.min(1 / COMBAT.heroIFrames, alive * SIM.touchPerEnemy);
			let incoming =
				(contactRate(alive, eff.moveSpeed, enemy.speed) + touches) *
				SIM.step *
				m *
				enemy.damage;
			incoming += alive * SIM.shotLand * enemy.rangedPerSecond * SIM.step * m;
			if (bossHp > 0) incoming += bossPerSecond * SIM.step;
			else incoming += eliteHazardLoad(alive, enemy.eliteShare, eliteDamage) * SIM.step;
			const loss = incoming * avoid * armor;
			hp = Math.min(eff.maxHp, hp - loss + eff.regen * SIM.step * m);
			damageTaken += loss;
			taken += loss;
			if (hp <= 0) {
				perRound.push(taken);
				return result(round, bossHp > 0 ? 'bossDeath' : 'death');
			}
			if (isBossRound(round) && bossHp <= 0) break;
		}
		perRound.push(taken);
		if (isBossRound(round) && bossHp > 0) return result(round, 'bossTimeout');
		hp = Math.min(eff.maxHp, hp + eff.maxHp * ROUNDS.roundEndHeal);
		// Rarity IV drops from Elites and V from the Boss (ADR-017): expected kills of the round. Only
		// weapon drops are modelled; equipment is not (as before: the sim has no gear).
		const eliteShare = isEliteRound(round)
			? ROUNDS.purpleShare + (round >= ROUNDS.orangeFrom ? ROUNDS.orangeShare : 0)
			: 0;
		const elites = Math.round(spawnRate(round) * duration * eliteShare);
		// Fish per kill (ECONOMY.fishDrop, expected value): commons roll `common`; elites roll `elite.chance`
		// for their tier. Boss and round-end Fish are paid by `endRound`. Collection is assumed 100%.
		const drop = ECONOMY.fishDrop;
		const orange = round >= ROUNDS.orangeFrom ? ROUNDS.orangeShare : 0;
		const eliteFish =
			eliteShare > 0
				? (ROUNDS.purpleShare * drop.elite.purple + orange * drop.elite.orange) / eliteShare
				: 0;
		const eliteKills = Math.min(elites, roundKills);
		fishCarry +=
			(roundKills - eliteKills) * drop.common + eliteKills * drop.elite.chance * eliteFish;
		const killFish = Math.floor(fishCarry);
		fishCarry -= killFish;
		run.fish += killFish;
		fishEarned += killFish;
		// One Elite Mark per Elite and one Boss Core per Boss pay for shop rarities IV and V (ADR-021).
		run.materials.elite += elites;
		if (isBossRound(round)) run.materials.boss++;
		for (let k = 0; k < elites; k++) {
			for (const drop of rollItemDrops(dropRng, 'elite', { round, hero: config.hero }))
				if (drop.kind === 'weapon') takeDrop(build, gear, stats, drop);
		}
		if (isBossRound(round)) {
			for (const drop of rollItemDrops(dropRng, 'boss', { round, hero: config.hero }))
				if (drop.kind === 'weapon') takeDrop(build, gear, stats, drop);
		}
		eff = effectiveStats(stats, build);
		const offers = drawCards(
			rng,
			{ hero: config.hero, round: round + 1, luck: stats.luck, build },
			cardPool,
			4,
		);
		const offer = offers[pickBest(offers, build, config.hero)];
		if (offer) {
			const r = applyCard(build, stats, offer.card, offer.rarity);
			hp += r.maxHpDelta;
		}
		eff = effectiveStats(stats, build);
		const before = run.fish;
		const roll = {
			rng,
			// The evolution pool (ADR-021): weapons not owned while a slot is free, or above the best copy.
			pool: weaponPool.filter((c) => isUpgrade(c, build, gear)),
			ctx: { hero: config.hero, buildSets: Object.keys(setCounts(build)), luck: eff.luck },
		};
		run.round = round;
		endRound(run, roll);
		fishEarned += run.fish - before;
		const shop = playShop({ run, build, stats: eff, roll, preference });
		fishSpent += shop.spent;
		fishRerolled += shop.rerollFish;
		eff = effectiveStats(stats, build);
		leaveShop(run);
	}
	return result(SIM.maxRound + 1, 'survived');
}

export interface SimSummary {
	hero: HeroId;
	level: number;
	runs: number;
	avgRound: number;
	medianRound: number;
	/** Share of runs that got past round 50 (the campaign; the rest is endless). */
	past50: number;
	/** Runs that ended on a boss round: killed by the boss, or out of time. */
	bossDeaths: number;
	bossTimeouts: number;
	avgKills: number;
	avgXp: number;
	avgPearls: number;
	avgFishSpent: number;
}

export function simulateMany(
	hero: HeroId,
	level: number,
	runs: number,
	seed = 1,
	difficulty: Difficulty = 1,
	speed: GameSpeed = 1,
): SimSummary {
	const results = Array.from({ length: runs }, (_, i) =>
		simulateRun({ hero, level, seed: seed + i, difficulty, speed }),
	);
	const rounds = results.map((r) => r.round).sort((a, b) => a - b);
	const avg = (f: (r: SimResult) => number) => results.reduce((a, r) => a + f(r), 0) / runs;
	return {
		hero,
		level,
		runs,
		avgRound: avg((r) => r.round),
		medianRound: rounds[Math.floor(runs / 2)] as number,
		past50: results.filter((r) => r.round > 50).length / runs,
		bossDeaths: results.filter((r) => r.cause === 'bossDeath').length,
		bossTimeouts: results.filter((r) => r.cause === 'bossTimeout').length,
		avgKills: avg((r) => r.kills),
		avgXp: avg((r) => r.xp),
		avgPearls: avg((r) => r.pearls),
		avgFishSpent: avg((r) => r.fishSpent),
	};
}
