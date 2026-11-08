import type { PlayerPanelView } from '../logic/item-view';
import { createStore } from './store';

/**
 * The player panel (current stats, weapons and equipment with rarity and affixes) published by
 * the game whenever the pause screen opens or the build/gear changes, so the pause screen can show
 * the same panel as the shop (`ShopView.player`; contract in `shop-bridge.ts`). `null` outside a run.
 */
export const playerStore = createStore<{ panel: PlayerPanelView | null }>({ panel: null });

export function publishPlayerPanel(panel: PlayerPanelView | null): void {
	playerStore.set({ panel });
}
