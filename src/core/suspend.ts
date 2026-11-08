/** Event the native shells dispatch when the app must pause (Steam overlay, Android background). */
export const SUSPEND_EVENT = 'pinguin:suspend';

interface Source {
	addEventListener(type: string, fn: () => void): void;
	removeEventListener(type: string, fn: () => void): void;
}

/**
 * Calls `onSuspend` when the game loses the player: window blur, tab/app hidden, or the shell's
 * `pinguin:suspend` (Steam overlay, Android `appStateChange`). Resuming is up to the pause screen.
 * Returns the function that removes the listeners.
 */
export function watchSuspend(
	onSuspend: () => void,
	win: Source = window,
	doc: Source & { hidden: boolean } = document,
): () => void {
	const hidden = (): void => {
		if (doc.hidden) onSuspend();
	};
	win.addEventListener('blur', onSuspend);
	win.addEventListener(SUSPEND_EVENT, onSuspend);
	doc.addEventListener('visibilitychange', hidden);
	return () => {
		win.removeEventListener('blur', onSuspend);
		win.removeEventListener(SUSPEND_EVENT, onSuspend);
		doc.removeEventListener('visibilitychange', hidden);
	};
}
