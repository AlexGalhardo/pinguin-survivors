import { applySettings, settings } from '../core/settings';
import type { CharacterId } from '../data/characters';
import { checkUnlocks, type UnlockEvent } from '../logic/meta';
import {
	parseSave,
	type RunSummary,
	recordRun,
	SAVE_KEY,
	type SaveData,
	serializeSave,
} from '../logic/save';

let data: SaveData | null = null;

/** localStorage persistence (try/catch everywhere: private mode or blocked storage must not crash). */
export const SaveSystem = {
	load(): SaveData {
		let json: string | null = null;
		try {
			json = window.localStorage.getItem(SAVE_KEY);
		} catch {
			json = null;
		}
		data = parseSave(json);
		applySettings(data.settings);
		return data;
	},

	get(): SaveData {
		return data ?? SaveSystem.load();
	},

	persist(): void {
		const current = SaveSystem.get();
		current.settings = { ...settings };
		try {
			window.localStorage.setItem(SAVE_KEY, serializeSave(current));
		} catch {
			// Storage unavailable: keep playing with the in-memory save.
		}
	},

	/** Applies an unlock event; saves and returns the newly unlocked characters. */
	unlock(event: UnlockEvent): CharacterId[] {
		const out = checkUnlocks(SaveSystem.get(), event);
		if (out.length > 0) SaveSystem.persist();
		return out;
	},

	/** Counts a boss kill (lifetime) and saves. */
	bossKilled(): void {
		SaveSystem.get().bossKills++;
		SaveSystem.persist();
	},

	/** Records a finished run and saves. Returns true on a new class record. */
	recordRun(run: RunSummary): boolean {
		const result = recordRun(SaveSystem.get(), run);
		data = result.save;
		SaveSystem.persist();
		return result.newBest;
	},
};
