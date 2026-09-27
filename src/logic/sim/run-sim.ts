import type { HeroId } from '../../config/constants';
import { ALL_CARDS, type CardDef } from '../../data/cards';
import { COMBAT } from '../../data/combat';
import { BOSS_BY_BIOME, ENEMIES, ENEMY_LIST } from '../../data/enemies';
import { HEROES } from '../../data/heroes';
import { SIGNATURE, type SignatureWeapon } from '../../data/weapons';
import { applyCard, emptyBuild } from '../build';
import { drawCards } from '../cards';
import { armorReduction } from '../combat';
import { orbXp, roundEndFish } from '../progression';
import { Rng } from '../rng';
import { bossHpMul, dmgMul, hpMul, isBossRound, roundDuration, spawnRate } from '../round';
import { heroStats, type PlayerStats, type PointStat } from '../stats';

/**
 * Headless balance model (PLAN 3.2): a per-second approximation of a run using the real data
 * and formulas. It is not the game — no positions — but it moves when the numbers move, which
 * is what balancing needs. Assumptions are named constants below.
 */
export const SIM = {
	/** Enemies that can touch the hero at once (the crowd around him). */
	contactCap: 6,
	/** Share of alive enemies already in contact range. */
	contactShare: 0.25,
	/** Average enemies hit per signature attack by kind (crowded screen). */
	hits: { arc: 3.5, spread: 3, bolt: 1.6 },
	/** Seconds simulated per step. */
	step: 0.25,
	maxRound: 60,
} as const;

export interface SimConfig {
	hero: HeroId;
	level: number;
	seed: number;
	/** Stat points spread evenly over these stats (level − 1 points). */
	pointPlan?: PointStat[];
}

export interface SimResult {
	hero: HeroId;
	level: number;
	/** Round the hero died on (or SIM.maxRound if he survived). */
	round: number;
	kills: number;
	seconds: number;
	damageTaken: number;
	xp: number;
	fish: number;
	diedToBoss: boolean;
}

const DEFAULT_POINTS: Record<HeroId, PointStat[]> = {
	jack: ['maxHp', 'armor', 'attackSpeed', 'parry'],
	bob: ['crit', 'attackSpeed', 'dodge', 'maxHp'],
	lucia: ['attackSpeed', 'maxHp', 'regen', 'dodge'],
};

function spendPoints(level: number, plan: PointStat[]): Record<string, number> {
	const points: Record<string, number> = {};
	for (let i = 0; i < level - 1; i++) {
		const stat = plan[i % plan.length] as PointStat;
		points[stat] = (points[stat] ?? 0) + 1;
	}
	return points;
}

/** Damage per second of the signature weapon against a crowd (crit averaged). */
export function heroDps(stats: PlayerStats, weapon: SignatureWeapon): number {
	const perHit = weapon.damage * (weapon.count ?? 1) * stats.tagMul[weapon.tag] * stats.damage;
	const crit = 1 + Math.min(1, stats.crit) * (stats.critDamage - 1);
	const targets = SIM.hits[weapon.kind] * (weapon.kind === 'arc' ? stats.area : 1);
	// Spread pellets already count in `count`; their crowd factor is how many land.
	const crowd = weapon.kind === 'spread' ? SIM.hits.spread / (weapon.count ?? 1) + 0.5 : targets;
	return perHit * crit * weapon.rate * stats.attackSpeed * crowd;
}

/** Average enemy (HP, contact damage) of the pool available in `round`. */
function averageEnemy(round: number): { hp: number; damage: number; xp: number } {
	const pool = ENEMY_LIST.filter((e) => e.fromRound > 0 && e.fromRound <= round);
	const total = pool.reduce((a, e) => a + e.weight, 0);
	let hp = 0;
	let damage = 0;
	let xp = 0;
	for (const e of pool) {
		const w = e.weight / total;
		hp += e.hp * w;
		damage += e.damage * w;
		xp += e.xp * w;
	}
	return { hp: hp * hpMul(round), damage: damage * dmgMul(round), xp };
}

/** Heuristic card choice: prefer damage/defense for the hero's weak spot, else the first. */
function pickCard(offers: { card: CardDef }[], rng: Rng): number {
	const score = (c: CardDef) => {
		const e = c.effect;
		if (e.type === 'evolve') return 100;
		if (e.type === 'stat') {
			if (['damage', 'attackSpeed', 'crit', 'critDamage'].includes(e.stat)) return 10;
			if (['maxHp', 'armor', 'regen', 'dodge'].includes(e.stat)) return 8;
			return 4;
		}
		return 3 + rng.next();
	};
	let best = 0;
	offers.forEach((o, i) => {
		if (score(o.card) > score((offers[best] as { card: CardDef }).card)) best = i;
	});
	return best;
}

export function simulateRun(config: SimConfig): SimResult {
	const rng = new Rng(config.seed);
	const hero = HEROES[config.hero];
	const stats = heroStats(
		hero,
		config.level,
		spendPoints(config.level, config.pointPlan ?? DEFAULT_POINTS[config.hero]),
	);
	const build = emptyBuild(1);
	let weapon = SIGNATURE[config.hero][0] as SignatureWeapon;
	let hp = stats.maxHp;
	let kills = 0;
	let seconds = 0;
	let damageTaken = 0;
	let xp = 0;
	let fish = 0;

	for (let round = 1; round <= SIM.maxRound; round++) {
		const duration = roundDuration(round);
		const enemy = averageEnemy(round);
		let alive = 0;
		let spawnBudget = 0;
		/** Damage dealt but not yet enough to kill one more enemy (carried between steps). */
		let overflow = 0;
		let bossHp = isBossRound(round)
			? ENEMIES[BOSS_BY_BIOME.antarctica].hp * bossHpMul(round)
			: 0;
		const bossDmg = isBossRound(round)
			? ENEMIES[BOSS_BY_BIOME.antarctica].damage * dmgMul(round)
			: 0;
		for (let t = 0; t < duration; t += SIM.step) {
			seconds += SIM.step;
			spawnBudget += spawnRate(round) * SIM.step;
			const spawned = Math.floor(spawnBudget);
			spawnBudget -= spawned;
			alive = Math.min(300, alive + spawned);
			let dps = heroDps(stats, weapon) * SIM.step;
			if (bossHp > 0) {
				// Half the damage goes to the boss while the horde keeps coming.
				bossHp -= dps * 0.5;
				dps *= 0.5;
			}
			overflow += dps;
			const killed = Math.min(alive, Math.floor(overflow / Math.max(1, enemy.hp)));
			overflow = alive > killed ? overflow - killed * enemy.hp : 0;
			alive -= killed;
			kills += killed;
			xp += killed * orbXp(enemy.xp, round);
			// Contact: at most one hit per invulnerability window.
			const touching = Math.min(SIM.contactCap, alive * SIM.contactShare);
			const hitsPerSecond = Math.min(touching, 1 / COMBAT.heroIFrames);
			const avoid =
				(1 - Math.min(COMBAT.dodgeCap, stats.dodge)) *
				(1 - Math.min(COMBAT.parryCap, stats.parry));
			const perHit =
				(bossHp > 0 ? Math.max(enemy.damage, bossDmg * 0.3) : enemy.damage) *
				(1 - armorReduction(stats.armor));
			const taken = hitsPerSecond * SIM.step * avoid * perHit;
			hp = Math.min(stats.maxHp, hp - taken + stats.regen * SIM.step);
			damageTaken += taken;
			if (hp <= 0)
				return {
					hero: config.hero,
					level: config.level,
					round,
					kills,
					seconds,
					damageTaken,
					xp,
					fish,
					diedToBoss: bossHp > 0,
				};
			if (isBossRound(round) && bossHp <= 0) break;
		}
		if (isBossRound(round) && bossHp > 0)
			return {
				hero: config.hero,
				level: config.level,
				round,
				kills,
				seconds,
				damageTaken,
				xp,
				fish,
				diedToBoss: true,
			};
		fish += roundEndFish(round);
		const offers = drawCards(rng, {
			hero: config.hero,
			round: round + 1,
			luck: stats.luck,
			build,
		});
		const offer = offers[pickCard(offers, rng)];
		if (offer) {
			const r = applyCard(build, stats, offer.card, offer.rarity);
			hp += r.maxHpDelta;
			if (r.evolvedTo) weapon = SIGNATURE[config.hero][r.evolvedTo - 1] as SignatureWeapon;
		}
	}
	return {
		hero: config.hero,
		level: config.level,
		round: SIM.maxRound,
		kills,
		seconds,
		damageTaken,
		xp,
		fish,
		diedToBoss: false,
	};
}

export interface SimSummary {
	hero: HeroId;
	level: number;
	runs: number;
	avgRound: number;
	medianRound: number;
	bossDeaths: number;
	avgKills: number;
	avgXp: number;
}

export function simulateMany(hero: HeroId, level: number, runs: number, seed = 1): SimSummary {
	const results = Array.from({ length: runs }, (_, i) =>
		simulateRun({ hero, level, seed: seed + i }),
	);
	const rounds = results.map((r) => r.round).sort((a, b) => a - b);
	const avg = (f: (r: SimResult) => number) => results.reduce((a, r) => a + f(r), 0) / runs;
	return {
		hero,
		level,
		runs,
		avgRound: avg((r) => r.round),
		medianRound: rounds[Math.floor(runs / 2)] as number,
		bossDeaths: results.filter((r) => r.diedToBoss).length,
		avgKills: avg((r) => r.kills),
		avgXp: avg((r) => r.xp),
	};
}

/** Kept for callers that want the full pool (e.g. scripts). */
export const SIM_CARDS = ALL_CARDS;
