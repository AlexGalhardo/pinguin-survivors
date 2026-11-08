import type { Lang } from '../i18n';
import {
	composeSave,
	newSlot,
	parseSave,
	parseSaveFile,
	SAVE_KEY,
	type SaveData,
	type SaveFile,
	type SlotSummary,
	serializeSave,
	serializeSaveFile,
	summarizeSlot,
	toSlot,
} from '../logic/save';
import { toJsonl } from '../logic/telemetry';
import { platform } from './platform';

const BACKUP_KEY = `${SAVE_KEY}.backup`;

/** The stored document (three slots + settings); the live `SaveData` is bound to `file.active`. */
let file: SaveFile | null = null;
/** False while no slot was loaded or created yet: progress is then not written anywhere. */
let bound = false;

const current = (lang: Lang = 'en'): SaveFile => {
	file ??= parseSaveFile(null, lang);
	return file;
};

/** Reads the save file through the Platform (storage can throw; the game must still run). */
export function loadSave(lang: Lang): SaveData {
	const { save: store } = platform();
	const raw = store.load(SAVE_KEY);
	file = parseSaveFile(raw, lang);
	// Keep an unreadable (or older-version) file aside instead of silently overwriting it.
	if (raw && serializeSaveFile(file) !== raw) store.save(BACKUP_KEY, raw);
	bound = file.slots[file.active] !== null;
	return composeSave(file, lang);
}

/** Writes the live save into its slot (if one is bound) and the global settings. */
export function writeSave(save: SaveData): boolean {
	const f = current(save.settings.lang);
	f.settings = save.settings;
	if (bound) {
		save.savedAt = Date.now();
		f.slots[f.active] = toSlot(save);
	}
	return platform().save.save(SAVE_KEY, serializeSaveFile(f));
}

export const hasActiveSlot = (): boolean => bound;

/** Summary of each slot (null = empty), for the load and new game screens. */
export function slotSummaries(): (SlotSummary | null)[] {
	return current().slots.map(summarizeSlot);
}

export const activeSlot = (): number | null => (bound ? current().active : null);

/** Swaps the content of the live save in place (the game holds this very object). */
function replaceLive(save: SaveData, slot: ReturnType<typeof toSlot>): void {
	Object.assign(save, structuredClone(slot), { settings: save.settings });
}

/** Makes `index` the active slot and loads it into `save`; false if it is empty. */
export function loadSlot(save: SaveData, index: number): boolean {
	const f = current(save.settings.lang);
	const slot = f.slots[index];
	if (!slot) return false;
	f.active = index;
	bound = true;
	replaceLive(save, slot);
	writeSave(save);
	return true;
}

/** Starts a fresh slot (overwriting whatever was there) and makes it the active one. */
export function startNewSlot(save: SaveData, index: number): void {
	const f = current(save.settings.lang);
	f.active = index;
	bound = true;
	replaceLive(save, newSlot(save.settings.lang));
	writeSave(save);
}

export function deleteSlot(save: SaveData, index: number): void {
	const f = current(save.settings.lang);
	f.slots[index] = null;
	if (bound && f.active === index) {
		bound = false;
		replaceLive(save, newSlot(save.settings.lang));
	}
	writeSave(save);
}

/** Local run-end events as JSONL (SDD-013 RF-05); nothing is sent anywhere. */
export function exportTelemetry(save: SaveData): void {
	const day = new Date().toISOString().slice(0, 10);
	platform().save.exportFile(`pinguin-survivors-telemetry-${day}.jsonl`, toJsonl(save.telemetry));
}

/** Hands the active slot over as a .json file (manual backup / move to another machine). */
export function exportSave(save: SaveData): void {
	const day = new Date().toISOString().slice(0, 10);
	platform().save.exportFile(`pinguin-survivors-save-${day}.json`, serializeSave(save));
}

/** Validates an imported file through the same parser used for a slot. */
export async function importSave(picked: File, lang: Lang): Promise<SaveData> {
	return parseSave(await platform().save.importFile(picked), lang);
}
