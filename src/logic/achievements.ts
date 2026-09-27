import { HERO_IDS, type HeroId } from '../config/constants';
import {
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

/** Everything achievements read; lives in the save (global, shared by all heroes). */
export interface AchievementProgress {
	lifetime: Record<LifetimeStat, number>;
	hero: Record<HeroId, Record<HeroStat, number>>;
	heroLevels: Record<HeroId, number>;
	runBests: Record<RunBest, number>;
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
		hero: Object.fromEntries(HERO_IDS.map((h) => [h, zeros(HERO_STATS)])) as Record<
			HeroId,
			Record<HeroStat, number>
		>,
		heroLevels: Object.fromEntries(HERO_IDS.map((h) => [h, 1])) as Record<HeroId, number>,
		runBests: zeros(RUN_BESTS),
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

export function buyExtra(state: AchievementState, extra: ExtraDef): BuyResult {
	if (state.purchases.includes(extra.id)) return 'owned';
	if (availablePoints(state) < extra.cost) return 'insufficient';
	state.spent += extra.cost;
	state.purchases.push(extra.id);
	return 'ok';
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
