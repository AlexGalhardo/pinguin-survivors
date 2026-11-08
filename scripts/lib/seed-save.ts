import { defaultSaveFile, newSlot, SAVE_KEY, serializeSaveFile } from '../../src/logic/save';

/**
 * Init script for browser QA: starts the page with save slot 1 in use (when nothing is stored), so
 * the main menu shows PLAY instead of only NEW GAME. Pass it to `page.addInitScript`.
 */
export const seedSaveScript = `(() => {
	const key = ${JSON.stringify(SAVE_KEY)};
	if (!localStorage.getItem(key)) localStorage.setItem(key, ${JSON.stringify(
		serializeSaveFile({ ...defaultSaveFile(), slots: [newSlot(), null, null] }),
	)});
})()`;
