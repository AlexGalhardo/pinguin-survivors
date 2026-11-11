import { writeSave } from '../core/storage';
import { type I18nKey, t } from '../i18n';
import { freshUnlocks, markSeen } from '../logic/onboarding';
import { getUiSave } from './save-bridge';
import { showToast } from './toast';

/** Longer than a normal toast: it names a screen the player has never seen. */
const UNLOCK_TOAST_MS = 6000;

/**
 * Toasts every system the progress has just opened and remembers it, so each one is announced
 * once (SDD-022 RF-02). `runLevel` is the level of the hero in the current run, when there is one.
 */
export function announceUnlocks(runLevel = 1): void {
	const save = getUiSave();
	if (!save) return;
	const fresh = freshUnlocks(save, runLevel);
	if (fresh.length === 0) return;
	// Deferred: the main menu view is built while React renders, and a toast is a store update.
	queueMicrotask(() => {
		for (const id of fresh) showToast(t(`onboard.unlock.${id}` as I18nKey), UNLOCK_TOAST_MS);
	});
	markSeen(save, fresh);
	writeSave(save);
}
