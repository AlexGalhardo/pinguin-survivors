/**
 * Rebindable gameplay keys (PLAN 7.1). Values are KeyboardEvent.code strings; arrow keys always
 * move as well, and menus keep their fixed keys (arrows/Enter/Esc) so a bad bind never locks
 * the player out.
 */
export const ACTIONS = ['up', 'down', 'left', 'right', 'super', 'speed', 'pause'] as const;
export type Action = (typeof ACTIONS)[number];
export type KeyBinds = Record<Action, string>;

export const DEFAULT_BINDS: KeyBinds = {
	up: 'KeyW',
	down: 'KeyS',
	left: 'KeyA',
	right: 'KeyD',
	super: 'Space',
	speed: 'Tab',
	pause: 'KeyP',
};

/** Keys that stay reserved for menus and can't be bound. */
export const RESERVED = ['Escape', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

/**
 * Binds `code` to `action`. A key already used by another action swaps with it, so every action
 * always keeps exactly one distinct key. Returns false for reserved keys.
 */
export function rebind(binds: KeyBinds, action: Action, code: string): boolean {
	if (RESERVED.includes(code)) return false;
	const other = ACTIONS.find((a) => a !== action && binds[a] === code);
	if (other) binds[other] = binds[action];
	binds[action] = code;
	return true;
}

/** Tolerant parse of saved binds: unknown or duplicated values fall back to the defaults. */
export function parseBinds(raw: unknown): KeyBinds {
	const out: KeyBinds = { ...DEFAULT_BINDS };
	if (typeof raw !== 'object' || raw === null) return out;
	const r = raw as Record<string, unknown>;
	for (const a of ACTIONS) {
		const v = r[a];
		if (typeof v === 'string' && v.length > 0 && !RESERVED.includes(v)) out[a] = v;
	}
	const used = new Set<string>();
	for (const a of ACTIONS) {
		if (used.has(out[a])) return { ...DEFAULT_BINDS };
		used.add(out[a]);
	}
	return out;
}

/** Short label for a KeyboardEvent.code ("KeyW" → "W", "Digit1" → "1"). */
export function keyLabel(code: string): string {
	if (code.startsWith('Key')) return code.slice(3);
	if (code.startsWith('Digit')) return code.slice(5);
	if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`;
	return code;
}
