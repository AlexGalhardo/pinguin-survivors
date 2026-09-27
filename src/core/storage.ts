import type { Lang } from '../i18n';
import { parseSave, SAVE_KEY, type SaveData, serializeSave } from '../logic/save';

const BACKUP_KEY = `${SAVE_KEY}.backup`;

/** localStorage can throw (private mode, blocked site data); the game must still run. */
export function loadSave(lang: Lang): SaveData {
	let raw: string | null = null;
	try {
		raw = localStorage.getItem(SAVE_KEY);
	} catch {
		return parseSave(null, lang);
	}
	const save = parseSave(raw, lang);
	// Keep an unreadable save aside instead of silently overwriting the player's progress.
	if (raw && serializeSave(parseSave(raw, lang)) !== raw) {
		try {
			localStorage.setItem(BACKUP_KEY, raw);
		} catch {
			/* storage full or blocked: nothing else to do */
		}
	}
	return save;
}

export function writeSave(save: SaveData): boolean {
	try {
		localStorage.setItem(SAVE_KEY, serializeSave(save));
		return true;
	} catch {
		return false;
	}
}

/** Downloads the save as a .json file (manual backup / move to another browser). */
export function exportSave(save: SaveData): void {
	const blob = new Blob([serializeSave(save)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `pinguin-survivors-save-${new Date().toISOString().slice(0, 10)}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

/** Validates an imported file through the same parser used for localStorage. */
export async function importSave(file: File, lang: Lang): Promise<SaveData> {
	return parseSave(await file.text(), lang);
}
