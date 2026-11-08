import { HERO_IDS, type HeroId } from '../config/constants';
import {
	ACHIEVEMENT_SHOP,
	ACHIEVEMENTS,
	type AchievementCondition,
	type AchievementDef,
	type ExtraDef,
	type Feat,
	HERO_STATS,
	type HeroStat,
	LIFETIME_STATS,
	type LifetimeStat,
	RUN_BESTS,
	type RunBest,
} from '../data/achievements';
import { SET_IDS, type SetId } from '../data/sets';
import { addStat, type PlayerStats } from './stats';

/** Everything achievements read; lives in the save (global, shared by all heroes). */
export interface AchievementProgress {
	lifetime: Record<LifetimeStat, number>;
	hero: Record<HeroId, Record<HeroStat, number>>;
	heroLevels: Record<HeroId, number>;
	runBests: Record<RunBest, number>;
	/** Most weapons of each set owned at once in any run (set achievements). */
	setBest: Record<SetId, number>;
	feats: Feat[];
}

export interface AchievementState {
	/** id → unlock timestamp (ms). */
	unlocked: Record<string, number>;
	/** Achievement points already spent in the extras shop. */
	spent: number;
	purchases: string[];
}

export function emptyProgress(): AchievementProgress {
	const zeros = <K extends string>(keys: readonly K[]) =>
		Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
	return {
		lifetime: zeros(LIFETIME_STATS),
		hero: Object.fromEntries(
			HERO_IDS.map((h) => [h, { ...zeros(HERO_STATS), dangerUnlocked: 1 }]),
		) as Record<HeroId, Record<HeroStat, number>>,
		heroLevels: Object.fromEntries(HERO_IDS.map((h) => [h, 1])) as Record<HeroId, number>,
		runBests: zeros(RUN_BESTS),
		setBest: zeros(SET_IDS),
		feats: [],
	};
}

export function emptyAchievementState(): AchievementState {
	return { unlocked: {}, spent: 0, purchases: [] };
}

function met(c: AchievementCondition, p: AchievementProgress, unlockedCount: number): boolean {
	switch (c.kind) {
		case 'lifetime':
			return p.lifetime[c.stat] >= c.value;
		case 'hero':
			return p.hero[c.hero][c.stat] >= c.value;
		case 'heroLevel':
			return p.heroLevels[c.hero] >= c.value;
		case 'allHeroesLevel':
			return HERO_IDS.every((h) => p.heroLevels[h] >= c.value);
		case 'allHeroesStat':
			return HERO_IDS.every((h) => p.hero[h][c.stat] >= c.value);
		case 'set':
			return p.setBest[c.set] >= c.value;
		case 'runBest':
			return p.runBests[c.stat] >= c.value;
		case 'feat':
			return p.feats.includes(c.feat);
		case 'achievements':
			return unlockedCount >= c.value;
	}
}

/**
 * Unlocks every achievement whose condition is met and returns the new ones (in definition
 * order). Loops because meta achievements ("unlock N achievements") depend on the others.
 */
export function evaluateAchievements(
	progress: AchievementProgress,
	state: AchievementState,
	now: number,
	defs: readonly AchievementDef[] = ACHIEVEMENTS,
): AchievementDef[] {
	const fresh: AchievementDef[] = [];
	let changed = true;
	while (changed) {
		changed = false;
		const count = Object.keys(state.unlocked).length;
		for (const def of defs) {
			if (state.unlocked[def.id] !== undefined) continue;
			if (!met(def.condition, progress, count)) continue;
			state.unlocked[def.id] = now;
			fresh.push(def);
			changed = true;
		}
	}
	return fresh;
}

/** 1 point per unlocked achievement minus what was spent (P-41/P-42). */
export function availablePoints(state: AchievementState): number {
	return Object.keys(state.unlocked).length - state.spent;
}

export type BuyResult = 'ok' | 'owned' | 'insufficient';

/** Levels owned of an extra: each purchase is one entry in `purchases` (save format v1). */
export function extraLevel(state: AchievementState, id: string): number {
	return state.purchases.filter((p) => p === id).length;
}

export function buyExtra(state: AchievementState, extra: ExtraDef): BuyResult {
	if (extraLevel(state, extra.id) >= (extra.maxLevel ?? 1)) return 'owned';
	if (availablePoints(state) < extra.cost) return 'insufficient';
	state.spent += extra.cost;
	state.purchases.push(extra.id);
	return 'ok';
}

/** Adds the owned stat extras to a run's starting stats (levels capped at their max). */
export function applyExtras(
	stats: PlayerStats,
	state: AchievementState,
	shop: readonly ExtraDef[] = ACHIEVEMENT_SHOP,
): PlayerStats {
	for (const e of shop) {
		if (!e.stat || !e.perLevel) continue;
		const level = Math.min(e.maxLevel ?? 1, extraLevel(state, e.id));
		if (level > 0) addStat(stats, e.stat, e.perLevel * level);
	}
	return stats;
}

/** Progress (0..1) towards a threshold achievement, for the achievements screen. */
export function achievementProgress(def: AchievementDef, p: AchievementProgress): number {
	const c = def.condition;
	const value = (() => {
		switch (c.kind) {
			case 'lifetime':
				return p.lifetime[c.stat];
			case 'hero':
				return p.hero[c.hero][c.stat];
			case 'heroLevel':
				return p.heroLevels[c.hero];
			case 'allHeroesLevel':
				return Math.min(...HERO_IDS.map((h) => p.heroLevels[h]));
			case 'allHeroesStat':
				return Math.min(...HERO_IDS.map((h) => p.hero[h][c.stat]));
			case 'set':
				return p.setBest[c.set];
			case 'runBest':
				return p.runBests[c.stat];
			default:
				return undefined;
		}
	})();
	if (value === undefined || !('value' in c)) return 0;
	return Math.min(1, value / c.value);
}

export function toRoman(n: number): string {
	const table: [number, string][] = [
		[10, 'X'],
		[9, 'IX'],
		[5, 'V'],
		[4, 'IV'],
		[1, 'I'],
	];
	let out = '';
	let rest = n;
	for (const [v, s] of table) {
		while (rest >= v) {
			out += s;
			rest -= v;
		}
	}
	return out;
}
