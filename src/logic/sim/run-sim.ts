import type { HeroId } from '../../config/constants';
import { ALL_CARDS } from '../../data/cards';
import { COMBAT } from '../../data/combat';
import { DANGER, type Danger, EXTRA_WAVES } from '../../data/difficulty';
import { HEROES } from '../../data/heroes';
import { ROUNDS } from '../../data/rounds';
import { SUPER, SUPERPOWERS } from '../../data/superpowers';
import { STARTING_WEAPONS } from '../../data/unlocks';
import { WEAPON_LINE_BY_ID } from '../../data/weapons';
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
import { orbXp } from '../progression';
import { Rng } from '../rng';
import {
	bossHpMul,
	dmgMul,
	eliteTiers,
	hpMul,
	isBossRound,
	roundDuration,
	spawnRate,
} from '../round';
import { createRunState, endRound, finishRun, leaveShop, weaponCandidates } from '../run-state';
import { defaultSave } from '../save';
import { addStat, heroStats, type PlayerStats, type PointStat } from '../stats';
import { applyUpgrades } from '../upgrades';
import { pickBest } from './card-policy';
import { makeTaste, playShop } from './shop-policy';

/**
 * Headless balance model (PLAN 3.2): a per-step approximation of a run using the real data,
 * formulas and card draws. It has no positions, so crowd behaviour is folded into the named
 * constants below, calibrated against the real-game playtest bot (docs/balancing-and-simulation.md §10).
 */
/** Mutable so calibration scripts can fit it; gameplay never reads it. */
export const SIM = {
	/** Seconds simulated per step. */
	step: 0.25,
	maxRound: 60,
	/** Enemies alive that a kiting hero keeps at bay with no hits (scaled by mobility). */
	safeCrowd: 100,
	/** Contact hits per second per enemy above the safe crowd. */
	hitPerExtra: 0.001,
	/** Hero speed / average enemy speed at which the safe crowd is exactly `safeCrowd`. */
	mobilityRef: 1.35,
	/** Average enemies hit per weapon attack by kind, in a full crowd. */
	hits: { arc: 3.2, spread: 2.6, bolt: 1.6 },
	/** Alive enemies at which the hero reaches half of that crowd factor (kiting = fewer targets). */
	engageHalf: { arc: 75, spread: 30, bolt: 25 },
	/** Share of the damage aimed at the boss (weapons target it first when in range). */
	bossFocus: 0.8,
	/** Boss hits per second on the hero (telegraphed swipes, charges) and share that lands. */
	bossHitRate: 0.33,
	bossLand: 0.1,
	/** Superpower: share of the crowd it clears. */
	superClear: 0.7,
};

export interface SimConfig {
	hero: HeroId;
	level: number;
	seed: number;
	/** Stat points spread evenly over these stats (level − 1 points). */
	pointPlan?: PointStat[];
	/** Danger 0–5 (default 1, the baseline). */
	danger?: Danger;
	/** Tier of the starting weapon (debug). */
	tier?: 1 | 2 | 3;
	/** Workshop upgrade levels by id (applied to the starting stats like the game). */
	upgrades?: Record<string, number>;
}

export interface SimResult {
	hero: HeroId;
	level: number;
	/** Round the hero died on (or SIM.maxRound + 1 if he survived them all). */
	round: number;
	kills: number;
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
	diedToBoss: boolean;
	cards: string[];
	/** Damage taken per round (index = round − 1), for calibration against the bot. */
	perRound: number[];
}

/** Stat-point plans used by the sim and the playtest bot (points spread in this order). */
export const POINT_PLANS: Record<HeroId, PointStat[]> = {
	jack: ['maxHp', 'armor', 'attackSpeed', 'parry'],
	bob: ['crit', 'attackSpeed', 'dodge', 'maxHp'],
	lucia: ['attackSpeed', 'maxHp', 'regen', 'dodge'],
};

export function spendPoints(level: number, plan: readonly PointStat[]): Record<string, number> {
	const points: Record<string, number> = {};
	for (let i = 0; i < level - 1; i++) {
		const stat = plan[i % plan.length] as PointStat;
		points[stat] = (points[stat] ?? 0) + 1;
	}
	return points;
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
	const t = def.tiers[w.tier - 1] as (typeof def.tiers)[number];
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
}

/** Average enemy of the pool available in `round`, elites included. */
function averageEnemy(round: number, eliteMul = 1): AverageEnemy {
	const pool = enemyPoolForRound(round);
	const total = pool.reduce((a, e) => a + e.weight, 0);
	const out = { hp: 0, damage: 0, xp: 0, speed: 0 };
	for (const e of pool) {
		const w = e.weight / total;
		out.hp += e.hp * w;
		out.damage += e.damage * w;
		out.xp += e.xp * w;
		out.speed += e.speed * w;
	}
	const tiers = eliteTiers(round);
	let eliteHp = 1;
	let eliteDmg = 1;
	if (tiers.includes('purple')) {
		eliteHp += ROUNDS.purpleShare * eliteMul * (ROUNDS.elite.purple.hp - 1);
		eliteDmg += ROUNDS.purpleShare * eliteMul * (ROUNDS.elite.purple.damage - 1);
	}
	if (tiers.includes('orange')) {
		eliteHp += ROUNDS.orangeShare * eliteMul * (ROUNDS.elite.orange.hp - 1);
		eliteDmg += ROUNDS.orangeShare * eliteMul * (ROUNDS.elite.orange.damage - 1);
	}
	out.hp *= hpMul(round) * eliteHp;
	out.damage *= dmgMul(round) * eliteDmg;
	return out;
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
	const stats = heroStats(
		hero,
		config.level,
		spendPoints(config.level, config.pointPlan ?? POINT_PLANS[config.hero]),
	);
	applyUpgrades(stats, config.upgrades ?? {});
	const build = emptyBuild();
	addWeapon(build, STARTING_WEAPONS[config.hero][0], config.tier ?? 1);
	let eff = effectiveStats(stats, build);
	const superDef = SUPERPOWERS[config.hero];
	const superOn = config.level >= SUPER.unlockLevel;
	const danger = config.danger ?? 1;
	const mods = DANGER[danger];
	const waves = extraWaves(config.seed, danger);
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
	let fishSpent = 0;
	let fishRerolled = 0;
	let charge = 0;
	const perRound: number[] = [];
	const result = (round: number, diedToBoss: boolean): SimResult => {
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
			diedToBoss,
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
		enemy.speed *= mods.speed;
		const spawnMul = wave === 'horde' ? EXTRA_WAVES.hordeMul : 1;
		const boss = bossForRound(round, config.seed);
		let bossHp = isBossRound(round) ? boss.hp * bossHpMul(round) * mods.hp : 0;
		const bossDmg = boss.damage * dmgMul(round) * mods.dmg;
		let alive = 0;
		let spawnBudget = 0;
		let overflow = 0;
		let taken = 0;
		for (let t = 0; t < duration; t += SIM.step) {
			seconds += SIM.step;
			spawnBudget += spawnRate(round) * spawnMul * SIM.step;
			const spawned = Math.floor(spawnBudget);
			spawnBudget -= spawned;
			alive = Math.min(300, alive + spawned);
			let dmg = buildDps(eff, build, alive) * SIM.step;
			if (bossHp > 0) {
				// Single-target damage on the boss: the crowd factor does not apply.
				const single = buildDps(eff, build, alive, true) * SIM.step;
				bossHp -= single * SIM.bossFocus;
				dmg *= 1 - SIM.bossFocus;
			}
			overflow += dmg;
			const killed = Math.min(alive, Math.floor(overflow / Math.max(1, enemy.hp)));
			overflow = alive > killed ? overflow - killed * enemy.hp : 0;
			alive -= killed;
			kills += killed;
			charge += killed;
			xp += killed * orbXp(enemy.xp, round) * mods.drops;
			if (superOn && charge >= SUPER.charge && (bossHp > 0 || alive >= 25)) {
				charge = 0;
				const cleared = Math.floor(alive * SIM.superClear);
				alive -= cleared;
				kills += cleared;
				const main = build.weapons[0] as WeaponInstance;
				const mainDef = WEAPON_LINE_BY_ID[main.id];
				const mainTier = mainDef.tiers[main.tier - 1] as (typeof mainDef.tiers)[number];
				const burst =
					mainTier.damage *
					(mainTier.extra.count ?? 1) *
					eff.tagMul[mainDef.classTag] *
					eff.damage *
					superDef.damageMul *
					(superDef.explosions ?? superDef.duration / SUPER.tick);
				if (bossHp > 0) bossHp -= burst * 0.5;
			}
			const avoid =
				(1 - Math.min(COMBAT.dodgeCap, eff.dodge)) *
				(1 - Math.min(COMBAT.parryCap, eff.parry));
			const armor = 1 - armorReduction(eff.armor);
			let hits = contactRate(alive, eff.moveSpeed, enemy.speed) * SIM.step;
			let incoming = hits * enemy.damage;
			if (bossHp > 0) {
				const bossHits = SIM.bossHitRate * SIM.bossLand * SIM.step;
				hits += bossHits;
				incoming += bossHits * bossDmg;
			}
			const loss = incoming * avoid * armor;
			hp = Math.min(eff.maxHp, hp - loss + eff.regen * SIM.step);
			damageTaken += loss;
			taken += loss;
			if (hp <= 0) {
				perRound.push(taken);
				return result(round, bossHp > 0);
			}
			if (isBossRound(round) && bossHp <= 0) break;
		}
		perRound.push(taken);
		if (isBossRound(round) && bossHp > 0) return result(round, true);
		hp = Math.min(eff.maxHp, hp + eff.maxHp * ROUNDS.roundEndHeal);
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
			pool: weaponPool,
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
	return result(SIM.maxRound + 1, false);
}

export interface SimSummary {
	hero: HeroId;
	level: number;
	runs: number;
	avgRound: number;
	medianRound: number;
	/** Share of runs that got past round 30 (the third boss). */
	past30: number;
	bossDeaths: number;
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
	upgrades: Record<string, number> = {},
	danger: Danger = 1,
): SimSummary {
	const results = Array.from({ length: runs }, (_, i) =>
		simulateRun({ hero, level, seed: seed + i, upgrades, danger }),
	);
	const rounds = results.map((r) => r.round).sort((a, b) => a - b);
	const avg = (f: (r: SimResult) => number) => results.reduce((a, r) => a + f(r), 0) / runs;
	return {
		hero,
		level,
		runs,
		avgRound: avg((r) => r.round),
		medianRound: rounds[Math.floor(runs / 2)] as number,
		past30: results.filter((r) => r.round > 30).length / runs,
		bossDeaths: results.filter((r) => r.diedToBoss).length,
		avgKills: avg((r) => r.kills),
		avgXp: avg((r) => r.xp),
		avgPearls: avg((r) => r.pearls),
		avgFishSpent: avg((r) => r.fishSpent),
	};
}
