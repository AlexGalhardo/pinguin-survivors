import { type GameSpeed, HERO_IDS, type HeroId } from '../config/constants';
import {
	type AchievementDef,
	FEATS,
	HERO_STATS,
	LIFETIME_STATS,
	type LifetimeStat,
	RUN_BESTS,
} from '../data/achievements';
import { DIFFICULTY_LEVELS, MAX_DIFFICULTY_UNLOCKED } from '../data/difficulty';
import { RESOLUTION_IDS, type ResolutionId } from '../data/display';
import {
	GAMBIT_CONDITIONS,
	GAMBIT_SLOTS,
	type GambitCondition,
	POTION_TYPES,
	type PotionType,
} from '../data/potions';
import { SET_IDS, type SetId } from '../data/sets';
import { WEAPON_LINE_BY_ID, type WeaponId } from '../data/weapons';
import { LANGS, type Lang } from '../i18n';
import {
	type AchievementProgress,
	type AchievementState,
	emptyAchievementState,
	emptyProgress,
	evaluateAchievements,
} from './achievements';
import { DEFAULT_BINDS, type KeyBinds, parseBinds } from './keybinds';
import { heroTree, sanitizeAllocation } from './skill-tree';
import { parseGameSpeed } from './speed';
import { parseRunEndEvents, type RunEndEvent } from './telemetry';

/**
 * Local save: one JSON document (`SaveFile`) with three player slots plus the global settings
 * (ADR-020). No migrations: an older or invalid file starts empty. Bump SAVE_VERSION whenever the
 * shape changes incompatibly.
 */
export const SAVE_VERSION = 3;
export const SLOT_COUNT = 3;
export const SAVE_KEY = 'pinguin-survivors.save';
export const HISTORY_SIZE = 20;

export type GoreMode = 'max' | 'reduced' | 'goo';
export const NUMBER_SIZES = ['small', 'normal', 'large'] as const;
export type NumberSize = (typeof NUMBER_SIZES)[number];

export interface Settings {
	lang: Lang;
	volume: { master: number; music: number; sfx: number };
	gore: GoreMode;
	screenShake: boolean;
	/** Opt-in bloom (renamed from `bloom`, which defaulted to on). */
	bloomOptIn: boolean;
	/** Accessibility: damage number scale and softer flashes (PLAN 7.1). */
	numberSize: NumberSize;
	reducedFlashes: boolean;
	/** Speed a round starts at; TAB changes it and it is remembered. */
	gameSpeed: GameSpeed;
	keys: KeyBinds;
	damageNumbers: boolean;
	resolution: ResolutionId;
	/** Opt-in local run telemetry (SDD-013 RF-05); nothing is ever sent. */
	telemetry: boolean;
}

export interface HeroSave {
	unlocked: boolean;
	level: number;
	/** XP inside the current level. */
	xp: number;
	/** Allocated passive tree nodes (ADR-019); one tree point per level above 1. */
	tree: string[];
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
	/** Last write (ms since epoch); 0 until the first save. Shown in the slot list. */
	savedAt: number;
	settings: Settings;
	heroes: Record<HeroId, HeroSave>;
	fish: number;
	/** Best round per hero and Difficulty (Easy, Normal, Hard; SDD-019); index = Difficulty. */
	bestRoundByDifficulty: Record<HeroId, number[]>;
	/** Meta currency (SDD-005 RF-05); Fish→Pearls conversion lands with T2.7. */
	pearls: number;
	potions: Record<PotionType, number>;
	gambits: Gambit[];
	progress: AchievementProgress;
	achievements: AchievementState;
	history: RunRecord[];
	/** Run-end events of this machine (newest last, capped); exported with the save. */
	telemetry: RunEndEvent[];
	activeRun: RunSnapshot | null;
	/** Pearl unlocks (SDD-005 RF-05): extra starting weapons per hero. */
	unlocks: { startingWeapons: Record<HeroId, WeaponId[]> };
}

export function defaultSave(lang: Lang = 'en'): SaveData {
	return {
		version: SAVE_VERSION,
		savedAt: 0,
		settings: {
			lang,
			volume: { master: 0.8, music: 0.6, sfx: 0.8 },
			gore: 'max',
			screenShake: true,
			bloomOptIn: false,
			numberSize: 'normal',
			reducedFlashes: false,
			gameSpeed: 1,
			keys: { ...DEFAULT_BINDS },
			damageNumbers: true,
			resolution: 'auto',
			telemetry: false,
		},
		heroes: Object.fromEntries(
			HERO_IDS.map((h) => [
				h,
				{ unlocked: h === 'jack', level: 1, xp: 0, tree: [] as string[] },
			]),
		) as Record<HeroId, HeroSave>,
		fish: 0,
		pearls: 0,
		bestRoundByDifficulty: Object.fromEntries(
			HERO_IDS.map((h) => [h, DIFFICULTY_LEVELS.map(() => 0)]),
		) as Record<HeroId, number[]>,
		potions: Object.fromEntries(POTION_TYPES.map((p) => [p, 0])) as Record<PotionType, number>,
		gambits: Array.from({ length: GAMBIT_SLOTS }, () => ({ potion: null, condition: null })),
		progress: emptyProgress(),
		achievements: emptyAchievementState(),
		history: [],
		telemetry: [],
		activeRun: null,
		unlocks: { startingWeapons: { jack: [], bob: [], lucia: [] } },
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

/**
 * Parses a stored/imported save. Never throws: corrupt or missing data falls back to defaults
 * field by field, so one bad value does not wipe the player's progress.
 */
export function parseSave(json: string | null, lang: Lang = 'en'): SaveData {
	const base = defaultSave(lang);
	if (!json) return base;
	try {
		return parseSaveObject(JSON.parse(json), lang);
	} catch {
		return base;
	}
}

/** `parseSave` for an already parsed value; anything but the current version starts empty. */
function parseSaveObject(raw: unknown, lang: Lang): SaveData {
	const base = defaultSave(lang);
	if (!isObj(raw) || raw.version !== SAVE_VERSION) return base;
	const r = raw;

	const s = isObj(r.settings) ? r.settings : {};
	const vol = isObj(s.volume) ? s.volume : {};
	const settings: Settings = {
		lang: oneOf(s.lang, LANGS, base.settings.lang),
		volume: {
			master: num(vol.master, base.settings.volume.master, 0, 1),
			music: num(vol.music, base.settings.volume.music, 0, 1),
			sfx: num(vol.sfx, base.settings.volume.sfx, 0, 1),
		},
		gore: oneOf(s.gore, ['max', 'reduced', 'goo'] as const, base.settings.gore),
		screenShake: bool(s.screenShake, base.settings.screenShake),
		// Read from `bloomOptIn`: the old `bloom` key defaulted to on, and bloom washes large bright
		// sprites (bosses) into white silhouettes and costs a lot of FPS, so everyone starts off.
		bloomOptIn: bool(s.bloomOptIn, base.settings.bloomOptIn),
		numberSize: oneOf(s.numberSize, NUMBER_SIZES, base.settings.numberSize),
		reducedFlashes: bool(s.reducedFlashes, base.settings.reducedFlashes),
		gameSpeed: parseGameSpeed(s.gameSpeed, base.settings.gameSpeed),
		keys: parseBinds(s.keys),
		damageNumbers: bool(s.damageNumbers, base.settings.damageNumbers),
		resolution: oneOf(s.resolution, RESOLUTION_IDS, base.settings.resolution),
		telemetry: bool(s.telemetry, base.settings.telemetry),
	};

	const rh = isObj(r.heroes) ? r.heroes : {};
	const heroes = Object.fromEntries(
		HERO_IDS.map((h) => {
			const src = isObj(rh[h]) ? rh[h] : {};
			const d = base.heroes[h];
			return [
				h,
				{
					unlocked: bool(src.unlocked, d.unlocked),
					level: num(src.level, d.level, 1, 100),
					xp: num(src.xp, 0),
					tree: sanitizeAllocation(heroTree(h), Array.isArray(src.tree) ? src.tree : []),
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
		setBest: numRecord(p.setBest, SET_IDS, bp.setBest),
		feats: Array.isArray(p.feats)
			? FEATS.filter((f) => (p.feats as unknown[]).includes(f))
			: [],
	};

	for (const h of HERO_IDS) {
		const stats = progress.hero[h];
		// Pre-0.10 saves stored `dangerUnlocked` 1-6; 1 stays, 2 opens Hard, 3+ means Hard beaten (SDD-019 RF-04).
		const row = isObj(ph[h]) ? ph[h] : {};
		const raw = row.difficultyUnlocked ?? row.dangerUnlocked;
		stats.difficultyUnlocked = Math.min(
			MAX_DIFFICULTY_UNLOCKED,
			Math.max(1, Math.floor(num(raw, 1))),
		);
	}

	const a = isObj(r.achievements) ? r.achievements : {};
	const unlockedRaw = isObj(a.unlocked)
		? (Object.fromEntries(
				Object.entries(a.unlocked).filter(([, v]) => typeof v === 'number'),
			) as Record<string, number>)
		: {};
	const { unlocked, merged } = migrateDangerAchievements(unlockedRaw);
	const achievements: AchievementState = {
		unlocked,
		// Each merged achievement was a point: take it off `spent` so the points to spend stay the same.
		spent: Math.max(0, num(a.spent, 0) - merged),
		purchases: Array.isArray(a.purchases)
			? a.purchases.filter((x): x is string => typeof x === 'string')
			: [],
	};

	return {
		version: SAVE_VERSION,
		savedAt: num(r.savedAt, 0),
		settings,
		heroes,
		fish: num(r.fish, 0),
		pearls: num(r.pearls, 0),
		bestRoundByDifficulty: parseBestByDifficulty(
			r.bestRoundByDifficulty ?? r.bestRoundByDanger,
		),
		potions: numRecord(r.potions, POTION_TYPES, base.potions),
		gambits,
		progress,
		achievements,
		history: (Array.isArray(r.history) ? r.history : [])
			.filter(isRunRecord)
			.slice(0, HISTORY_SIZE),
		telemetry: parseRunEndEvents(r.telemetry),
		activeRun: isRunSnapshot(r.activeRun) ? r.activeRun : null,
		unlocks: parseUnlocks(r.unlocks),
	};
}

/**
 * Danger achievements became Difficulty ones (SDD-019 RF-05): tier 1 stays, tiers 2-5 collapse into 2.
 * Keeps the earliest unlock time; `merged` counts the ids that disappeared into another.
 */
export function migrateDangerAchievements(old: Record<string, number>): {
	unlocked: Record<string, number>;
	merged: number;
} {
	const unlocked: Record<string, number> = {};
	let merged = 0;
	for (const [id, at] of Object.entries(old)) {
		const m = /^danger(Win|All)\.(?:(\w+)\.)?(\d+)$/.exec(id);
		const next = m
			? `difficulty${m[1]}.${m[2] ? `${m[2]}.` : ''}${Math.min(2, Number(m[3]))}`
			: id;
		if (next in unlocked) merged++;
		unlocked[next] = Math.min(unlocked[next] ?? at, at);
	}
	return { unlocked, merged };
}

/** Unknown weapon ids and duplicates are dropped; a missing section is empty (no version bump). */
function parseUnlocks(v: unknown): SaveData['unlocks'] {
	const src = isObj(v) && isObj(v.startingWeapons) ? v.startingWeapons : {};
	return {
		startingWeapons: Object.fromEntries(
			HERO_IDS.map((h) => {
				const row = Array.isArray(src[h]) ? (src[h] as unknown[]) : [];
				const ids = row.filter(
					(id): id is WeaponId => typeof id === 'string' && id in WEAPON_LINE_BY_ID,
				);
				return [h, [...new Set(ids)]];
			}),
		) as Record<HeroId, WeaponId[]>,
	};
}

/** Old saves had six Danger slots: Easy = D0, Normal = D1, Hard = best of D2-D5 (SDD-019 RF-04). */
function parseBestByDifficulty(v: unknown): Record<HeroId, number[]> {
	const src = isObj(v) ? v : {};
	return Object.fromEntries(
		HERO_IDS.map((h) => {
			const row = (Array.isArray(src[h]) ? (src[h] as unknown[]) : []).map((x) => num(x, 0));
			const hard =
				row.length > DIFFICULTY_LEVELS.length ? Math.max(...row.slice(2)) : (row[2] ?? 0);
			return [h, [row[0] ?? 0, row[1] ?? 0, hard]];
		}),
	) as Record<HeroId, number[]>;
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
	fusedT4?: boolean;
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
	if (counters.fusedT4) h.fusedT4 = 1;
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
	if (counters.fusedT4) h.fusedT4 = 1;
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

/** Most weapons of `set` owned at once so far (set achievements); call when the build changes. */
export function recordSetCount(save: SaveData, set: SetId, n: number): void {
	save.progress.setBest[set] = Math.max(save.progress.setBest[set], n);
}

/** `recordSetCount` for every set of a build (`setCounts(build)`). */
export function recordBuildSets(save: SaveData, counts: Partial<Record<SetId, number>>): void {
	for (const set of SET_IDS) recordSetCount(save, set, counts[set] ?? 0);
}

/** Most tier IV weapons owned at once in a run (call after each fusion or purchase). */
export function recordTierIVSlots(save: SaveData, n: number): void {
	save.progress.runBests.tierIVSlots = Math.max(save.progress.runBests.tierIVSlots, n);
}

export function addFeat(save: SaveData, feat: (typeof FEATS)[number]): void {
	if (!save.progress.feats.includes(feat)) save.progress.feats.push(feat);
}

/** A player slot: the whole `SaveData` except the global settings, which live beside the slots. */
export type SlotData = Omit<SaveData, 'settings'>;

/** The one stored document: global settings plus three independent player slots (ADR-020). */
export interface SaveFile {
	version: number;
	settings: Settings;
	slots: (SlotData | null)[];
	/** Slot the game plays and autosaves into. */
	active: number;
}

export function defaultSaveFile(lang: Lang = 'en'): SaveFile {
	return {
		version: SAVE_VERSION,
		settings: defaultSave(lang).settings,
		slots: Array.from({ length: SLOT_COUNT }, () => null),
		active: 0,
	};
}

export function toSlot(save: SaveData): SlotData {
	const { settings: _settings, ...slot } = save;
	return slot;
}

/** Fresh slot content for "New game". */
export const newSlot = (lang: Lang = 'en'): SlotData => toSlot(defaultSave(lang));

/** The in-memory save the game plays: the active slot (or an empty one) plus the global settings. */
export function composeSave(file: SaveFile, lang: Lang = 'en'): SaveData {
	return { ...(file.slots[file.active] ?? newSlot(lang)), settings: file.settings };
}

/** Never throws; anything unreadable or from another version becomes an empty file. */
export function parseSaveFile(json: string | null, lang: Lang = 'en'): SaveFile {
	const base = defaultSaveFile(lang);
	if (!json) return base;
	let raw: unknown;
	try {
		raw = JSON.parse(json);
	} catch {
		return base;
	}
	if (!isObj(raw) || raw.version !== SAVE_VERSION) return base;
	const rows = Array.isArray(raw.slots) ? raw.slots : [];
	const slots = base.slots.map((_, i) =>
		isObj(rows[i])
			? toSlot(parseSaveObject({ ...rows[i], version: SAVE_VERSION }, lang))
			: null,
	);
	const settings = parseSaveObject(
		{ version: SAVE_VERSION, settings: raw.settings },
		lang,
	).settings;
	const wanted = num(raw.active, 0, 0, SLOT_COUNT - 1);
	const active = slots[wanted]
		? wanted
		: Math.max(
				0,
				slots.findIndex((s) => s !== null),
			);
	return { version: SAVE_VERSION, settings, slots, active: Math.floor(active) };
}

export function serializeSaveFile(file: SaveFile): string {
	return JSON.stringify(file);
}

/** What the slot list shows for one used slot. */
export interface SlotSummary {
	hero: HeroId;
	level: number;
	bestRound: number;
	playedSec: number;
	savedAt: number;
	/** A run is waiting to be continued. */
	inRun: boolean;
}

/** The hero of the run in progress, else of the last finished run, else the highest level. */
export function summarizeSlot(slot: SlotData | null): SlotSummary | null {
	if (!slot) return null;
	const byLevel = [...HERO_IDS].sort((a, b) => slot.heroes[b].level - slot.heroes[a].level)[0];
	const hero = slot.activeRun?.hero ?? slot.history[0]?.hero ?? byLevel ?? 'jack';
	return {
		hero,
		level: slot.heroes[hero].level,
		bestRound: slot.progress.runBests.maxRound,
		playedSec: Math.round(slot.progress.lifetime.secondsPlayed),
		savedAt: slot.savedAt,
		inRun: slot.activeRun !== null,
	};
}
