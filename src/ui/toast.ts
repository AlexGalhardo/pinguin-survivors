import { createStore } from './store';

export interface ToastItem {
	id: number;
	/** Already translated by the caller (`t(...)`). */
	message: string;
	ms: number;
}

/** Visible toasts at once; the rest wait in the queue. */
export const MAX_VISIBLE_TOASTS = 3;
export const DEFAULT_TOAST_MS = 3000;

export const toastStore = createStore<{ queue: ToastItem[] }>({ queue: [] });
let nextId = 1;

export function showToast(message: string, ms = DEFAULT_TOAST_MS): number {
	const id = nextId++;
	toastStore.set({ queue: [...toastStore.get().queue, { id, message, ms }] });
	return id;
}

export function dismissToast(id: number): void {
	toastStore.set({ queue: toastStore.get().queue.filter((t) => t.id !== id) });
}
