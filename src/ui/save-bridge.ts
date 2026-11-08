import type { SaveData } from '../logic/save';
import { createStore } from './store';

/**
 * The single in-memory save, shared by reference with the game: the game publishes it at boot
 * (`publishSave`) and the menus mutate it in place, so there is never a second copy to desync.
 * `rev` ticks after every mutation so React re-renders.
 */
let current: SaveData | null = null;

export const saveStore = createStore<{ rev: number }>({ rev: 0 });

export function publishSave(save: SaveData): void {
	current = save;
	saveStore.set({ rev: saveStore.get().rev + 1 });
}

export function getUiSave(): SaveData | null {
	return current;
}

/** Call after mutating the save (or the menu state) so the screens refresh. */
export function touchSave(): void {
	saveStore.set({ rev: saveStore.get().rev + 1 });
}
