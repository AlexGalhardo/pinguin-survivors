/**
 * Gamepad helpers (standard mapping: DualSense / Xbox in Chrome, Edge and Firefox).
 * Pure functions, no DOM: the bridge in core/gamepad.ts feeds them.
 */

/** Standard mapping button indices. */
export const PAD = {
	south: 0, // Cross / A
	east: 1, // Circle / B
	west: 2, // Square / X
	north: 3, // Triangle / Y
	l1: 4,
	r1: 5,
	select: 8, // Share / View
	start: 9, // Options / Menu
	up: 12,
	down: 13,
	left: 14,
	right: 15,
} as const;

/** Keyboard code each button emulates (menus reuse the keyboard handlers). */
export const BUTTON_KEYS: Record<number, string> = {
	[PAD.south]: 'Enter',
	[PAD.east]: 'Escape',
	[PAD.west]: 'KeyR',
	[PAD.north]: 'KeyL',
	[PAD.start]: 'Escape',
	[PAD.up]: 'ArrowUp',
	[PAD.down]: 'ArrowDown',
	[PAD.left]: 'ArrowLeft',
	[PAD.right]: 'ArrowRight',
};

/** Radial deadzone with rescaling so the output still reaches 1. */
export function applyDeadzone(x: number, y: number, deadzone: number): { x: number; y: number } {
	const len = Math.hypot(x, y);
	if (len <= deadzone) return { x: 0, y: 0 };
	const scaled = Math.min(1, (len - deadzone) / (1 - deadzone));
	return { x: (x / len) * scaled, y: (y / len) * scaled };
}

/** Buttons that changed between two frames. */
export function buttonEdges(
	prev: readonly boolean[],
	cur: readonly boolean[],
): { pressed: number[]; released: number[] } {
	const pressed: number[] = [];
	const released: number[] = [];
	const n = Math.max(prev.length, cur.length);
	for (let i = 0; i < n; i++) {
		const a = prev[i] ?? false;
		const b = cur[i] ?? false;
		if (b && !a) pressed.push(i);
		else if (a && !b) released.push(i);
	}
	return { pressed, released };
}

/** Converts the stick into a menu direction (for arrow key taps), or null in the center. */
export function stickDirection(
	x: number,
	y: number,
	threshold: number,
): 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | null {
	if (Math.max(Math.abs(x), Math.abs(y)) < threshold) return null;
	if (Math.abs(x) > Math.abs(y)) return x > 0 ? 'ArrowRight' : 'ArrowLeft';
	return y > 0 ? 'ArrowDown' : 'ArrowUp';
}
