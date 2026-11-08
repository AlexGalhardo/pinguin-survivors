import type { Action } from '../logic/keybinds';

/**
 * Touch controls (React overlay) → game input. The overlay writes the stick vector here and fires
 * actions; `GameInput` reads them, so touch feeds the same `move()` and action handlers as the
 * keyboard (SDD-007 RF-04). No engine import: the UI never reaches into the game.
 */
export const touchMove = { x: 0, y: 0 };

type Listener = (action: Action) => void;
const listeners = new Set<Listener>();

/** Subscribes to touch buttons; returns the unsubscribe function. */
export function onTouchAction(fn: Listener): () => void {
	listeners.add(fn);
	return () => listeners.delete(fn);
}

export function fireTouchAction(action: Action): void {
	for (const fn of listeners) fn(action);
}

/** Stick vector in [-1, 1]² for a drag of (dx, dy) px; farther than `radius` counts as full tilt. */
export function stickVector(dx: number, dy: number, radius: number): { x: number; y: number } {
	const len = Math.hypot(dx, dy);
	if (len === 0) return { x: 0, y: 0 };
	const k = len > radius ? 1 / len : 1 / radius;
	return { x: dx * k, y: dy * k };
}

/** On-screen controls show on the Android shell, or anywhere with `?touch=1` (QA on a desktop). */
export function touchControlsEnabled(kind: string, search: string): boolean {
	return kind === 'capacitor' || new URLSearchParams(search).get('touch') === '1';
}
