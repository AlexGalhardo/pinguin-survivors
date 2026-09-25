import { DEFAULT_SETTINGS, type Settings } from '../core/settings';
import { CHARACTER_IDS, type CharacterId } from '../data/characters';

/** Bump when the saved format changes (SemVer public API: see docs/git-and-versioning.md). */
export const SAVE_VERSION = 2;
/** Runs kept in the history. */
export const HISTORY_SIZE = 10;
export const SAVE_KEY = 'starfall-survivors.save';

export interface BestRun {
	wave: number;
	kills: number;
	timeSec: number;
}

export interface LifetimeStats {
	runs: number;
	kills: number;
	goldEarned: number;
	damageDealt: number;
	timeSec: number;
}

export interface RunRecord {
	character: CharacterId;
	wave: number;
	kills: number;
	timeSec: number;
	/** Unix time (ms) when the run ended. */
	at: number;
}

export interface MetaProgress {
	/** Meta currency (1.0): earned at the end of every run. */
	cores: number;
	/** Permanent upgrade levels by id (1.0). */
	upgrades: Record<string, number>;
}

export interface SaveData {
	version: number;
	settings: Settings;
	best: Record<CharacterId, BestRun>;
	stats: LifetimeStats;
	/** Unlocked characters (v2). */
	unlocked: CharacterId[];
	/** Last runs, newest first (v2). */
	history: RunRecord[];
	/** Bosses killed across all runs (v2). */
	bossKills: number;
	meta: MetaProgress;
	/** Local achievements unlocked (ids, 1.0). */
	achievements: string[];
	/** True once the tutorial was shown (Beta). */
	tutorialDone: boolean;
}

export interface RunSummary {
	character: CharacterId;
	wave: number;
	kills: number;
	goldEarned: number;
	damageDealt: number;
	timeSec: number;
	/** Unix time (ms) of the end of the run. */
	at?: number;
}

function emptyBest(): BestRun {
	return { wave: 0, kills: 0, timeSec: 0 };
}

export function defaultSave(): SaveData {
	const best = {} as Record<CharacterId, BestRun>;
	for (const c of CHARACTER_IDS) best[c] = emptyBest();
	return {
		version: SAVE_VERSION,
		settings: { ...DEFAULT_SETTINGS },
		best,
		stats: { runs: 0, kills: 0, goldEarned: 0, damageDealt: 0, timeSec: 0 },
		unlocked: ['warrior'],
		history: [],
		bossKills: 0,
		meta: { cores: 0, upgrades: {} },
		achievements: [],
		tutorialDone: false,
	};
}

function num(v: unknown, fallback: number): number {
	return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
	return typeof v === 'boolean' ? v : fallback;
}

/**
 * Parses saved JSON defensively: unknown/corrupt data or a newer version gives the defaults;
 * missing fields are filled in (forward-compatible within the same major format).
 */
export function parseSave(json: string | null): SaveData {
	const base = defaultSave();
	if (!json) return base;
	let raw: unknown;
	try {
		raw = JSON.parse(json);
	} catch {
		return base;
	}
	if (typeof raw !== 'object' || raw === null) return base;
	const r = raw as Partial<Record<keyof SaveData, unknown>>;
	if (typeof r.version !== 'number' || r.version > SAVE_VERSION) return base;
	const s = (r.settings ?? {}) as Partial<Record<keyof Settings, unknown>>;
	base.settings = {
		sfxVolume: Math.min(1, Math.max(0, num(s.sfxVolume, DEFAULT_SETTINGS.sfxVolume))),
		musicVolume: Math.min(1, Math.max(0, num(s.musicVolume, DEFAULT_SETTINGS.musicVolume))),
		fullscreen: bool(s.fullscreen, DEFAULT_SETTINGS.fullscreen),
		screenShake: bool(s.screenShake, DEFAULT_SETTINGS.screenShake),
		damageNumbers: bool(s.damageNumbers, DEFAULT_SETTINGS.damageNumbers),
		reduceFlashes: bool(s.reduceFlashes, DEFAULT_SETTINGS.reduceFlashes),
		damageTextSize: num(s.damageTextSize, DEFAULT_SETTINGS.damageTextSize) >= 2 ? 2 : 1,
		pauseOnBlur: bool(s.pauseOnBlur, DEFAULT_SETTINGS.pauseOnBlur),
	};
	const best = (r.best ?? {}) as Partial<Record<CharacterId, Partial<BestRun>>>;
	for (const c of CHARACTER_IDS) {
		const b = best[c] ?? {};
		base.best[c] = { wave: num(b.wave, 0), kills: num(b.kills, 0), timeSec: num(b.timeSec, 0) };
	}
	const st = (r.stats ?? {}) as Partial<LifetimeStats>;
	base.stats = {
		runs: num(st.runs, 0),
		kills: num(st.kills, 0),
		goldEarned: num(st.goldEarned, 0),
		damageDealt: num(st.damageDealt, 0),
		timeSec: num(st.timeSec, 0),
	};
	// v2 fields (a v1 save migrates with Ranger/Mage unlocked if it already has runs with them).
	const unlocked = Array.isArray(r.unlocked) ? (r.unlocked as unknown[]) : [];
	base.unlocked = CHARACTER_IDS.filter(
		(c) => c === 'warrior' || unlocked.includes(c) || base.best[c].wave > 0,
	);
	const history = Array.isArray(r.history) ? (r.history as Partial<RunRecord>[]) : [];
	base.history = history
		.filter((h) => CHARACTER_IDS.includes(h.character as CharacterId))
		.slice(0, HISTORY_SIZE)
		.map((h) => ({
			character: h.character as CharacterId,
			wave: num(h.wave, 0),
			kills: num(h.kills, 0),
			timeSec: num(h.timeSec, 0),
			at: num(h.at, 0),
		}));
	base.bossKills = num(r.bossKills, 0);
	const meta = (r.meta ?? {}) as Partial<MetaProgress>;
	base.meta = {
		cores: num(meta.cores, 0),
		upgrades:
			typeof meta.upgrades === 'object' && meta.upgrades !== null ? { ...meta.upgrades } : {},
	};
	base.achievements = Array.isArray(r.achievements)
		? (r.achievements as unknown[]).filter((a): a is string => typeof a === 'string')
		: [];
	base.tutorialDone = bool(r.tutorialDone, false);
	return base;
}

export function serializeSave(save: SaveData): string {
	return JSON.stringify(save);
}

/** Adds a finished run to the save. Returns whether it beat the class record (higher wave). */
export function recordRun(save: SaveData, run: RunSummary): { save: SaveData; newBest: boolean } {
	const prev = save.best[run.character];
	const newBest = run.wave > prev.wave || (run.wave === prev.wave && run.kills > prev.kills);
	const next: SaveData = {
		...save,
		best: {
			...save.best,
			[run.character]: newBest
				? { wave: run.wave, kills: run.kills, timeSec: Math.round(run.timeSec) }
				: prev,
		},
		history: [
			{
				character: run.character,
				wave: run.wave,
				kills: run.kills,
				timeSec: Math.round(run.timeSec),
				at: run.at ?? 0,
			},
			...save.history,
		].slice(0, HISTORY_SIZE),
		stats: {
			runs: save.stats.runs + 1,
			kills: save.stats.kills + run.kills,
			goldEarned: save.stats.goldEarned + run.goldEarned,
			damageDealt: save.stats.damageDealt + Math.round(run.damageDealt),
			timeSec: save.stats.timeSec + Math.round(run.timeSec),
		},
	};
	return { save: next, newBest };
}
