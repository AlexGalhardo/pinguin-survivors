import type { HeroId } from '../config/constants';
import type { HeroDef } from '../data/heroes';
import type { DamageTag, Element } from './combat';

/**
 * Effective hero stats for a run: hero profile + persistent level growth + spent points +
 * run modifiers (cards). Every system reads this, never HEROES directly.
 */
export interface PlayerStats {
	maxHp: number;
	regen: number;
	armor: number;
	moveSpeed: number;
	dodge: number;
	parry: number;
	crit: number;
	critDamage: number;
	resist: Record<Element, number>;
	tagMul: Record<DamageTag, number>;
	/** Global damage multiplier (cards). */
	damage: number;
	/** Attack rate multiplier. */
	attackSpeed: number;
	area: number;
	bleedChance: number;
	poisonChance: number;
	/** On-hit chances to burn, chill (ice) or shock (energy chain) — cards only. */
	burnChance: number;
	chillChance: number;
	shockChance: number;
	lifesteal: number;
	pickupRange: number;
	luck: number;
	xpGain: number;
	/** Extra Fish at the end of a round: Fish × (1 + harvesting) (SDD-003 RF-08). */
	harvesting: number;
	/** Level-up card rerolls available in a run (Workshop `insight`). */
	cardRerolls: number;
}

/** Automatic growth per level above 1 (docs/balancing-and-simulation.md §4). */
export const LEVEL_GROWTH: Record<HeroId, Partial<Record<StatKey, number>>> = {
	jack: { maxHp: 4, armor: 0.4, parry: 0.001 },
	bob: { maxHp: 2.5, crit: 0.003, dodge: 0.001 },
	lucia: { maxHp: 1.5, 'tagMul.magic': 0.006 },
};

/** Spendable level-up points (1 per level) and what each point gives. */
export const POINT_VALUES = {
	attackSpeed: 0.01,
	regen: 0.1,
	armor: 1,
	'resist.fire': 0.01,
	'resist.earth': 0.01,
	'resist.ice': 0.01,
	'resist.energy': 0.01,
	dodge: 0.005,
	parry: 0.005,
	crit: 0.005,
	maxHp: 5,
} as const satisfies Partial<Record<StatKey, number>>;
export type PointStat = keyof typeof POINT_VALUES;

/** Flat keys for modifiers: plain stats plus `resist.<element>` and `tagMul.<tag>`. */
export type StatKey =
	| Exclude<keyof PlayerStats, 'resist' | 'tagMul'>
	| `resist.${Element}`
	| `tagMul.${DamageTag}`;

export function baseStats(hero: HeroDef): PlayerStats {
	return {
		maxHp: hero.hp,
		regen: hero.regen,
		armor: hero.armor,
		moveSpeed: hero.moveSpeed,
		dodge: hero.dodge,
		parry: hero.parry,
		crit: hero.crit,
		critDamage: hero.critDamage,
		resist: { ...hero.resist },
		tagMul: { ...hero.tagMul },
		damage: 1,
		attackSpeed: 1,
		area: 1,
		bleedChance: 0,
		poisonChance: 0,
		burnChance: 0,
		chillChance: 0,
		shockChance: 0,
		lifesteal: 0,
		pickupRange: 60,
		luck: 0,
		xpGain: 1,
		harvesting: 0,
		cardRerolls: 0,
	};
}

export function addStat(stats: PlayerStats, key: StatKey, value: number): void {
	if (key.startsWith('resist.')) {
		const el = key.slice(7) as Element;
		stats.resist[el] += value;
	} else if (key.startsWith('tagMul.')) {
		const tag = key.slice(7) as DamageTag;
		stats.tagMul[tag] += value;
	} else {
		const flat = stats as unknown as Record<string, number>;
		flat[key] = (flat[key] ?? 0) + value;
	}
}

/** Applies modifiers (e.g. `setBonuses(build)`) on top of freshly built stats; not idempotent. */
export function applyModifiers(
	stats: PlayerStats,
	mods: readonly { stat: StatKey; value: number }[],
): void {
	for (const m of mods) addStat(stats, m.stat, m.value);
}

/** Swaps one modifier set for another (e.g. set bonuses after the build changed). */
export function replaceModifiers(
	stats: PlayerStats,
	previous: readonly { stat: StatKey; value: number }[],
	next: readonly { stat: StatKey; value: number }[],
): void {
	applyModifiers(
		stats,
		previous.map((m) => ({ stat: m.stat, value: -m.value })),
	);
	applyModifiers(stats, next);
}

export function getStat(stats: PlayerStats, key: StatKey): number {
	if (key.startsWith('resist.')) return stats.resist[key.slice(7) as Element];
	if (key.startsWith('tagMul.')) return stats.tagMul[key.slice(7) as DamageTag];
	return (stats as unknown as Record<string, number>)[key] as number;
}

/** Stats at the start of a run for a hero at `level` with spent `points`. */
export function heroStats(
	hero: HeroDef,
	level: number,
	points: Partial<Record<string, number>>,
): PlayerStats {
	const s = baseStats(hero);
	for (const [key, perLevel] of Object.entries(LEVEL_GROWTH[hero.id]))
		addStat(s, key as StatKey, (perLevel as number) * (level - 1));
	for (const [key, count] of Object.entries(points)) {
		if (key in POINT_VALUES && count)
			addStat(s, key as StatKey, POINT_VALUES[key as PointStat] * count);
	}
	return s;
}
