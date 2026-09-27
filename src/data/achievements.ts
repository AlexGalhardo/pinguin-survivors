import { HERO_IDS, type HeroId } from '../config/constants';

/**
 * Global achievements (shared by every hero; P-41). Each one is worth 1 achievement point.
 * Families expand into tiers so names/descriptions stay templated in i18n
 * (`ach.<family>.name` + roman tier, `ach.<family>.desc` with {n}).
 */

/** Lifetime counters kept in the save (summed over every run and hero). */
export const LIFETIME_STATS = [
	'kills',
	'elitePurpleKills',
	'eliteOrangeKills',
	'bossKills',
	'runs',
	'fishEarned',
	'cardsPicked',
	'legendaryCards',
	'evolutionsT2',
	'evolutionsT3',
	'crits',
	'parries',
	'dodges',
	'bleedKills',
	'poisonKills',
	'fireKills',
	'iceKills',
	'earthKills',
	'energyKills',
	'potionsUsed',
	'damageDealt',
	'secondsPlayed',
	'gibs',
] as const;
export type LifetimeStat = (typeof LIFETIME_STATS)[number];

/** Per-hero lifetime counters. */
export const HERO_STATS = ['exclusiveCards', 'superUses', 'bestRound', 'evolvedT3'] as const;
export type HeroStat = (typeof HERO_STATS)[number];

/** Best value reached inside a single run. */
export const RUN_BESTS = ['killsInRun', 'superKillsOneCast', 'maxRound'] as const;
export type RunBest = (typeof RUN_BESTS)[number];

/** One-off feats flagged by gameplay events. */
export const FEATS = [
	'bossNoPotion',
	'bossUnder60s',
	'bossLastSecond',
	'bossAt2x',
	'roundNoDamage',
	'clutchPotion',
	'gambitTriple',
	'fullSecondariesMax',
	'unlockBob',
	'unlockLucia',
	'bossBear',
	'bossBiome2',
	'bossBiome3',
] as const;
export type Feat = (typeof FEATS)[number];

export type AchievementCondition =
	| { kind: 'lifetime'; stat: LifetimeStat; value: number }
	| { kind: 'hero'; hero: HeroId; stat: HeroStat; value: number }
	| { kind: 'heroLevel'; hero: HeroId; value: number }
	| { kind: 'allHeroesLevel'; value: number }
	| { kind: 'runBest'; stat: RunBest; value: number }
	| { kind: 'feat'; feat: Feat }
	| { kind: 'achievements'; value: number };

export interface AchievementDef {
	id: string;
	/** i18n family: `ach.<family>.name` / `ach.<family>.desc`. */
	family: string;
	/** 1-based tier inside the family (roman numeral in the name). */
	tier: number;
	/** Hero shown in the name/description, when the family is per hero. */
	hero?: HeroId;
	condition: AchievementCondition;
}

const defs: AchievementDef[] = [];

function lifetime(family: string, stat: LifetimeStat, values: number[]): void {
	for (const [i, value] of values.entries())
		defs.push({
			id: `${family}.${i + 1}`,
			family,
			tier: i + 1,
			condition: { kind: 'lifetime', stat, value },
		});
}

function perHero(family: string, stat: HeroStat, values: number[]): void {
	for (const hero of HERO_IDS) {
		for (const [i, value] of values.entries())
			defs.push({
				id: `${family}.${hero}.${i + 1}`,
				family,
				tier: i + 1,
				hero,
				condition: { kind: 'hero', hero, stat, value },
			});
	}
}

function runBest(family: string, stat: RunBest, values: number[]): void {
	for (const [i, value] of values.entries())
		defs.push({
			id: `${family}.${i + 1}`,
			family,
			tier: i + 1,
			condition: { kind: 'runBest', stat, value },
		});
}

lifetime('kills', 'kills', [100, 500, 1_000, 5_000, 10_000, 50_000, 100_000]);
lifetime('elitePurple', 'elitePurpleKills', [10, 100, 500]);
lifetime('eliteOrange', 'eliteOrangeKills', [10, 100, 500]);
lifetime('bosses', 'bossKills', [1, 10, 50]);
runBest('round', 'maxRound', [5, 10, 15, 20, 30, 40, 50, 75, 100]);
perHero('heroRound', 'bestRound', [10, 20, 30]);
for (const hero of HERO_IDS) {
	for (const [i, value] of [10, 25, 50, 75, 100].entries())
		defs.push({
			id: `heroLevel.${hero}.${i + 1}`,
			family: 'heroLevel',
			tier: i + 1,
			hero,
			condition: { kind: 'heroLevel', hero, value },
		});
}
lifetime('runs', 'runs', [1, 10, 50, 100, 500]);
lifetime('fish', 'fishEarned', [100, 1_000, 10_000, 100_000]);
lifetime('cards', 'cardsPicked', [50, 500, 2_000]);
lifetime('legendary', 'legendaryCards', [1, 25, 100]);
lifetime('evolveT2', 'evolutionsT2', [1]);
lifetime('evolveT3', 'evolutionsT3', [1]);
perHero('heroT3', 'evolvedT3', [1]);
perHero('exclusive', 'exclusiveCards', [10, 100]);
perHero('super', 'superUses', [1, 25, 100]);
runBest('superCast', 'superKillsOneCast', [50, 150]);
lifetime('crits', 'crits', [1_000, 10_000, 100_000]);
lifetime('parries', 'parries', [100, 1_000]);
lifetime('dodges', 'dodges', [100, 1_000]);
lifetime('bleed', 'bleedKills', [500, 5_000]);
lifetime('poison', 'poisonKills', [500, 5_000]);
lifetime('fire', 'fireKills', [1_000]);
lifetime('ice', 'iceKills', [1_000]);
lifetime('earth', 'earthKills', [1_000]);
lifetime('energy', 'energyKills', [1_000]);
lifetime('potions', 'potionsUsed', [10, 100, 500]);
lifetime('damage', 'damageDealt', [1_000_000, 10_000_000, 100_000_000]);
lifetime('time', 'secondsPlayed', [3_600, 36_000, 180_000]);
runBest('runKills', 'killsInRun', [1_000, 5_000]);
lifetime('gibs', 'gibs', [10_000, 100_000]);
for (const feat of FEATS) {
	defs.push({
		id: `feat.${feat}`,
		family: `feat.${feat}`,
		tier: 0,
		condition: { kind: 'feat', feat },
	});
}
defs.push({
	id: 'allHeroes.1',
	family: 'allHeroes',
	tier: 1,
	condition: { kind: 'allHeroesLevel', value: 10 },
});
for (const [i, value] of [25, 50, 100].entries())
	defs.push({
		id: `hunter.${i + 1}`,
		family: 'hunter',
		tier: i + 1,
		condition: { kind: 'achievements', value },
	});

export const ACHIEVEMENTS: readonly AchievementDef[] = defs;

/** Extras bought with achievement points (content still to be defined; P-42). */
export interface ExtraDef {
	id: string;
	cost: number;
}

export const ACHIEVEMENT_SHOP: readonly ExtraDef[] = [];
