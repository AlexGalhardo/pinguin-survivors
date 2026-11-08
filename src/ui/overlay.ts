import { useSyncExternalStore } from 'react';
import { runUiStore } from './run-bridge';
import { shopStore } from './shop-bridge';
import { uiStore } from './store';

/** True while a full-screen React screen (shop, cards, pause, summary, menus) covers the game. */
export function useOverlayOpen(): boolean {
	const shop = useSyncExternalStore(shopStore.subscribe, () => shopStore.get().shop !== null);
	const run = useSyncExternalStore(runUiStore.subscribe, () => {
		const s = runUiStore.get();
		return Boolean(s.levelUp || s.pause || s.over || s.demoEnd || s.unlock);
	});
	const menu = useSyncExternalStore(uiStore.subscribe, () => uiStore.get().screen !== 'none');
	return shop || run || menu;
}
