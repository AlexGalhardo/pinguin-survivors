import type { HeroId } from '../../config/constants';
import { COMBAT } from '../../data/combat';
import { ENEMY_LIST } from '../../data/enemies';
import { HEROES } from '../../data/heroes';
import { ROUNDS } from '../../data/rounds';
import { levelScale, SECONDARIES, type SecondaryId } from '../../data/secondaries';
import { SUPER, SUPERPOWERS } from '../../data/superpowers';
import { SIGNATURE, type SignatureWeapon } from '../../data/weapons';
import { biomeForRound, bossForRound } from '../biome';
import { applyCard, type Build, emptyBuild } from '../build';
import { drawCards } from '../cards';
import { armorReduction } from '../combat';
import { orbXp, roundEndFish } from '../progression';
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
import { heroStats, type PlayerStats, type PointStat } from '../stats';
import { applyUpgrades } from '../upgrades';
import { pickBest } from './card-policy';

/**
 * Headless balance model (PLAN 3.2): a per-step approximation of a run using the real data,
 * formulas and card draws. It has no positions, so crowd behaviour is folded into the named
 * constants below, calibrated against the real-game playtest bot (docs/balancing.md §10).
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
	/** Average enemies hit per signature attack by kind, in a full crowd. */
	hits: { arc: 3.2, spread: 2.6, bolt: 1.6 },
	/** Alive enemies at which the hero reaches half of that crowd factor (kiting = fewer targets). */
	engageHalf: { arc: 75, spread: 30, bolt: 25 },
	/** Share of the damage aimed at the boss while the horde keeps coming. */
	bossFocus: 0.55,
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
	/** Start from this weapon tier (debug). */
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
	fish: number;
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

/** Signature weapon damage per second into the crowd (crit averaged). */
export function heroDps(stats: PlayerStats, weapon: SignatureWeapon, alive = 300): number {
	const perHit = weapon.damage * stats.tagMul[weapon.tag] * stats.damage * critAvg(stats);
	const full =
		weapon.kind === 'arc'
			? SIM.hits.arc * stats.area
			: weapon.kind === 'spread'
				? // Pellets: a share of the cone lands, piercing adds a second target.
					SIM.hits.spread * (1 + (weapon.pierce ?? 0) * 0.3)
				: SIM.hits.bolt * (1 + (weapon.pierce ?? 0) * 0.5);
	const targets = engaged(full, SIM.engageHalf[weapon.kind], alive);
	return perHit * targets * weapon.rate * stats.attackSpeed;
}

/** Damage per second of the build's secondaries (average targets per activation). */
export function secondaryDps(stats: PlayerStats, build: Build, alive = 300): number {
	let total = 0;
	for (const [id, level] of Object.entries(build.secondaries) as [SecondaryId, number][]) {
		const d = SECONDARIES[id] as (typeof SECONDARIES)[SecondaryId] & {
			count?: number;
			countPerLevel?: number;
			duration?: number;
		};
		const hit =
			d.damage * levelScale(level) * stats.tagMul[d.tag] * stats.damage * critAvg(stats);
		const count = (d.count ?? 1) + (d.countPerLevel ?? 0) * (level - 1);
		const rate = stats.attackSpeed / d.cooldown;
		const crowd = (n: number) => engaged(n, 6, alive);
		switch (d.behavior) {
			case 'thrown':
				total += hit * count * rate;
				break;
			case 'shooter':
			case 'follower':
				total += hit * rate;
				break;
			case 'lob':
				// Molotov burns 6 ticks; grenades explode once.
				total += hit * (d.id === 'molotov' ? 6 : 1) * crowd(2.5 * stats.area) * rate;
				break;
			case 'stomp':
				total += hit * crowd(4 * stats.area) * rate;
				break;
			case 'chain':
				total += hit * (1 + 0.8 + 0.64 + 0.51 + 0.41) * rate * (alive > 4 ? 1 : 0.5);
				break;
			case 'meteor':
				total += hit * count * crowd(2 * stats.area) * rate;
				break;
			case 'orbit':
				// Each blade touches ~1.2 enemies per second in a crowd (per-enemy cooldown).
				total += hit * count * crowd(1.2);
				break;
			case 'boomerang':
				// Out and back through the line: ~2 hits per throw.
				total += hit * Math.floor(count) * crowd(2) * rate;
				break;
			case 'mine':
				total += hit * crowd(2 * stats.area) * rate;
				break;
			case 'aura':
				total += hit * crowd(3 * stats.area) * (1 / d.cooldown);
				break;
			case 'totem':
				// Zaps once per second for its duration.
				total += hit * (d.duration ?? 6) * rate;
				break;
			case 'cloud':
				total += hit * (d.duration ?? 4) * crowd(2.5 * stats.area) * rate;
				break;
			case 'nova':
				break;
		}
	}
	return total;
}

interface AverageEnemy {
	hp: number;
	damage: number;
	xp: number;
	speed: number;
}

/** Average enemy of the pool available in `round`, elites included. */
function averageEnemy(round: number): AverageEnemy {
	const biome = biomeForRound(round);
	const pool = ENEMY_LIST.filter(
		(e) => e.biome === biome && e.fromRound > 0 && e.fromRound <= round,
	);
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
		eliteHp += ROUNDS.purpleShare * (ROUNDS.elite.purple.hp - 1);
		eliteDmg += ROUNDS.purpleShare * (ROUNDS.elite.purple.damage - 1);
	}
	if (tiers.includes('orange')) {
		eliteHp += ROUNDS.orangeShare * (ROUNDS.elite.orange.hp - 1);
		eliteDmg += ROUNDS.orangeShare * (ROUNDS.elite.orange.damage - 1);
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
	const tier = config.tier ?? 1;
	const build = emptyBuild(tier);
	let weapon = SIGNATURE[config.hero][tier - 1] as SignatureWeapon;
	const superDef = SUPERPOWERS[config.hero];
	const superOn = config.level >= SUPER.unlockLevel;
	let hp = stats.maxHp;
	let kills = 0;
	let seconds = 0;
	let damageTaken = 0;
	let xp = 0;
	let fish = 0;
	let charge = 0;
	const perRound: number[] = [];
	const result = (round: number, diedToBoss: boolean): SimResult => ({
		hero: config.hero,
		level: config.level,
		round,
		kills,
		seconds,
		damageTaken,
		xp,
		fish,
		diedToBoss,
		cards: [...build.cards],
		perRound,
	});

	for (let round = 1; round <= SIM.maxRound; round++) {
		const duration = roundDuration(round);
		const enemy = averageEnemy(round);
		const boss = bossForRound(round);
		let bossHp = isBossRound(round) ? boss.hp * bossHpMul(round) : 0;
		const bossDmg = boss.damage * dmgMul(round);
		let alive = 0;
		let spawnBudget = 0;
		let overflow = 0;
		let taken = 0;
		for (let t = 0; t < duration; t += SIM.step) {
			seconds += SIM.step;
			spawnBudget += spawnRate(round) * SIM.step;
			const spawned = Math.floor(spawnBudget);
			spawnBudget -= spawned;
			alive = Math.min(300, alive + spawned);
			let dmg =
				(heroDps(stats, weapon, alive) + secondaryDps(stats, build, alive)) * SIM.step;
			if (bossHp > 0) {
				// Single-target damage on the boss: the crowd factor does not apply.
				const single =
					(heroDps(stats, weapon, 1e9) / SIM.hits[weapon.kind] +
						secondaryDps(stats, build, 1)) *
					SIM.step;
				bossHp -= single * SIM.bossFocus;
				dmg *= 1 - SIM.bossFocus;
			}
			overflow += dmg;
			const killed = Math.min(alive, Math.floor(overflow / Math.max(1, enemy.hp)));
			overflow = alive > killed ? overflow - killed * enemy.hp : 0;
			alive -= killed;
			kills += killed;
			charge += killed;
			xp += killed * orbXp(enemy.xp, round);
			if (superOn && charge >= SUPER.charge && (bossHp > 0 || alive >= 25)) {
				charge = 0;
				const cleared = Math.floor(alive * SIM.superClear);
				alive -= cleared;
				kills += cleared;
				const burst =
					weapon.damage *
					(weapon.count ?? 1) *
					stats.tagMul[weapon.tag] *
					stats.damage *
					superDef.damageMul *
					(superDef.explosions ?? superDef.duration / SUPER.tick);
				if (bossHp > 0) bossHp -= burst * 0.5;
			}
			const avoid =
				(1 - Math.min(COMBAT.dodgeCap, stats.dodge)) *
				(1 - Math.min(COMBAT.parryCap, stats.parry));
			const armor = 1 - armorReduction(stats.armor);
			let hits = contactRate(alive, stats.moveSpeed, enemy.speed) * SIM.step;
			let incoming = hits * enemy.damage;
			if (bossHp > 0) {
				const bossHits = SIM.bossHitRate * SIM.bossLand * SIM.step;
				hits += bossHits;
				incoming += bossHits * bossDmg;
			}
			const loss = incoming * avoid * armor;
			hp = Math.min(stats.maxHp, hp - loss + stats.regen * SIM.step);
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
		fish += roundEndFish(round);
		const offers = drawCards(rng, {
			hero: config.hero,
			round: round + 1,
			luck: stats.luck,
			build,
		});
		const offer = offers[pickBest(offers, build, config.hero)];
		if (offer) {
			const r = applyCard(build, stats, offer.card, offer.rarity);
			hp += r.maxHpDelta;
			if (r.evolvedTo) weapon = SIGNATURE[config.hero][r.evolvedTo - 1] as SignatureWeapon;
		}
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
}

export function simulateMany(
	hero: HeroId,
	level: number,
	runs: number,
	seed = 1,
	upgrades: Record<string, number> = {},
): SimSummary {
	const results = Array.from({ length: runs }, (_, i) =>
		simulateRun({ hero, level, seed: seed + i, upgrades }),
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
	};
}
