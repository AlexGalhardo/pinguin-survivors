import { SYSTEMS, TIPS } from '../../src/logic/onboarding';
import { defaultSaveFile, newSlot, SAVE_KEY, serializeSaveFile } from '../../src/logic/save';

/** A slot that has already played: every menu entry is unlocked and announced, no first-run hint is left (SDD-022). */
function playedSlot(): ReturnType<typeof newSlot> {
	const slot = newSlot();
	slot.heroes.jack.level = 3;
	slot.pearls = 30;
	slot.onboarding.seen = [...SYSTEMS, ...TIPS.map((tip) => `tip.${tip}`)];
	return slot;
}

/**
 * Init script for browser QA: starts the page with save slot 1 in use (when nothing is stored), so
 * the main menu shows PLAY and every screen instead of only NEW GAME. Pass it to `page.addInitScript`.
 */
export const seedSaveScript = `(() => {
	const key = ${JSON.stringify(SAVE_KEY)};
	if (!localStorage.getItem(key)) localStorage.setItem(key, ${JSON.stringify(
		serializeSaveFile({ ...defaultSaveFile(), slots: [playedSlot(), null, null] }),
	)});
})()`;
