import { useSyncExternalStore } from 'react';

/** Screens the React overlay can show; `none` renders nothing (T3.x adds the real ones). */
export type UiScreen = 'none';

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
