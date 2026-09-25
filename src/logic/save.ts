import { DEFAULT_SETTINGS, type Settings } from '../core/settings';
import { CHARACTER_IDS, type CharacterId } from '../data/characters';

/** Bump when the saved format changes (SemVer public API: see docs/git-and-versioning.md). */
export const SAVE_VERSION = 1;
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

export interface SaveData {
	version: number;
	settings: Settings;
	best: Record<CharacterId, BestRun>;
	stats: LifetimeStats;
}

export interface RunSummary {
	character: CharacterId;
	wave: number;
	kills: number;
	goldEarned: number;
	damageDealt: number;
	timeSec: number;
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
