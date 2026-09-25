import { applySettings, settings } from '../core/settings';
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

	/** Records a finished run and saves. Returns true on a new class record. */
	recordRun(run: RunSummary): boolean {
		const result = recordRun(SaveSystem.get(), run);
		data = result.save;
		SaveSystem.persist();
		return result.newBest;
	},
};
