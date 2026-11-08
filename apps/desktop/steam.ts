import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { app } from 'electron';
import { STEAM_ACHIEVEMENTS, steamApiName } from '../../src/data/steam-achievements';

/**
 * Steamworks bridge (steamworks.js). Everything here is best effort: without an App ID or a
 * running Steam client the game keeps working and these calls only log.
 */
type SteamClient = ReturnType<typeof import('steamworks.js').init>;

/** Valve's public test app (Spacewar). Only used by unpackaged dev runs, never in a build. */
const DEV_APP_ID = 480;

/** App ID from `STEAM_APP_ID`, then `steam_appid.txt` next to the executable (or the repo in dev). */
export function resolveAppId(): number | null {
	const fromEnv = Number(process.env.STEAM_APP_ID);
	if (Number.isInteger(fromEnv) && fromEnv > 0) return fromEnv;
	const dirs = app.isPackaged
		? [join(app.getPath('exe'), '..')]
		: [process.cwd(), app.getAppPath()];
	for (const dir of dirs) {
		const file = join(dir, 'steam_appid.txt');
		if (!existsSync(file)) continue;
		const id = Number(readFileSync(file, 'utf8').trim());
		if (Number.isInteger(id) && id > 0) return id;
	}
	if (!app.isPackaged) {
		console.warn(`[steam] no App ID: using the dev test app ${DEV_APP_ID} (Spacewar)`);
		return DEV_APP_ID;
	}
	return null;
}

let client: SteamClient | null = null;

export function initSteam(): void {
	const appId = resolveAppId();
	if (appId === null) {
		console.log('[steam] no steam_appid.txt / STEAM_APP_ID: Steam features are no-ops');
		return;
	}
	try {
		// Loaded lazily: the native module is absent from non-Steam setups.
		const steamworks = require('steamworks.js') as typeof import('steamworks.js');
		client = steamworks.init(appId);
		steamworks.electronEnableSteamOverlay();
		console.log(`[steam] initialised (app ${appId})`);
	} catch (error) {
		console.warn('[steam] init failed (is the Steam client running?)', error);
		client = null;
	}
}

export const steamReady = (): boolean => client !== null;

/** Unlocks an achievement: the game sends its internal id, Steamworks wants the `ACH_*` API name. */
export function unlockAchievement(id: string): void {
	const name = STEAM_ACHIEVEMENTS[id] ?? steamApiName(id);
	if (!client) {
		console.log(`[steam] achievement ${id} -> ${name} (no Steam)`);
		return;
	}
	if (!client.achievement.activate(name))
		console.warn(`[steam] achievement ${name} not activated`);
}

/**
 * Leaderboards `hero_<id>_danger_<d>`: steamworks.js 0.4.0 (the latest stable) has no leaderboard
 * API, so this only logs. Needs another binding or a Steamworks Web API call to become real.
 */
export function submitScore(board: string, score: number): void {
	console.log(`[steam] leaderboard ${board} = ${score} (not supported by steamworks.js 0.4)`);
}

/** Opens a web page in the Steam overlay; false when there is no overlay (use the browser). */
export function openInOverlay(url: string): boolean {
	if (!client) return false;
	client.overlay.activateToWebPage(url);
	return true;
}
