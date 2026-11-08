import type { Lang } from '../i18n';
import { parseSave, SAVE_KEY, type SaveData, serializeSave } from '../logic/save';
import { toJsonl } from '../logic/telemetry';
import { platform } from './platform';

const BACKUP_KEY = `${SAVE_KEY}.backup`;

/** Reads the save through the Platform (storage can throw; the game must still run). */
export function loadSave(lang: Lang): SaveData {
	const { save: store } = platform();
	const raw = store.load(SAVE_KEY);
	const save = parseSave(raw, lang);
	// Keep an unreadable save aside instead of silently overwriting the player's progress.
	if (raw && serializeSave(save) !== raw) store.save(BACKUP_KEY, raw);
	return save;
}

export function writeSave(save: SaveData): boolean {
	return platform().save.save(SAVE_KEY, serializeSave(save));
}

/** Hands the save over as a .json file (manual backup / move to another machine). */
/** Local run-end events as JSONL (SDD-013 RF-05); nothing is sent anywhere. */
export function exportTelemetry(save: SaveData): void {
	const day = new Date().toISOString().slice(0, 10);
	platform().save.exportFile(`pinguin-survivors-telemetry-${day}.jsonl`, toJsonl(save.telemetry));
}

export function exportSave(save: SaveData): void {
	const day = new Date().toISOString().slice(0, 10);
	platform().save.exportFile(`pinguin-survivors-save-${day}.json`, serializeSave(save));
}

/** Validates an imported file through the same parser used for the stored save. */
export async function importSave(file: File, lang: Lang): Promise<SaveData> {
	return parseSave(await platform().save.importFile(file), lang);
}
