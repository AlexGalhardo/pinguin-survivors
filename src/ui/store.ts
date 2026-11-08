import { useSyncExternalStore } from 'react';
import type { MenuView } from './Router';

/** Screens the React overlay can show: a menu screen or `none` (in-run overlays have their own stores). */
export type UiScreen = 'none' | MenuView['screen'];

export interface UiState {
	screen: UiScreen;
}

export interface Store<T> {
	get: () => T;
	set: (patch: Partial<T>) => void;
	subscribe: (listener: () => void) => () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
	let state = initial;
	const listeners = new Set<() => void>();
	return {
		get: () => state,
		set: (patch) => {
			state = { ...state, ...patch };
			for (const l of listeners) l();
		},
		subscribe: (listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
	};
}

export const uiStore = createStore<UiState>({ screen: 'none' });

export function useUiStore<S>(selector: (s: UiState) => S): S {
	return useSyncExternalStore(uiStore.subscribe, () => selector(uiStore.get()));
}
