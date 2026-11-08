import { type ReactElement, useSyncExternalStore } from 'react';
import { currentMenuView } from '../menu-controller';
import { Router } from '../Router';
import { saveStore } from '../save-bridge';
import { useUiStore } from '../store';

/** Shows the menu screen selected in `uiStore.screen`, built from the published save. */
export function MenuHost(): ReactElement | null {
	const screen = useUiStore((s) => s.screen);
	// Re-render after every save or menu-state mutation.
	useSyncExternalStore(saveStore.subscribe, () => saveStore.get().rev);
	const view = currentMenuView(screen);
	return view ? <Router view={view} /> : null;
}
