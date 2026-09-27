import { HERO_IDS, type HeroId } from '../config/constants';
import {
	type AchievementDef,
	FEATS,
	HERO_STATS,
	LIFETIME_STATS,
	type LifetimeStat,
	RUN_BESTS,
} from '../data/achievements';
import { RESOLUTION_IDS, type ResolutionId } from '../data/display';
import {
	GAMBIT_CONDITIONS,
	GAMBIT_SLOTS,
	type GambitCondition,
	POTION_TYPES,
	type PotionType,
} from '../data/potions';
import type { Lang } from '../i18n';
import {
	type AchievementProgress,
	type AchievementState,
	emptyAchievementState,
	emptyProgress,
	evaluateAchievements,
} from './achievements';

/**
 * Local save (localStorage, one JSON document). SemVer public API: bump SAVE_VERSION and add a
 * migration whenever the shape changes incompatibly.
 */
export const SAVE_VERSION = 1;
export const SAVE_KEY = 'pinguin-survivors.save';
export const HISTORY_SIZE = 20;

export type GoreMode = 'max' | 'reduced' | 'goo';

export interface Settings {
	lang: Lang;
	volume: { master: number; music: number; sfx: number; voice: number };
	gore: GoreMode;
	screenShake: boolean;
	damageNumbers: boolean;
	resolution: ResolutionId;
}

export interface HeroSave {
	unlocked: boolean;
	level: number;
	/** XP inside the current level. */
	xp: number;
	/** Stat points spent, by stat id (level-up points; P-25). */
	points: Record<string, number>;
}

export interface Gambit {
	potion: PotionType | null;
	condition: GambitCondition | null;
}

export type RunOutcome = 'death' | 'bossTimeout' | 'quit';

/** One finished run, shown in the match history (newest first). */
export interface RunRecord {
	id: string;
	startedAt: number;
	endedAt: number;
	hero: HeroId;
	heroLevel: number;
	tier: 1 | 2 | 3;
	round: number;
	outcome: RunOutcome;
	durationSec: number;
	kills: number;
	damageDealt: number;
	fishEarned: number;
	xpEarned: number;
	levelsGained: number;
	secondaries: { id: string; level: number }[];
	cards: string[];
	seed: number;
}

/** Run in progress, saved at every round end so "Continue" resumes at the next round. */
export interface RunSnapshot {
	savedAt: number;
	seed: number;
	hero: HeroId;
	nextRound: number;
	/** Serialized RunState (owned by the run code; validated there). */
	state: Record<string, unknown>;
}

export interface SaveData {
	version: number;
	settings: Settings;
	heroes: Record<HeroId, HeroSave>;
	fish: number;
	potions: Record<PotionType, number>;
	gambits: Gambit[];
	upgrades: Record<string, number>;
	progress: AchievementProgress;
	achievements: AchievementState;
	history: RunRecord[];
	activeRun: RunSnapshot | null;
}

export function defaultSave(lang: Lang = 'en'): SaveData {
	return {
		version: SAVE_VERSION,
		settings: {
			lang,
			volume: { master: 0.8, music: 0.6, sfx: 0.8, voice: 0.8 },
			gore: 'max',
			screenShake: true,
			damageNumbers: true,
			resolution: 'auto',
		},
		heroes: Object.fromEntries(
			HERO_IDS.map((h) => [h, { unlocked: h === 'jack', level: 1, xp: 0, points: {} }]),
		) as Record<HeroId, HeroSave>,
		fish: 0,
		potions: Object.fromEntries(POTION_TYPES.map((p) => [p, 0])) as Record<PotionType, number>,
		gambits: Array.from({ length: GAMBIT_SLOTS }, () => ({ potion: null, condition: null })),
		upgrades: {},
		progress: emptyProgress(),
		achievements: emptyAchievementState(),
		history: [],
		activeRun: null,
	};
}

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number =>
	typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
	options.includes(v as T) ? (v as T) : fallback;
const oneOfOrNull = <T extends string>(v: unknown, options: readonly T[]): T | null =>
	options.includes(v as T) ? (v as T) : null;

function numRecord<K extends string>(v: unknown, keys: readonly K[], base: Record<K, number>) {
	const src = isObj(v) ? v : {};
	return Object.fromEntries(keys.map((k) => [k, num(src[k], base[k])])) as Record<K, number>;
}

/** Past versions → current. Each step receives the raw object of version N and returns N+1. */
const MIGRATIONS: Record<number, (raw: Json) => Json> = {};

/**
 * Parses a stored/imported save. Never throws: corrupt or missing data falls back to defaults
 * field by field, so one bad value does not wipe the player's progress.
 */
export function parseSave(json: string | null, lang: Lang = 'en'): SaveData {
	const base = defaultSave(lang);
	if (!json) return base;
	let raw: unknown;
	try {
		raw = JSON.parse(json);
	} catch {
		return base;
	}
	if (!isObj(raw)) return base;
	let version = num(raw.version, 0);
	if (version > SAVE_VERSION) return base;
	while (version < SAVE_VERSION && MIGRATIONS[version]) {
		raw = (MIGRATIONS[version] as (r: Json) => Json)(raw as Json);
		version++;
	}
	const r = raw as Json;

	const s = isObj(r.settings) ? r.settings : {};
	const vol = isObj(s.volume) ? s.volume : {};
	const settings: Settings = {
		lang: oneOf(s.lang, ['en', 'pt-BR'] as const, base.settings.lang),
		volume: {
			master: num(vol.master, base.settings.volume.master, 0, 1),
			music: num(vol.music, base.settings.volume.music, 0, 1),
			sfx: num(vol.sfx, base.settings.volume.sfx, 0, 1),
			voice: num(vol.voice, base.settings.volume.voice, 0, 1),
		},
		gore: oneOf(s.gore, ['max', 'reduced', 'goo'] as const, base.settings.gore),
		screenShake: bool(s.screenShake, base.settings.screenShake),
		damageNumbers: bool(s.damageNumbers, base.settings.damageNumbers),
		resolution: oneOf(s.resolution, RESOLUTION_IDS, base.settings.resolution),
	};

	const rh = isObj(r.heroes) ? r.heroes : {};
	const heroes = Object.fromEntries(
		HERO_IDS.map((h) => {
			const src = isObj(rh[h]) ? rh[h] : {};
			const d = base.heroes[h];
			const points = isObj(src.points)
				? Object.fromEntries(
						Object.entries(src.points).map(([k, v]) => [k, num(v, 0)] as const),
					)
				: {};
			return [
				h,
				{
					unlocked: bool(src.unlocked, d.unlocked),
					level: num(src.level, d.level, 1, 100),
					xp: num(src.xp, 0),
					points,
				},
			];
		}),
	) as Record<HeroId, HeroSave>;

	const gambitsRaw = Array.isArray(r.gambits) ? r.gambits : [];
	const gambits = base.gambits.map((_, i) => {
		const g = isObj(gambitsRaw[i]) ? (gambitsRaw[i] as Json) : {};
		return {
			potion: oneOfOrNull(g.potion, POTION_TYPES),
			condition: oneOfOrNull(g.condition, GAMBIT_CONDITIONS),
		};
	});

	const p = isObj(r.progress) ? r.progress : {};
	const bp = base.progress;
	const ph = isObj(p.hero) ? p.hero : {};
	const progress: AchievementProgress = {
		lifetime: numRecord(p.lifetime, LIFETIME_STATS, bp.lifetime),
		hero: Object.fromEntries(
			HERO_IDS.map((h) => [h, numRecord(ph[h], HERO_STATS, bp.hero[h])]),
		) as AchievementProgress['hero'],
		heroLevels: numRecord(p.heroLevels, HERO_IDS, bp.heroLevels),
		runBests: numRecord(p.runBests, RUN_BESTS, bp.runBests),
		feats: Array.isArray(p.feats)
			? FEATS.filter((f) => (p.feats as unknown[]).includes(f))
			: [],
	};

	const a = isObj(r.achievements) ? r.achievements : {};
	const achievements: AchievementState = {
		unlocked: isObj(a.unlocked)
			? Object.fromEntries(
					Object.entries(a.unlocked).filter(([, v]) => typeof v === 'number') as [
						string,
						number,
					][],
				)
			: {},
		spent: num(a.spent, 0),
		purchases: Array.isArray(a.purchases)
			? a.purchases.filter((x): x is string => typeof x === 'string')
			: [],
	};

	return {
		version: SAVE_VERSION,
		settings,
		heroes,
		fish: num(r.fish, 0),
		potions: numRecord(r.potions, POTION_TYPES, base.potions),
		gambits,
		upgrades: isObj(r.upgrades)
			? Object.fromEntries(
					Object.entries(r.upgrades).map(([k, v]) => [k, num(v, 0)] as const),
				)
			: {},
		progress,
		achievements,
		history: (Array.isArray(r.history) ? r.history : [])
			.filter(isRunRecord)
			.slice(0, HISTORY_SIZE),
		activeRun: isRunSnapshot(r.activeRun) ? r.activeRun : null,
	};
}

function isRunRecord(v: unknown): v is RunRecord {
	return (
		isObj(v) &&
		typeof v.id === 'string' &&
		HERO_IDS.includes(v.hero as HeroId) &&
		typeof v.round === 'number' &&
		typeof v.endedAt === 'number' &&
		['death', 'bossTimeout', 'quit'].includes(v.outcome as string)
	);
}

function isRunSnapshot(v: unknown): v is RunSnapshot {
	return (
		isObj(v) &&
		HERO_IDS.includes(v.hero as HeroId) &&
		typeof v.nextRound === 'number' &&
		typeof v.seed === 'number' &&
		isObj(v.state)
	);
}

export function serializeSave(save: SaveData): string {
	return JSON.stringify(save);
}

/** Newest first, capped at HISTORY_SIZE. */
export function pushHistory(save: SaveData, record: RunRecord): void {
	save.history = [record, ...save.history].slice(0, HISTORY_SIZE);
}

/** Counters gathered during a run, added to the global progress when it ends. */
export type RunCounters = Partial<Record<LifetimeStat, number>> & {
	exclusiveCards?: number;
	superUses?: number;
	superKillsOneCast?: number;
	evolvedT3?: boolean;
};

/**
 * Closes a run: keeps all XP/Fish (already applied by the caller, P-26), adds counters to the
 * lifetime progress, records history and bests, clears the snapshot and evaluates achievements.
 */
export function recordRunEnd(
	save: SaveData,
	record: RunRecord,
	counters: RunCounters,
	now: number,
): AchievementDef[] {
	const p = save.progress;
	for (const stat of LIFETIME_STATS) p.lifetime[stat] += counters[stat] ?? 0;
	p.lifetime.runs += 1;
	const h = p.hero[record.hero];
	h.exclusiveCards += counters.exclusiveCards ?? 0;
	h.superUses += counters.superUses ?? 0;
	h.bestRound = Math.max(h.bestRound, record.round);
	if (counters.evolvedT3) h.evolvedT3 = 1;
	p.runBests.maxRound = Math.max(p.runBests.maxRound, record.round);
	p.runBests.killsInRun = Math.max(p.runBests.killsInRun, record.kills);
	p.runBests.superKillsOneCast = Math.max(
		p.runBests.superKillsOneCast,
		counters.superKillsOneCast ?? 0,
	);
	for (const hero of HERO_IDS) p.heroLevels[hero] = save.heroes[hero].level;
	pushHistory(save, record);
	save.activeRun = null;
	return evaluateAchievements(p, save.achievements, now);
}

/**
 * Save progress plus what the current run has done so far, without mutating the save.
 * Used to unlock achievements live during a run (the counters are committed at run end).
 */
export function liveProgress(
	save: SaveData,
	run: { hero: HeroId; round: number; kills: number },
	counters: RunCounters,
	heroLevel: number,
): AchievementProgress {
	const p = structuredClone(save.progress);
	for (const stat of LIFETIME_STATS) p.lifetime[stat] += counters[stat] ?? 0;
	p.lifetime.runs += 1;
	const h = p.hero[run.hero];
	h.exclusiveCards += counters.exclusiveCards ?? 0;
	h.superUses += counters.superUses ?? 0;
	h.bestRound = Math.max(h.bestRound, run.round);
	if (counters.evolvedT3) h.evolvedT3 = 1;
	p.runBests.maxRound = Math.max(p.runBests.maxRound, run.round);
	p.runBests.killsInRun = Math.max(p.runBests.killsInRun, run.kills);
	p.runBests.superKillsOneCast = Math.max(
		p.runBests.superKillsOneCast,
		counters.superKillsOneCast ?? 0,
	);
	for (const hero of HERO_IDS) p.heroLevels[hero] = save.heroes[hero].level;
	p.heroLevels[run.hero] = Math.max(p.heroLevels[run.hero], heroLevel);
	return p;
}

export function addFeat(save: SaveData, feat: (typeof FEATS)[number]): void {
	if (!save.progress.feats.includes(feat)) save.progress.feats.push(feat);
}
